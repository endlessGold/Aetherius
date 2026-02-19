import { getState } from './_state.js';
import { verifyRequest } from './_auth.js';

/**
 * POST /api/events — WorldEventPayload JSON을 DB 호스팅(Atlas 등)에 업로드.
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
  if (typeof body.worldId !== 'string' || typeof body.tick !== 'number' || typeof body.type !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid body: need { worldId: string, tick: number, type: string, location: { x, y }, details? }'
    });
    return;
  }

  const payload = {
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
    const { session } = await getState();
    await session.world.persistence.saveWorldEvent(payload);
    res.status(200).json({
      success: true,
      message: 'Event uploaded to DB.',
      driver: session.world.persistence.driver,
      worldId: payload.worldId,
      tick: payload.tick,
      type: payload.type
    });
  } catch (err) {
    const msg = err?.message || String(err);
    res.status(500).json({ success: false, message: msg });
  }
}
