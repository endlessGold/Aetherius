/**
 * POST /api/events — 월드 이벤트 JSON을 DB 호스팅(persistence)에 업로드.
 * body: WorldEventPayload (worldId, tick, type, location, details)
 */

import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';
import type { WorldEventPayload } from '../../../data/noSqlAdapter.js';

export const handlePostEvents = (session: WorldSession) => async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const body = req.body as WorldEventPayload | undefined;
  if (!body || typeof body.worldId !== 'string' || typeof body.tick !== 'number' || typeof body.type !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, type: string, location: { x, y }, details? }'
    });
    return;
  }

  const payload: WorldEventPayload = {
    worldId: body.worldId,
    tick: body.tick,
    type: body.type,
    location:
      body.location && typeof body.location.x === 'number' && typeof body.location.y === 'number'
        ? { x: body.location.x, y: body.location.y }
        : { x: 0, y: 0 },
    details: body.details
  };

  try {
    await session.world.persistence.saveWorldEvent(payload);
    res.json({
      success: true,
      message: 'Event uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: payload.worldId,
      tick: payload.tick,
      type: payload.type
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: msg });
  }
};
