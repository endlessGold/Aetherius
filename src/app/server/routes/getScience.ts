import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';

/**
 * 런타임(서버) 실행 중 과학자 위원회 호출.
 * GET /api/science?q=질문  또는  POST /api/science { "query": "질문", "executeActions": true }
 * ?lang=ko 또는 body.lang=ko 또는 AETHERIUS_OUTPUT_LANG=ko 시 응답 message를 한국어로 번역 (CLI에 --ko 전달).
 */

function wantsJson5(req: Request): boolean {
    const format = (req.query.format as string | undefined)?.toLowerCase();
    if (format === 'json5') return true;
    const accept = req.headers['accept'];
    if (typeof accept === 'string' && accept.includes('application/json5')) return true;
    if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
    return false;
}

export const handleGetScience = (session: WorldSession) => async (req: Request, res: Response) => {
    const q = (req.query.q as string) || (req.body?.query as string);
    if (!q || typeof q !== 'string' || !q.trim()) {
        const body = { success: false, message: 'Missing "q" (query string) or body "query".' };
        if (wantsJson5(req)) {
            res.status(400).setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(body));
            return;
        }
        res.status(400).json(body);
        return;
    }
    const executeActions = Boolean(req.body?.executeActions);
    const translateToKo = (req.query.lang as string)?.toLowerCase() === 'ko' || (req.body?.lang as string)?.toLowerCase() === 'ko' || process.env.AETHERIUS_OUTPUT_LANG === 'ko';
    const cmdStr = [q.trim(), executeActions ? '--execute' : '', translateToKo ? '--ko' : ''].filter(Boolean).join(' ');

    try {
        const result = await session.enqueueRequest('command', { cmdStr });
        if (wantsJson5(req)) {
            res.setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(result));
            return;
        }
        res.json(result);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        const body = { success: false, message: msg };
        if (wantsJson5(req)) {
            res.status(500).setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(body));
            return;
        }
        res.status(500).json(body);
    }
};
