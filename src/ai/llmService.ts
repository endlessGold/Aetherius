import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export interface LLMService {
  generateResponse(prompt: string, context?: string): Promise<string>;
  generateDecision(prompt: string, schema: unknown): Promise<unknown>;
}

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

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
  private model: GenerativeModel | null = null;
  private modelName: string;

  constructor(modelName?: string) {
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 8192,
        },
      });
    }
  }

  private async generate(prompt: string, systemInstruction?: string, temperature = 0.6): Promise<string> {
    if (!this.model) return 'The spirits are silent...';

    const fullPrompt = systemInstruction
      ? `${systemInstruction}\n\n---\n\n${prompt}`
      : prompt;
    let lastError: unknown;
    let backoffMs = INITIAL_BACKOFF_MS;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.model.generateContent(fullPrompt);
        return (result.response as { text(): string }).text().trim();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryableError(error)) {
          await sleep(backoffMs);
          backoffMs *= 2;
          continue;
        }
        const msg = error instanceof Error ? error.message : String(error);
        return `Error invoking Gemini: ${msg}`;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    return `Error invoking Gemini: ${msg}`;
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    return this.generate(prompt, context || 'You are a simulation assistant.');
  }

  async generateDecision(prompt: string, _schema: unknown): Promise<unknown> {
    if (!this.model) return null;

    const system = 'You are an AI controller for a simulation. Output ONLY valid JSON (no markdown, no code block).';
    try {
      const text = await this.generate(prompt, system, 0.2);
      return safeJsonParse(text);
    } catch {
      return null;
    }
  }
}

export function createDefaultLLMService(): LLMService {
  return new GeminiLLMService();
}
