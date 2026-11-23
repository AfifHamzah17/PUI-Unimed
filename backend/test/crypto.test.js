import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/passwords.js';
import { createSessions } from '../src/session.js';

describe('hash kata sandi', () => {
  test('hash berbeda tiap panggilan (garam acak) tetapi sama-sama terverifikasi', async () => {
    const a = await hashPassword('Rahasia123', { N: 1024 });
    const b = await hashPassword('Rahasia123', { N: 1024 });
    assert.notEqual(a, b);
    assert.match(a, /^scrypt\$1024\$8\$1\$/);
    assert.equal(await verifyPassword('Rahasia123', a), true);
    assert.equal(await verifyPassword('Rahasia123', b), true);
  });
  test('kata sandi salah dan huruf besar/kecil berbeda ditolak', async () => {
    const h = await hashPassword('Rahasia123', { N: 1024 });
    assert.equal(await verifyPassword('rahasia123', h), false);
    assert.equal(await verifyPassword('', h), false);
  });
  test('hash rusak -> false, bukan error', async () => {
    for (const bad of ['', 'abc', 'scrypt$x$y$z$a$b', 'bcrypt$1$2$3$4$5', null, undefined]) assert.equal(await verifyPassword('x', bad), false);
  });
  test('plaintext tidak muncul dalam hash', async () => {
    assert.doesNotMatch(await hashPassword('Rahasia123', { N: 1024 }), /Rahasia123/);
  });
});

describe('token sesi', () => {
  let t = 1_800_000_000_000;
  const s = createSessions({ secret: 'k'.repeat(40), ttlSeconds: 3600, now: () => t });
  const issued = s.issue({ sub: 'u1', ver: 3 });
  test('terbit dan terverifikasi dengan masa berlaku', () => {
    assert.deepEqual(s.verify(issued.token), { sub: 'u1', ver: 3 });
    assert.equal(issued.expiresAt, new Date(t + 3600_000).toISOString());
  });
  test('kedaluwarsa', () => {
    t += 3601_000;
    assert.equal(s.verify(issued.token), null);
    t -= 3601_000;
  });
  test('payload diubah -> ditolak', () => {
    const [body, sig] = issued.token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'u1', ver: 3, exp: 9_999_999_999 })).toString('base64url');
    assert.equal(s.verify(`${forged}.${sig}`), null);
    assert.ok(body);
  });
  test('rahasia lain -> ditolak', () => {
    const other = createSessions({ secret: 'z'.repeat(40), ttlSeconds: 3600, now: () => t });
    assert.equal(other.verify(issued.token), null);
  });
  test('sampah dan segmen berlebih -> null', () => {
    for (const bad of ['', 'a', 'a.b', `${issued.token}.x`, null, undefined, 12, '.']) assert.equal(s.verify(bad), null);
  });
});
