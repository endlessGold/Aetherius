import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

export const handleGetStatus = (session: WorldSession) => async (req: Request, res: Response) => {
    const id = req.params.id || '';
    
    try {
        const result = await session.enqueueRequest('status', { id });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
