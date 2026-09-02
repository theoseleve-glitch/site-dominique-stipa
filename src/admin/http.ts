import type { AstroCookies } from 'astro';
import { env } from './env';
import { signSession, verifySession } from './auth';

export const SESSION_COOKIE = 'admin_session';
export const FLASH_COOKIE = 'admin_flash';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const cookieBase = {
  path: '/admin',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: import.meta.env.PROD,
};

export function currentEmail(cookies: AstroCookies): string | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifySession(token, env().sessionSecret);
  } catch {
    return null;
  }
}

export function startSession(cookies: AstroCookies, email: string): void {
  cookies.set(SESSION_COOKIE, signSession(email, env().sessionSecret, SESSION_TTL_MS), {
    ...cookieBase,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function endSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/admin' });
}

export type Flash = { type: 'ok' | 'error'; text: string };

export function setFlash(cookies: AstroCookies, flash: Flash): void {
  cookies.set(FLASH_COOKIE, JSON.stringify(flash), { ...cookieBase, maxAge: 60 });
}

/** Reads and clears the one-shot message. */
export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  cookies.delete(FLASH_COOKIE, { path: '/admin' });
  try {
    const parsed = JSON.parse(raw) as Partial<Flash>;
    if ((parsed.type === 'ok' || parsed.type === 'error') && typeof parsed.text === 'string') {
      return { type: parsed.type, text: parsed.text };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Forms are same-site only. Modern browsers send Sec-Fetch-Site; older ones send Origin.
 * A request with neither is treated as same-origin (non-browser clients cannot carry the
 * HttpOnly session cookie anyway).
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Message for the user when a save fails, without leaking internals. */
export function describeError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string') {
    const msg = (err as Error).message;
    if (msg.startsWith('GitHub') || msg.startsWith('Le jeton') || msg.startsWith('Configuration')) return msg;
    return `Erreur : ${msg}`;
  }
  return 'Erreur inattendue.';
}

/** Best-effort login throttle per function instance: 5 failures → 60 s pause. */
const failures = new Map<string, { count: number; until: number }>();
export function loginBlocked(key: string): boolean {
  const f = failures.get(key);
  return !!f && f.count >= 5 && f.until > Date.now();
}
export function recordLoginFailure(key: string): void {
  const f = failures.get(key) ?? { count: 0, until: 0 };
  f.count += 1;
  f.until = Date.now() + 60_000;
  failures.set(key, f);
}
export function clearLoginFailures(key: string): void {
  failures.delete(key);
}
