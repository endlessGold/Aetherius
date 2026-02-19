import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

function getSecret() {
  const raw = process.env.AETHERIUS_AUTH_SECRET;
  if (!raw) throw new Error('AETHERIUS_AUTH_SECRET is not set');
  return new TextEncoder().encode(raw);
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function issueToken(subject, roles = ['player']) {
  const secret = getSecret();
  return new SignJWT({ sub: subject, roles })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function verifyRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return { ok: false, status: 401, message: 'Missing Authorization: Bearer <token>' };

  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return { ok: true, subject: payload.sub || 'user', roles: payload.roles || ['player'] };
  } catch {
    return { ok: false, status: 401, message: 'Invalid token' };
  }
}

export function verifyPassword(username, password) {
  const expectedUser = process.env.AETHERIUS_AUTH_USERNAME || 'admin';
  const expectedPass = process.env.AETHERIUS_AUTH_PASSWORD;
  if (!expectedPass) throw new Error('AETHERIUS_AUTH_PASSWORD is not set');
  return timingSafeEqual(username, expectedUser) && timingSafeEqual(password, expectedPass);
}
