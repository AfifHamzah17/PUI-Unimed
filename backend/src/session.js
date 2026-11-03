import crypto from 'node:crypto';

const b64 = (b) => Buffer.from(b).toString('base64url');

/**
 * Token sesi bertanda tangan HMAC-SHA256: base64url(payload).base64url(tanda tangan).
 * Payload hanya berisi id pengguna, versi token, dan masa berlaku. Versi dicocokkan dengan data pengguna
 * di setiap permintaan, jadi mengganti/mereset kata sandi atau menonaktifkan akun langsung mencabut semua sesi lamanya.
 */
export function createSessions({ secret, ttlSeconds, now = () => Date.now() }) {
  const mac = (data) => crypto.createHmac('sha256', secret).update(data).digest();
  return {
    issue({ sub, ver }) {
      const exp = Math.floor(now() / 1000) + ttlSeconds;
      const body = b64(JSON.stringify({ sub, ver, exp }));
      return { token: `${body}.${b64(mac(body))}`, expiresAt: new Date(exp * 1000).toISOString() };
    },
    /** Mengembalikan { sub, ver } atau null bila tidak sah atau kedaluwarsa. */
    verify(token) {
      if (typeof token !== 'string') return null;
      const [body, sig, extra] = token.split('.');
      if (!body || !sig || extra !== undefined) return null;
      const given = Buffer.from(sig, 'base64url');
      const want = mac(body);
      if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;
      try {
        const p = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (typeof p.sub !== 'string' || !Number.isInteger(p.ver) || typeof p.exp !== 'number') return null;
        return p.exp * 1000 > now() ? { sub: p.sub, ver: p.ver } : null;
      } catch {
        return null;
      }
    },
  };
}
