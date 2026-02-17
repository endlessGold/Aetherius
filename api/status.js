import { getState } from './_state.js';
import { verifyRequest } from './_auth.js';

export default async function handler(req, res) {
  const auth = await verifyRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const id = req.query?.id ? String(req.query.id) : '';
  const { handler: commandHandler } = await getState();
  const result = await commandHandler.execute(`status ${id}`.trim());
  res.status(200).json(result);
}

