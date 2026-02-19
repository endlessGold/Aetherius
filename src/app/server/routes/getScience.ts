import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

/**
 * 런타임(서버) 실행 중 과학자 위원회 호출.
 * GET /api/science?q=질문  또는  POST /api/science { "query": "질문", "executeActions": true }
 * ?lang=ko 또는 body.lang=ko 또는 AETHERIUS_OUTPUT_LANG=ko 시 응답 message를 한국어로 번역 (CLI에 --ko 전달).
 */
export const handleGetScience = (session: WorldSession) => async (req: Request, res: Response) => {
    const q = (req.query.q as string) || (req.body?.query as string);
    if (!q || typeof q !== 'string' || !q.trim()) {
        res.status(400).json({ success: false, message: 'Missing "q" (query string) or body "query".' });
        return;
    }
    const executeActions = Boolean(req.body?.executeActions);
    const translateToKo = (req.query.lang as string)?.toLowerCase() === 'ko' || (req.body?.lang as string)?.toLowerCase() === 'ko' || process.env.AETHERIUS_OUTPUT_LANG === 'ko';
    const cmdStr = [q.trim(), executeActions ? '--execute' : '', translateToKo ? '--ko' : ''].filter(Boolean).join(' ');

    try {
        const result = await session.enqueueRequest('command', { cmdStr });
        res.json(result);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: msg });
    }
};
