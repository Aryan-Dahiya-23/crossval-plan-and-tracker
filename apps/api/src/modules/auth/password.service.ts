import crypto from 'node:crypto';

const SALT_BYTE_LENGTH = 32;
const KEY_BYTE_LENGTH = 64;

// Recommended OWASP scrypt parameters
const SCRYPT_OPTIONS: crypto.ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

function scryptDerive(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

/**
 * Hashes a plaintext password using crypto.scrypt with a unique cryptographically random salt.
 * Returns formatted string: "<saltHex>:<derivedKeyHex>".
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('Password must be a non-empty string.');
  }

  const salt = crypto.randomBytes(SALT_BYTE_LENGTH);
  const derivedKey = await scryptDerive(plaintext, salt, KEY_BYTE_LENGTH, SCRYPT_OPTIONS);

  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export async function verifyPassword(plaintext: string, storedHash: string): Promise<boolean> {
  if (
    typeof plaintext !== 'string' ||
    typeof storedHash !== 'string' ||
    plaintext.length === 0 ||
    storedHash.length === 0
  ) {
    return false;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const saltHex = parts[0];
  const storedKeyHex = parts[1];

  if (!saltHex || !storedKeyHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(storedKeyHex, 'hex');

    if (salt.length !== SALT_BYTE_LENGTH || storedKey.length !== KEY_BYTE_LENGTH) {
      return false;
    }

    const derivedKey = await scryptDerive(plaintext, salt, KEY_BYTE_LENGTH, SCRYPT_OPTIONS);

    return crypto.timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}
