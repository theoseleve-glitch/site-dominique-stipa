import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signSession, verifySession } from './auth';

const secret = 'test-secret-0123456789abcdef0123456789abcdef';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('correct horse batterx', hash)).toBe(false);
  });
  it('produces different hashes for the same password (random salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
  it('rejects malformed hashes without throwing', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});

describe('sessions', () => {
  it('round-trips an email', () => {
    const token = signSession('papa@example.com', secret, 1000);
    expect(verifySession(token, secret)).toBe('papa@example.com');
  });
  it('rejects a tampered token', () => {
    const token = signSession('papa@example.com', secret, 1000);
    const [payload, sig] = token.split('.');
    expect(verifySession(`${payload}x.${sig}`, secret)).toBeNull();
    expect(verifySession(`${payload}.${sig.slice(0, -2)}aa`, secret)).toBeNull();
  });
  it('rejects a token signed with another secret', () => {
    const token = signSession('papa@example.com', 'other-secret', 1000);
    expect(verifySession(token, secret)).toBeNull();
  });
  it('rejects an expired token', () => {
    const token = signSession('papa@example.com', secret, -1);
    expect(verifySession(token, secret)).toBeNull();
  });
  it('rejects garbage', () => {
    expect(verifySession('', secret)).toBeNull();
    expect(verifySession('nope', secret)).toBeNull();
  });
});
