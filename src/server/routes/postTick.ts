import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

export const handlePostTick = (session: WorldSession) => async (req: Request, res: Response) => {
    const count = req.body.count || 1;
    
    try {
        const result = await session.tickNow(count);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
