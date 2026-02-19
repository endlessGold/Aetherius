import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

export const handlePostCommand = (session: WorldSession) => async (req: Request, res: Response) => {
    const { cmd } = req.body;
    if (!cmd) {
        res.status(400).json({ success: false, message: 'Missing "cmd" field in body.' });
        return;
    }

    try {
        const result = await session.enqueueRequest('command', { cmdStr: cmd });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
