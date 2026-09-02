import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 32 };

/** Returns "scrypt$N$r$p$salt$hash" (salt and hash in base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

/** Constant-time verification; never throws on malformed input. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, n, r, p, saltB64, hashB64] = stored.split('$');
    if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
    const N = Number(n);
    const R = Number(r);
    const P = Number(p);
    if (![N, R, P].every((v) => Number.isInteger(v) && v > 0)) return false;
    const expected = Buffer.from(hashB64, 'base64');
    const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
      N,
      r: R,
      p: P,
      maxmem: 128 * N * R * 2,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

const b64url = (b: Buffer) => b.toString('base64url');

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Token = base64url(JSON{ e: email, x: expiryMs }) + "." + HMAC. */
export function signSession(email: string, secret: string, ttlMs: number): string {
  const payload = b64url(Buffer.from(JSON.stringify({ e: email, x: Date.now() + ttlMs })));
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the email when the token is authentic and not expired, else null. */
export function verifySession(token: string, secret: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { e?: unknown; x?: unknown };
    if (typeof data.e !== 'string' || typeof data.x !== 'number') return null;
    if (data.x < Date.now()) return null;
    return data.e;
  } catch {
    return null;
  }
}
