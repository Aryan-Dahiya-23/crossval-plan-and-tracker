import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.service.js';

describe('password.service', () => {
  it('hashes a password and produces a unique salt each time', async () => {
    const password = 'correct-horse-battery-staple';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}:[0-9a-f]{128}$/);
    expect(hash2).toMatch(/^[0-9a-f]{64}:[0-9a-f]{128}$/);
  });

  it('successfully verifies a valid password', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword123!', hash);
    expect(isValid).toBe(false);
  });

  it('rejects malformed or empty hashes safely without throwing', async () => {
    expect(await verifyPassword('pass', '')).toBe(false);
    expect(await verifyPassword('pass', 'malformed-hash')).toBe(false);
    expect(await verifyPassword('pass', 'abc:def')).toBe(false);
    expect(await verifyPassword('', 'abc:def')).toBe(false);
  });

  it('throws when attempting to hash an empty password', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });
});
