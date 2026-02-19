/**
 * GET /api/dataset/export — 월드 스냅샷 + tick 구간 이벤트를 JSONL로 반환.
 * query: worldId (기본: 세션 월드), fromTick, toTick, limit
 */

import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

export const handleGetDatasetExport = (session: WorldSession) => async (req: Request, res: Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const worldId = (req.query.worldId as string) || session.world.id;
  const fromTick = req.query.fromTick != null ? Number(req.query.fromTick) : undefined;
  const toTick = req.query.toTick != null ? Number(req.query.toTick) : undefined;
  const limit = req.query.limit != null ? Math.min(50000, Math.max(1, Number(req.query.limit))) : 10000;

  try {
    const persistence = session.world.persistence;
    const [snapshot, events] = await Promise.all([
      persistence.getLatestSnapshot(worldId),
      persistence.getWorldEvents(worldId, { fromTick, toTick, limit })
    ]);

    const lines: string[] = [];
    if (snapshot) {
      lines.push(JSON.stringify({ rowType: 'snapshot', ...snapshot }));
    }
    for (const ev of events) {
      lines.push(JSON.stringify({ rowType: 'event', ...ev }));
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="dataset-${worldId}-${Date.now()}.jsonl"`);
    res.send(lines.join('\n'));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: msg });
  }
};
