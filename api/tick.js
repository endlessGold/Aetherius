import { getState } from './_state.js';
import { verifyRequest } from './_auth.js';

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

  const count = req.body?.count ?? 1;
  const { session } = await getState();
  const result = await session.tickNow(count);
  res.status(200).json(result);
}

