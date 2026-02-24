import { GoogleGenAI } from '@google/genai';

export interface ControlService {
  generateResponse(prompt: string, context?: string): Promise<string>;
  generateDecision(prompt: string, schema: unknown): Promise<unknown>;
  getModelName(): string;
  isEnabled(): boolean;
}

export interface LLMService extends ControlService {
  // Marker interface for LLM-based services
}

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const s = msg.toLowerCase();
  return (
    s.includes('429') ||
    s.includes('resource_exhausted') ||
    s.includes('resource has been exhausted') ||
    s.includes('503') ||
    s.includes('500') ||
    s.includes('unavailable')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type LLMJobFn<T> = () => Promise<T>;

class LLMWorkerPool {
  private maxConcurrency: number;
  private activeCount = 0;
  private queue: Array<{ fn: LLMJobFn<unknown>; resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = [];

  constructor(maxConcurrency: number) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  run<T>(fn: LLMJobFn<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as LLMJobFn<unknown>,
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.activeCount >= this.maxConcurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.activeCount++;
    (async () => {
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeCount--;
        this.processNext();
      }
    })();
  }
}

const rawMaxConcurrency = Number(process.env.AETHERIUS_LLM_MAX_CONCURRENCY || '2');
const resolvedMaxConcurrency = Number.isFinite(rawMaxConcurrency) && rawMaxConcurrency > 0 ? rawMaxConcurrency : 2;
const globalLLMPool = new LLMWorkerPool(resolvedMaxConcurrency);

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Gemini API 기반 LLM 서비스.
 * .env의 GEMINI_API_KEY를 사용한다. 없으면 AI 기능은 무음 처리(빈 응답/ null 반환).
 */
export class GeminiLLMService implements LLMService {
  private client: GoogleGenAI | null = null;
  private modelName: string;
  private readonly modelCandidates: string[];
  private currentModelIndex = 0;
  private hasAnySuccess = false;

  constructor(modelName?: string) {
    const envModel = process.env.GEMINI_MODEL?.trim();
    const primary = modelName || envModel || 'gemini-3-flash-preview';
    const fallbackEnv = process.env.GEMINI_FALLBACK_MODELS?.trim();
    const fallbackList = fallbackEnv
      ? fallbackEnv.split(',').map((m) => m.trim()).filter(Boolean)
      : [
        'gemini-flash-latest',
        'gemini-2.5-flash',
      ];
    this.modelCandidates = [primary, ...fallbackList];
    this.currentModelIndex = 0;
    this.modelName = this.modelCandidates[0];
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch {
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  private async generate(prompt: string, systemInstruction?: string, temperature = 0.6): Promise<string> {
    if (!this.client) return 'The spirits are silent...';
    return globalLLMPool.run(() => this.generateWithRetries(prompt, systemInstruction, temperature));
  }

  private async generateWithRetries(prompt: string, systemInstruction?: string, temperature = 0.6): Promise<string> {
    const fullPrompt = systemInstruction
      ? `${systemInstruction}\n\n---\n\n${prompt}`
      : prompt;
    let lastError: unknown;
    let backoffMs = INITIAL_BACKOFF_MS;

    for (let modelIdx = this.currentModelIndex; modelIdx < this.modelCandidates.length; modelIdx++) {
      const model = this.modelCandidates[modelIdx];
      this.modelName = model;
      backoffMs = INITIAL_BACKOFF_MS;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await this.client!.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
              temperature,
              maxOutputTokens: 8192,
            },
          });

          const anyResult = result as any;
          let text: string = '';
          if (typeof anyResult.text === 'string') {
            text = anyResult.text.trim();
          } else if (anyResult.response && typeof anyResult.response.text === 'function') {
            const t = anyResult.response.text();
            text = typeof t === 'string' ? t.trim() : '';
          }
          this.hasAnySuccess = true;
          this.currentModelIndex = modelIdx;
          return text;
        } catch (error) {
          lastError = error;
          const msg = error instanceof Error ? error.message : String(error);
          const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('resource_exhausted');

          if (attempt < MAX_RETRIES && isRetryableError(error)) {
            const match = msg.match(/retry in ([0-9.]+)s/);
            let waitTime = backoffMs;
            if (match && match[1]) {
              waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
            } else if (isRateLimit) {
              waitTime = Math.max(backoffMs, 5000);
            }

            console.warn(`[LLM] Error (model=${model}, attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${msg.slice(0, 100)}... Retrying in ${waitTime}ms`);
            await sleep(waitTime);
            backoffMs = Math.min(backoffMs * 2, 60000);
            continue;
          }

          if (isRateLimit && this.hasAnySuccess && modelIdx < this.modelCandidates.length - 1) {
            console.warn(`[LLM] Rate limited on model=${model} after retries; switching to next candidate.`);
            break;
          }

          return `Error invoking Gemini: ${msg}`;
        }
      }
    }

    const msg = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
    return `Error invoking Gemini: ${msg}`;
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    return this.generate(prompt, context || 'You are a simulation assistant.');
  }

  async generateDecision(prompt: string, _schema: unknown): Promise<unknown> {
    if (!this.client) return null;

    const system = 'You are an AI controller for a simulation. Output ONLY valid JSON (no markdown, no code block).';
    try {
      const text = await this.generate(prompt, system, 0.2);
      return safeJsonParse(text);
    } catch {
      return null;
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  isEnabled(): boolean {
    return !!this.client;
  }
}

export class OpenRouterLLMService implements LLMService {
  private apiKey: string | null;
  private modelName: string;

  constructor(modelName?: string) {
    this.apiKey = process.env.OPENROUTER_API_KEY?.trim() || null;
    const envModel = process.env.OPENROUTER_MODEL?.trim();
    this.modelName = modelName || envModel || 'qwen/qwen3-8b';
  }

  private async callOpenRouter(prompt: string, systemInstruction?: string, temperature = 0.6): Promise<string> {
    if (!this.apiKey) return 'OpenRouter API key not configured.';
    const messages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      return 'fetch is not available in this runtime.';
    }

    const res = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://aetherius.local',
        'X-Title': process.env.OPENROUTER_TITLE || 'Aetherius Simulation',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature,
        stream: false,
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      const statusText = typeof res.statusText === 'string' ? res.statusText : '';
      return `Error invoking OpenRouter: HTTP ${res.status} ${statusText} ${bodyText.slice(0, 200)}`;
    }

    const json = await res.json();
    const first = json && json.choices && json.choices[0];
    if (!first) return '';
    const content = first.message && first.message.content;
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      const joined = content
        .map((p: unknown) => {
          const part = p as { text?: string; content?: string };
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
          return '';
        })
        .join('');
      return joined.trim();
    }
    return '';
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    if (!this.apiKey) return 'OpenRouter API key not configured.';
    return globalLLMPool.run(() => this.callOpenRouter(prompt, context || 'You are asimulation assistant.'));
  }

  async generateDecision(prompt: string, _schema: unknown): Promise<unknown> {
    if (!this.apiKey) return null;
    const system = 'You are an AI controller for a simulation. Output ONLY valid JSON (no markdown, no code block).';
    const text = await globalLLMPool.run(() => this.callOpenRouter(prompt, system, 0.2));
    return safeJsonParse(text);
  }

  getModelName(): string {
    return this.modelName;
  }

  isEnabled(): boolean {
    return !!this.apiKey;
  }
}

export class NativeService implements ControlService {
  async generateResponse(_prompt: string, _context?: string): Promise<string> {
    return '[System::Native] External AI disconnected. Native system operational.';
  }

  async generateDecision(_prompt: string, _schema: unknown): Promise<unknown> {
    return null;
  }

  getModelName(): string {
    return 'native-service-v1';
  }

  isEnabled(): boolean {
    return false;
  }
}

export function createControlService(): ControlService {
  const enabled = (process.env.AETHERIUS_LLM_ENABLED ?? '1') !== '0';
  if (!enabled) {
    return new NativeService();
  }

  const provider = (process.env.AETHERIUS_LLM_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'openrouter') {
    return new OpenRouterLLMService();
  }
  return new GeminiLLMService();
}
