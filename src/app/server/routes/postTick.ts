import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';

function wantsJson5(req: Request): boolean {
    const format = (req.query.format as string | undefined)?.toLowerCase();
    if (format === 'json5') return true;
    const accept = req.headers['accept'];
    if (typeof accept === 'string' && accept.includes('application/json5')) return true;
    if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
    return false;
}

export const handlePostTick = (session: WorldSession) => async (req: Request, res: Response) => {
    const count = req.body.count || 1;

    try {
        const result = await session.tickNow(count);
        if (wantsJson5(req)) {
            res.setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(result));
            return;
        }
        res.json(result);
    } catch (error: any) {
        const body = { success: false, message: error.message };
        if (wantsJson5(req)) {
            res.status(500).setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(body));
            return;
        }
        res.status(500).json(body);
    }
};
