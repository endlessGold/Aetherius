import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

/**
 * 런타임(서버) 실행 중 과학자 위원회 호출.
 * GET /api/science?q=질문  또는  POST /api/science { "query": "질문" }
 */
export const handleGetScience = (session: WorldSession) => async (req: Request, res: Response) => {
    const q = (req.query.q as string) || (req.body?.query as string);
    if (!q || typeof q !== 'string' || !q.trim()) {
        res.status(400).json({ success: false, message: 'Missing "q" (query string) or body "query".' });
        return;
    }

    try {
        const result = await session.enqueueRequest('command', { cmdStr: `ask_science ${q.trim()}` });
        res.json(result);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: msg });
    }
};
