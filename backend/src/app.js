import crypto from 'node:crypto';
import { HttpError } from './errors.js';
import { log } from './log.js';
import { CONTENT_RESOURCES, parseListParams } from './shared/collection.js';

const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60';
// Peramban selalu memvalidasi ulang lewat ETag (304 murah); hanya CDN/proxy yang boleh menahan 60 detik.
// JANGAN tambahkan stale-while-revalidate: Chrome akan menyajikan daftar lama setelah admin menyimpan.

const SMALL = 20_000;       // login, kata sandi, pengguna, sorotan
const CONTENT = 400_000;    // konten dengan teks kaya
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const compile = (pattern) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:([a-z]+)/g, (_, k) => (keys.push(k), '([^/]+)'))}/?$`);
  return { re, keys };
};

function send(res, status, data, headers = {}) {
  const body = data === undefined ? '' : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(status === 204 || status === 304 ? undefined : body);
}

async function readJson(req, max) {
  if (Number(req.headers['content-length'] || 0) > max) throw new HttpError(413, 'Isi permintaan terlalu besar.');
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'Content-Type harus application/json.');
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > max) throw new HttpError(413, 'Isi permintaan terlalu besar.');
    chunks.push(c);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'JSON tidak valid.');
  }
}

const simplePaging = (query, d = 10) => ({
  q: (query.get('q') ?? '').slice(0, 100),
  page: Math.max(1, parseInt(query.get('page') ?? '1', 10) || 1),
  pageSize: Math.min(50, Math.max(1, parseInt(query.get('pageSize') ?? String(d), 10) || d)),
});

const clientIp = (req) => {
  // Cloud Run menambahkan IP klien sungguhan di akhir X-Forwarded-For; entri sebelumnya bisa dipalsukan klien.
  const parts = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.at(-1) || req.socket.remoteAddress || 'unknown';
};

export function createApp({ config, service, users, auth, uploads, limiter, loginLimiter }) {
  const routes = [];
  const add = (method, pattern, handler, opts = {}) => routes.push({ method, ...compile(pattern), handler, opts });
  const known = (p) => {
    if (!CONTENT_RESOURCES.includes(p.resource)) throw new HttpError(404, 'Tidak ditemukan.');
    return p.resource;
  };
  const priv = (body, status = 200) => ({ status, body });

  // ---------- umum ----------
  add('GET', '/healthz', async () => ({ body: { ok: true } }));
  add('GET', '/sorotan', async () => ({ body: await service.sorotan(), cacheable: true }));

  // ---------- akun ----------
  add('POST', '/auth/login', async ({ req, body }) => {
    const ip = clientIp(req);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 160) : '';
    const keys = [`ip:${ip}`, `pair:${ip}|${email}`];
    if (keys.some((k) => loginLimiter.blocked(k))) throw new HttpError(429, 'Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.', undefined, 'rate_limited');
    try {
      const out = await users.login(body?.email, body?.password);
      keys.forEach((k) => loginLimiter.reset(k));
      return priv(out);
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) keys.forEach((k) => loginLimiter.hit(k));
      throw e;
    }
  }, { limit: SMALL });
  add('GET', '/auth/me', async ({ req }) => priv({ user: await auth.requireStaff(req, { allowPasswordChange: true }) }));
  add('POST', '/auth/change-password', async ({ req, body }) => {
    const me = await auth.requireStaff(req, { allowPasswordChange: true });
    return priv(await users.changeOwnPassword(me, body?.oldPassword, body?.newPassword));
  }, { limit: SMALL });

  // Pengajuan akun dan permintaan reset sandi: publik, dibatasi per IP (satu pembatas, kunci berbeda per jenis).
  add('POST', '/auth/register-request', async ({ req, body }) => {
    if (typeof body?.website === 'string' && body.website !== '') return { status: 202, body: { ok: true } }; // honeypot
    if (!limiter.take(`acct:${clientIp(req)}`)) throw new HttpError(429, 'Terlalu banyak pengajuan dari jaringan ini. Coba lagi nanti.', undefined, 'rate_limited');
    return { status: 202, body: await users.requestAccount(body) };
  }, { limit: SMALL });
  add('POST', '/auth/forgot-password', async ({ req, body }) => {
    if (typeof body?.website === 'string' && body.website !== '') return { status: 202, body: { ok: true } };
    if (!limiter.take(`reset:${clientIp(req)}`)) throw new HttpError(429, 'Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti.', undefined, 'rate_limited');
    return { status: 202, body: await users.requestPasswordReset(body?.email) };
  }, { limit: SMALL });

  // ---------- kelola pengguna (admin) ----------
  add('GET', '/admin/pending', async ({ req }) => {
    await auth.requireAdmin(req);
    return priv(await users.pending());
  });
  add('GET', '/account-requests', async ({ req, query }) => {
    await auth.requireAdmin(req);
    return priv(await users.listRequests(simplePaging(query)));
  });
  add('POST', '/account-requests/:id/approve', async ({ req, params }) => {
    await auth.requireAdmin(req);
    return priv(await users.approveRequest(params.id));
  }, { limit: SMALL });
  add('DELETE', '/account-requests/:id', async ({ req, params }) => {
    await auth.requireAdmin(req);
    await users.rejectRequest(params.id);
    return priv(undefined, 204);
  });
  add('DELETE', '/password-resets/:id', async ({ req, params }) => {
    await auth.requireAdmin(req);
    await users.dismissReset(params.id);
    return priv(undefined, 204);
  });
  add('GET', '/users', async ({ req, query }) => {
    await auth.requireAdmin(req);
    return priv(await users.list(simplePaging(query)));
  });
  add('POST', '/users', async ({ req, body }) => {
    await auth.requireAdmin(req);
    return priv(await users.create(body, body?.password), 201);
  }, { limit: SMALL });
  add('PUT', '/users/:id', async ({ req, params, body }) => {
    await auth.requireAdmin(req);
    return priv(await users.update(params.id, body));
  }, { limit: SMALL });
  add('POST', '/users/:id/reset-password', async ({ req, params, body }) => {
    await auth.requireAdmin(req);
    await users.resetPassword(params.id, body?.newPassword);
    return priv(undefined, 204);
  }, { limit: SMALL });
  add('DELETE', '/users/:id', async ({ req, params }) => {
    await auth.requireAdmin(req);
    await users.remove(params.id);
    return priv(undefined, 204);
  });

  // ---------- pendaftaran anggota ----------
  add('POST', '/pendaftaran', async ({ req, body }) => {
    if (typeof body?.website === 'string' && body.website !== '') return { status: 201, body: { ok: true } }; // honeypot: pura-pura sukses
    if (!limiter.take(clientIp(req))) throw new HttpError(429, 'Terlalu banyak pendaftaran. Coba lagi nanti.');
    return { status: 201, body: await service.submitRegistration(body) };
  }, { limit: SMALL });
  add('GET', '/pendaftaran', async ({ req, query }) => {
    await auth.requireAdmin(req);
    return priv(await service.listRegistrations(simplePaging(query)));
  });
  add('DELETE', '/pendaftaran/:id', async ({ req, params }) => {
    await auth.requireAdmin(req);
    await service.removeRegistration(params.id);
    return priv(undefined, 204);
  });

  // ---------- unggah berkas ----------
  add('POST', '/uploads/sign', async ({ req, body }) => {
    await auth.requireStaff(req);
    return priv(await uploads.sign({ filename: body?.filename, contentType: body?.contentType, size: body?.size }));
  }, { limit: SMALL });

  // ---------- konten (kegiatan, publikasi, kerjasama) ----------
  add('GET', '/:resource', async ({ params, query }) => {
    const r = known(params);
    return { body: await service.list(r, parseListParams(r, (k) => query.get(k))), cacheable: true };
  });
  add('GET', '/:resource/:id', async ({ params }) => ({ body: await service.get(known(params), params.id), cacheable: true }));
  add('POST', '/:resource', async ({ req, params, body }) => {
    const r = known(params);
    await auth.requireStaff(req);
    return priv(await service.create(r, body), 201);
  }, { limit: CONTENT });
  add('PUT', '/:resource/:id', async ({ req, params, body }) => {
    const r = known(params);
    await auth.requireStaff(req);
    return priv(await service.update(r, params.id, body));
  }, { limit: CONTENT });
  add('PATCH', '/:resource/:id', async ({ req, params, body }) => {
    const r = known(params);
    await auth.requireStaff(req);
    return priv(await service.setFeatured(r, params.id, body));
  }, { limit: SMALL });
  add('DELETE', '/:resource/:id', async ({ req, params }) => {
    const r = known(params);
    await auth.requireStaff(req);
    await service.remove(r, params.id);
    return priv(undefined, 204);
  });

  // ---------- CORS dan header keamanan ----------
  function cors(req, res) {
    const origin = req.headers.origin;
    if (!origin) return;
    const allowed = config.allowedOrigins.includes(origin) || (!config.production && config.allowedOrigins.length === 0);
    res.setHeader('Vary', 'Origin');
    if (!allowed) return;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  async function handle(req, res) {
    const started = Date.now();
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    cors(req, res);

    res.on('finish', () => {
      if (path !== '/healthz') log('INFO', 'request', { method: req.method, path, status: res.statusCode, ms: Date.now() - started });
    });

    try {
      if (req.method === 'OPTIONS') return send(res, 204);

      const allow = [];
      for (const r of routes) {
        const m = r.re.exec(path);
        if (!m) continue;
        if (r.method !== req.method) {
          allow.push(r.method);
          continue;
        }
        const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        const body = BODY_METHODS.has(req.method) ? await readJson(req, r.opts.limit ?? SMALL) : undefined;
        const out = await r.handler({ req, res, params, query: url.searchParams, body });
        const status = out.status ?? 200;

        if (out.cacheable && status === 200) {
          const payload = JSON.stringify(out.body);
          const etag = `W/"${crypto.createHash('sha1').update(payload).digest('base64url').slice(0, 27)}"`;
          const headers = { ETag: etag, 'Cache-Control': PUBLIC_CACHE };
          if (req.headers['if-none-match'] === etag) return send(res, 304, undefined, headers);
          return send(res, 200, out.body, headers);
        }
        return send(res, status, out.body, { 'Cache-Control': 'no-store' });
      }
      if (allow.length) {
        res.setHeader('Allow', [...new Set(allow)].join(', '));
        throw new HttpError(405, 'Metode tidak diizinkan.');
      }
      throw new HttpError(404, 'Tidak ditemukan.');
    } catch (err) {
      if (err instanceof HttpError) {
        const headers = { 'Cache-Control': 'no-store' };
        if (err.status === 413) headers.Connection = 'close';
        const payload = { error: err.message };
        if (err.code) payload.code = err.code;
        if (err.fields) payload.fields = err.fields;
        return send(res, err.status, payload, headers);
      }
      log('ERROR', 'unhandled', { method: req.method, path, error: err?.stack || String(err) });
      return send(res, 500, { error: 'Terjadi kesalahan pada server.' }, { 'Cache-Control': 'no-store' });
    }
  }

  return { handle };
}
