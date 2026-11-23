import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEYLEN = 64;

/** scrypt dengan garam acak per pengguna. Parameter disimpan di dalam string, jadi biaya bisa dinaikkan nanti. */
export async function hashPassword(password, { N = 16384, r = 8, p = 1 } = {}) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r, p, maxmem: 256 * N * r });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every(Number.isInteger)) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  const key = await scrypt(password, salt, expected.length, { N, r, p, maxmem: 256 * N * r });
  return crypto.timingSafeEqual(key, expected);
}
