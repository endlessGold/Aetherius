/**
 * POST /api/snapshots — 스냅샷 JSON을 DB 호스팅(persistence)에 업로드.
 * body: TickSnapshot (worldId, tick, timestamp, nodes, entities 등)
 */

import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';
import type { TickSnapshot } from '../../../data/noSqlAdapter.js';

export const handlePostSnapshots = (session: WorldSession) => async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const body = req.body as TickSnapshot | undefined;
  if (!body || typeof body.worldId !== 'string' || typeof body.tick !== 'number') {
    res.status(400).json({
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, timestamp: number, nodes?, entities? }'
    });
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
    res.json({
      success: true,
      message: 'Snapshot uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: snapshot.worldId,
      tick: snapshot.tick
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: msg });
  }
};
