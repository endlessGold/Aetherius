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

export const handlePostCommand = (session: WorldSession) => async (req: Request, res: Response) => {
    const { cmd } = req.body;
    if (!cmd) {
        const body = { success: false, message: 'Missing "cmd" field in body.' };
        if (wantsJson5(req)) {
            res.status(400).setHeader('Content-Type', 'application/json5; charset=utf-8');
            res.send(JSON5.stringify(body));
            return;
        }
        res.status(400).json(body);
        return;
    }

    try {
        const result = await session.enqueueRequest('command', { cmdStr: cmd });
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
