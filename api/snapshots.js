import { getState } from './_state.js';
import { verifyRequest } from './_auth.js';

/**
 * POST /api/snapshots — TickSnapshot JSON을 DB 호스팅(Atlas 등)에 업로드.
 * Vercel Serverless에서도 동일 persistence 사용 (env에 AETHERIUS_MONGODB_URI 등 설정 시).
 */
export default async function handler(req, res) {
  const auth = await verifyRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const body = req.body || {};
  if (typeof body.worldId !== 'string' || typeof body.tick !== 'number') {
    res.status(400).json({
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, timestamp: number, nodes?, entities? }'
    });
    return;
  }

  const snapshot = {
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
    const { session } = await getState();
    await session.world.persistence.saveTickSnapshot(snapshot);
    res.status(200).json({
      success: true,
      message: 'Snapshot uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: snapshot.worldId,
      tick: snapshot.tick
    });
  } catch (err) {
    const msg = err?.message || String(err);
    res.status(500).json({ success: false, message: msg });
  }
}
