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

  const { cmd } = req.body || {};
  if (!cmd) {
    res.status(400).json({ success: false, message: 'Missing body: { cmd }' });
    return;
  }

  const { handler: commandHandler } = await getState();
  const result = await commandHandler.execute(String(cmd));
  res.status(200).json(result);
}

