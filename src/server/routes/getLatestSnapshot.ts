import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

export const handleGetLatestSnapshot = (session: WorldSession) => async (req: Request, res: Response) => {
  try {
    const snap = await session.world.persistence.getLatestSnapshot(session.world.id);
    res.json({ success: true, data: snap, driver: session.world.persistence.driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

