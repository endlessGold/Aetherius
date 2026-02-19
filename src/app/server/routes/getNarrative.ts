import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';
import { NarrativeOrchestrator } from '../../../ai/narrativeOrchestrator.js';
import { createDefaultLLMService } from '../../../ai/llmService.js';
import { translateToKorean } from '../../../ai/translate.js';

function wantsJson5(req: Request): boolean {
  const format = (req.query.format as string | undefined)?.toLowerCase();
  if (format === 'json5') return true;
  const accept = req.headers['accept'];
  if (typeof accept === 'string' && accept.includes('application/json5')) return true;
  if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
  return false;
}

export const handleGetNarrative = (session: WorldSession) => async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string)?.toLowerCase();
    const translateToKo = lang === 'ko' || process.env.AETHERIUS_OUTPUT_LANG === 'ko';
    const orchestrator = new NarrativeOrchestrator();
    const result = await orchestrator.getNarrative(session.world);
    if (translateToKo) {
      const llm = createDefaultLLMService();
      const [past, present, future, combined] = await Promise.all([
        translateToKorean(llm, result.past),
        translateToKorean(llm, result.present),
        translateToKorean(llm, result.future),
        translateToKorean(llm, result.combined)
      ]);
      const body = { past, present, future, combined };
      if (wantsJson5(req)) {
        res.setHeader('Content-Type', 'application/json5; charset=utf-8');
        res.send(JSON5.stringify(body));
        return;
      }
      return res.json(body);
    }
    const body = { past: result.past, present: result.present, future: result.future, combined: result.combined };
    if (wantsJson5(req)) {
      res.setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(body));
      return;
    }
    res.json(body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const body = { success: false, message: `Narrative failed: ${message}` };
    if (wantsJson5(req)) {
      res.status(500).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(body));
      return;
    }
    res.status(500).json(body);
  }
};
