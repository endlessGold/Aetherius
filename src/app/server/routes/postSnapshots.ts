/**
 * POST /api/snapshots — 스냅샷 JSON을 DB 호스팅(persistence)에 업로드.
 * body: TickSnapshot (worldId, tick, timestamp, nodes, entities 등)
 */

import { Request, Response } from 'express';
import JSON5 from 'json5';
import { WorldSession } from '../worldSession.js';
import type { TickSnapshot } from '../../../data/noSqlAdapter.js';

function wantsJson5(req: Request): boolean {
  const format = (req.query.format as string | undefined)?.toLowerCase();
  if (format === 'json5') return true;
  const accept = req.headers['accept'];
  if (typeof accept === 'string' && accept.includes('application/json5')) return true;
  if (Array.isArray(accept) && accept.some((v) => v.includes('application/json5'))) return true;
  return false;
}

export const handlePostSnapshots = (session: WorldSession) => async (req: Request, res: Response) => {
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

  const body = req.body as TickSnapshot | undefined;
  if (!body || typeof body.worldId !== 'string' || typeof body.tick !== 'number') {
    const resp = {
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, timestamp: number, nodes?, entities? }'
    };
    if (wantsJson5(req)) {
      res.status(400).setHeader('Content-Type', 'application/json5; charset=utf-8');
      res.send(JSON5.stringify(resp));
      return;
    }
    res.status(400).json(resp);
    return;
  }

  const snapshot: TickSnapshot = {
    worldId: body.worldId,
    tick: body.tick,
    timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
    nodes: Array.isArray(body.nodes) ? body.nodes : [],
    predictions: body.predictions,
    seed: body.seed,
    rngState: body.rngState,
    config: body.config,
    entities: Array.isArray(body.entities) ? body.entities : []
  };

  try {
    await session.world.persistence.saveTickSnapshot(snapshot);
    const resp = {
      success: true,
      message: 'Snapshot uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: snapshot.worldId,
      tick: snapshot.tick
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
