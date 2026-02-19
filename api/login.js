import { issueToken, verifyPassword } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'username/password required' });
      return;
    }

    const ok = verifyPassword(username, password);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = await issueToken(username);
    res.status(200).json({ success: true, token });
  } catch (e) {
    res.status(500).json({ success: false, message: String(e?.message || e) });
  }
}

