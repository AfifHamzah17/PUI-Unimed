import http from 'node:http';
import { createApp } from '../src/app.js';
import { createAuth } from '../src/auth.js';
import { loadConfig } from '../src/config.js';
import { createRateLimiter } from '../src/ratelimit.js';
import { createService } from '../src/service.js';
import { createSessions } from '../src/session.js';
import { createUploads } from '../src/uploads.js';
import { createUsers } from '../src/users.js';
import { createMemoryStore } from '../src/stores/memory.js';

process.env.LOG_LEVEL = 'silent';
export const ADMIN_EMAIL = 'admin@pui.test';
export const ADMIN_TEMP = 'Sementara123';
export const ADMIN_PW = 'AdminKuat123';
export const USER_PW = 'PenggunaKuat1';
const SECRET = 's3cret-'.padEnd(40, 'x');

export const fakeSigner = {
  calls: [],
  async sign(args) {
    this.calls.push(args);
    return `https://signed.example/${args.path}?sig=abc`;
  },
};

/** Jam yang bisa digeser agar masa berlaku sesi dan "hari ini" bisa diuji tanpa menunggu. */
export function makeClock(iso = '2026-10-08T03:00:00Z') {
  const c = { ms: Date.parse(iso), now: () => new Date(c.ms), advance: (ms) => { c.ms += ms; } };
  return c;
}

export async function startServer({ env = {}, store = createMemoryStore(), signer = fakeSigner, clock = makeClock() } = {}) {
  const config = loadConfig({
    SESSION_SECRET: SECRET, SCRYPT_N: '1024', ALLOWED_ORIGINS: 'https://pui.example', GCS_BUCKET: 'bkt',
    CACHE_TTL_MS: '60000', REGISTRATION_MAX_PER_HOUR: '3', LOGIN_MAX_FAILURES: '5',
    BOOTSTRAP_ADMIN_EMAIL: ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD: ADMIN_TEMP, ...env,
  });
  const sessions = createSessions({ secret: config.sessionSecret, ttlSeconds: config.sessionTtlSeconds, now: () => clock.ms });
  const users = createUsers({ store, sessions, config, now: clock.now });
  await users.bootstrap();
  const app = createApp({
    config, users, auth: createAuth({ users }),
    service: createService({ store, config, now: clock.now }),
    uploads: createUploads({ config, signer, now: clock.now }),
    limiter: createRateLimiter({ ...config.registrationLimit, now: () => clock.ms }),
    loginLimiter: createRateLimiter({ ...config.loginLimit, now: () => clock.ms }),
  });
  const server = http.createServer(app.handle);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { body, token, headers = {}, raw } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* bukan JSON */ }
    return { status: res.status, json, headers: res.headers, text };
  };

  /** Masuk dengan kata sandi sementara lalu menggantinya, supaya token bisa dipakai untuk konten. */
  const activate = async (email, temp, final) => {
    const login = await call('POST', '/auth/login', { body: { email, password: temp } });
    const done = await call('POST', '/auth/change-password', { token: login.json.token, body: { oldPassword: temp, newPassword: final } });
    if (done.status !== 200) throw new Error(`aktivasi gagal: ${done.text}`);
    return done.json.token;
  };
  let adminToken;
  try {
    adminToken = await activate(ADMIN_EMAIL, ADMIN_TEMP, ADMIN_PW);
  } catch (e) {
    server.closeAllConnections?.();
    server.close();
    throw e;
  }
  const makeUser = async (name = 'Staf Satu', email = 'staf1@pui.test', temp = 'Awal12345') => {
    const r = await call('POST', '/users', { token: adminToken, body: { name, email, password: temp } });
    if (r.status !== 201) throw new Error(`buat user gagal: ${r.text}`);
    return { ...r.json, token: await activate(email, temp, USER_PW), email };
  };

  return { base, call, store, config, clock, adminToken, makeUser, activate, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) };
}

export const kegiatan = (o = {}) => ({ title: 'Workshop A', type: 'workshop', date: '2026-11-14', mode: 'luring', location: 'Medan', summary: 'Ringkas', ...o });
export const publikasi = (o = {}) => ({ title: 'Artikel A', type: 'jurnal', year: 2026, authors: ['Siti', 'Budi'], venue: 'Jurnal X', volume: '1(1)', abstract: '', keywords: ['literasi'], pdfUrl: '/docs/a.pdf', ...o });
export const kerjasama = (o = {}) => ({ partner: 'Universitas Mitra', scope: 'dalam-negeri', kind: 'MoU', summary: '', ...o });
export const doc = (...blocks) => ({ type: 'doc', content: blocks });
export const para = (text, marks) => ({ type: 'paragraph', content: [{ type: 'text', text, ...(marks ? { marks } : {}) }] });
