import OpenAI from 'openai';

export interface LLMService {
  generateResponse(prompt: string, context?: string): Promise<string>;
  generateDecision(prompt: string, schema: any): Promise<any>;
}

function safeJsonParse(text: string): any | null {
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

export class LocalOpenAIService implements LLMService {
  private model: string;
  private client: OpenAI;
  private isAvailable: boolean = true;
  private ready: Promise<void>;
  private explicitBaseURL: boolean;
  private enabled: boolean;

  constructor(modelName?: string) {
    this.explicitBaseURL = Boolean(process.env.AETHERIUS_LLM_BASE_URL);
    this.enabled = process.env.AETHERIUS_LLM_ENABLED === '1';
    const baseURL = process.env.AETHERIUS_LLM_BASE_URL || 'http://localhost:1234/v1';
    const apiKey = process.env.AETHERIUS_LLM_API_KEY || 'local';
    this.model = modelName || process.env.AETHERIUS_LLM_MODEL || 'local-model';
    this.client = new OpenAI({ apiKey, baseURL });
    this.isAvailable = this.enabled;
    this.ready = this.enabled ? this.checkAvailability() : Promise.resolve();
  }

  private async checkAvailability() {
    try {
      const list = await this.client.models.list();
      const models = list.data?.map((m) => m.id) ?? [];
      if (models.length > 0 && !models.includes(this.model)) {
        this.model = models[0];
      }
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
      if (this.explicitBaseURL) {
        console.warn(`⚠️ [LLM] Local OpenAI-compatible server not detected at AETHERIUS_LLM_BASE_URL. AI features will be silent.`);
      }
    }
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    await this.ready;
    if (!this.isAvailable) return 'The spirits are silent...';

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        messages: [
          { role: 'system', content: context || 'You are a simulation assistant.' },
          { role: 'user', content: prompt }
        ]
      });
      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      const msg = (error as any)?.message || 'Unknown LLM error';
      return `Error invoking local LLM: ${msg}`;
    }
  }

  async generateDecision(prompt: string, schema: any): Promise<any> {
    await this.ready;
    if (!this.isAvailable) return null;

    const system = 'You are an AI controller for a simulation. Output ONLY valid JSON (no markdown).';
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' } as any
      });
      const text = response.choices?.[0]?.message?.content || '';
      return safeJsonParse(text);
    } catch {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ]
        });
        const text = response.choices?.[0]?.message?.content || '';
        return safeJsonParse(text);
      } catch {
        return null;
      }
    }
  }
}

export class MultiModelLLMService implements LLMService {
  private chat: LocalOpenAIService;
  private code: LocalOpenAIService;
  private json: LocalOpenAIService;

  constructor(options?: { chatModel?: string; codeModel?: string; jsonModel?: string }) {
    const fallback = process.env.AETHERIUS_LLM_MODEL || 'local-model';
    const chatModel = options?.chatModel || process.env.AETHERIUS_LLM_MODEL_CHAT || fallback;
    const codeModel = options?.codeModel || process.env.AETHERIUS_LLM_MODEL_CODE || fallback;
    const jsonModel = options?.jsonModel || process.env.AETHERIUS_LLM_MODEL_JSON || chatModel;

    this.chat = new LocalOpenAIService(chatModel);
    this.code = new LocalOpenAIService(codeModel);
    this.json = new LocalOpenAIService(jsonModel);
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const ctx = (context || '').toLowerCase();
    const codeLike =
      ctx.includes('codebase') ||
      ctx.includes('typescript') ||
      ctx.includes('implement') ||
      ctx.includes('implementation') ||
      ctx.includes('debug') ||
      ctx.includes('patch') ||
      ctx.includes('compile') ||
      ctx.includes('refactor');
    return (codeLike ? this.code : this.chat).generateResponse(prompt, context);
  }

  async generateDecision(prompt: string, schema: any): Promise<any> {
    return this.json.generateDecision(prompt, schema);
  }
}

export function createDefaultLLMService(): LLMService {
  return new MultiModelLLMService();
}
