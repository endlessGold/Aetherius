/**
 * POST /api/events — 월드 이벤트 JSON을 DB 호스팅(persistence)에 업로드.
 * body: WorldEventPayload (worldId, tick, type, location, details)
 */

import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';
import type { WorldEventPayload } from '../../../data/noSqlAdapter.js';

function wantsJson5(req: Request): boolean {
  const format = (req.query.format as string | undefined)?.toLowerCase();
  if (format === 'json5') return true;
  const accept = req.headers['accept'];
  if (typeof accept === 'string' && accept.includes('application/json5')) return true;
  if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
  return false;
}

export const handlePostEvents = (session: WorldSession) => async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    const body = { success: false, message: 'Method Not Allowed' };
    if (wantsJson5(req)) {
      res.status(405).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(body));
      return;
    }
    res.status(405).json(body);
    return;
  }

  const body = req.body as WorldEventPayload | undefined;
  if (!body || typeof body.worldId !== 'string' || typeof body.tick !== 'number' || typeof body.type !== 'string') {
    const resp = {
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, type: string, location: { x, y }, details? }'
    };
    if (wantsJson5(req)) {
      res.status(400).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(resp));
      return;
    }
    res.status(400).json(resp);
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
    const resp = {
      success: true,
      message: 'Event uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: payload.worldId,
      tick: payload.tick,
      type: payload.type
    };
    if (wantsJson5(req)) {
      res.setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(resp));
      return;
    }
    res.json(resp);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const resp = { success: false, message: msg };
    if (wantsJson5(req)) {
      res.status(500).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(resp));
      return;
    }
    res.status(500).json(resp);
  }
};
