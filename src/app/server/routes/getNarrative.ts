import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';
import { NarrativeOrchestrator } from '../../../ai/narrativeOrchestrator.js';
import { createDefaultLLMService } from '../../../ai/llmService.js';
import { translateToKorean } from '../../../ai/translate.js';

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
      return res.json({ past, present, future, combined });
    }
    res.json({ past: result.past, present: result.present, future: result.future, combined: result.combined });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: `Narrative failed: ${message}` });
  }
};
