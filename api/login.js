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

    const roles = resolveRoles(username);
    const token = await issueToken(username, roles);
    res.status(200).json({ success: true, token, roles });
  } catch (e) {
    res.status(500).json({ success: false, message: String(e?.message || e) });
  }
}

function resolveRoles(username) {
  if (username === 'admin') {
    return ['player', 'developer', 'system'];
  }
  if (username === 'dev') {
    return ['player', 'developer'];
  }
  return ['player'];
}
