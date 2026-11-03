import crypto from 'node:crypto';
import { HttpError } from './errors.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { passwordProblem, validate } from './shared/validate.js';

const COLLECTION = 'users';
const REQUESTS = 'accountRequests'; // pengajuan akun menunggu persetujuan admin
const RESETS = 'resetRequests';     // permintaan reset kata sandi dari pengguna (id = id pengguna)
const MAX_PENDING_REQUESTS = 200;   // pagar pengaman agar antrean tidak bisa dibanjiri
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
// ID dokumen Firestore tidak boleh berbentuk __x__; tolak lebih awal sebagai 404 alih-alih 500.
const validId = (id) => ID_RE.test(String(id)) && !/^__.*__$/.test(String(id));

/** ID pengguna diturunkan dari email, sehingga keunikan email terjamin tanpa kueri. */
export const userId = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('base64url').slice(0, 24);

export const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, active: u.active !== false,
  mustChangePassword: Boolean(u.mustChangePassword), createdAt: u.createdAt, lastLoginAt: u.lastLoginAt ?? null,
});

const fail = (status, message, fields, code) => new HttpError(status, message, fields, code);

/**
 * Layanan akun. Aturan peran:
 *  - admin  : kelola konten + kelola pengguna (hanya membuat/reset/ubah/hapus akun BERPERAN 'user')
 *  - user   : kelola konten saja, tidak bisa membuat akun apa pun
 *  - admin pertama dibuat lewat bootstrap (env); tidak ada jalur API untuk membuat admin lain.
 */
export function createUsers({ store, sessions, config, now = () => new Date() }) {
  const hashOpts = { N: config.scryptCost };
  let dummyHash; // untuk menyamakan waktu respons saat email tidak ditemukan

  const find = (id) => store.get(COLLECTION, id);
  const iso = () => now().toISOString();

  async function load(id) {
    if (!validId(id)) throw fail(404, 'Pengguna tidak ditemukan.');
    const u = await find(id);
    if (!u) throw fail(404, 'Pengguna tidak ditemukan.');
    return u;
  }
  const ensureManageable = (u, action) => {
    if (u.role !== 'user') throw fail(403, `Akun admin tidak dapat ${action} lewat menu ini.`, undefined, 'admin_protected');
  };
  const checkPassword = (pw, email, field = 'password') => {
    const problem = passwordProblem(pw, { email });
    if (problem) throw fail(400, 'Data tidak valid.', { [field]: problem });
  };

  return {
    async bootstrap() {
      const b = config.bootstrapAdmin;
      if (!b) return { created: false };
      const existing = await store.list(COLLECTION);
      if (existing.some((u) => u.role === 'admin')) return { created: false };
      const id = userId(b.email);
      const stamp = iso();
      await store.put(COLLECTION, id, {
        name: b.name, email: b.email, role: 'admin', active: true, tokenVersion: 1, mustChangePassword: true,
        passwordHash: await hashPassword(b.password, hashOpts), createdAt: stamp, updatedAt: stamp,
      });
      return { created: true, email: b.email };
    },

    async login(rawEmail, password) {
      const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
      if (!email || typeof password !== 'string' || password.length === 0 || password.length > 128) {
        throw fail(400, 'Email dan kata sandi wajib diisi.');
      }
      const u = await find(userId(email));
      dummyHash ??= await hashPassword('tidak-dipakai-12345', hashOpts);
      const ok = await verifyPassword(password, u?.passwordHash ?? dummyHash);
      if (!u || !ok) throw fail(401, 'Email atau kata sandi salah.', undefined, 'bad_credentials');
      if (u.active === false) throw fail(403, 'Akun dinonaktifkan. Hubungi admin.', undefined, 'account_disabled');
      await store.put(COLLECTION, u.id, { ...u, lastLoginAt: iso() });
      return { ...sessions.issue({ sub: u.id, ver: u.tokenVersion }), user: publicUser({ ...u, lastLoginAt: iso() }) };
    },

    /** Mengubah token menjadi pengguna, atau melempar 401. Dipanggil di setiap permintaan terautentikasi. */
    async authenticate(token) {
      const claims = sessions.verify(token);
      if (!claims) throw fail(401, 'Sesi tidak valid atau berakhir. Masuk kembali.', undefined, 'invalid_session');
      const u = await find(claims.sub);
      if (!u || u.active === false || u.tokenVersion !== claims.ver) {
        throw fail(401, 'Sesi tidak valid atau berakhir. Masuk kembali.', undefined, 'invalid_session');
      }
      return publicUser(u);
    },

    /** Ganti kata sandi sendiri: wajib kata sandi lama. Mengembalikan sesi baru, sesi lama dicabut. */
    async changeOwnPassword(me, oldPassword, newPassword) {
      const u = await load(me.id);
      if (typeof oldPassword !== 'string' || !(await verifyPassword(oldPassword, u.passwordHash))) {
        throw fail(400, 'Data tidak valid.', { oldPassword: 'Kata sandi lama salah.' });
      }
      checkPassword(newPassword, u.email, 'newPassword');
      if (newPassword === oldPassword) throw fail(400, 'Data tidak valid.', { newPassword: 'Kata sandi baru harus berbeda dari yang lama.' });
      const next = { ...u, passwordHash: await hashPassword(newPassword, hashOpts), tokenVersion: u.tokenVersion + 1, mustChangePassword: false, updatedAt: iso() };
      await store.put(COLLECTION, u.id, next);
      return { ...sessions.issue({ sub: u.id, ver: next.tokenVersion }), user: publicUser(next) };
    },

    async list({ q = '', page = 1, pageSize = 10 }) {
      const needle = q.toLowerCase();
      const resets = new Map((await store.list(RESETS)).map((r) => [r.id, r]));
      const rows = (await store.list(COLLECTION))
        .filter((u) => !needle || `${u.name} ${u.email}`.toLowerCase().includes(needle))
        // admin di depan; di antara pengguna, yang meminta reset sandi naik ke atas agar tidak terlewat
        .sort((a, b) => (a.role === b.role
          ? Number(resets.has(b.id)) - Number(resets.has(a.id)) || String(a.name).localeCompare(String(b.name))
          : a.role === 'admin' ? -1 : 1));
      return {
        items: rows.slice((page - 1) * pageSize, page * pageSize).map((u) => ({ ...publicUser(u), resetRequestedAt: resets.get(u.id)?.requestedAt ?? null })),
        total: rows.length,
      };
    },

    /** Hanya akun berperan 'user'. Peran lain apa pun ditolak, tidak diabaikan diam-diam. */
    async create(body, password) {
      if (body && body.role !== undefined && body.role !== 'user') {
        throw fail(403, 'Hanya akun pengguna biasa yang dapat dibuat.', undefined, 'forbidden_role');
      }
      const { name, email } = validate('user', body);
      checkPassword(password, email);
      const id = userId(email);
      if (await find(id)) throw fail(409, 'Data tidak valid.', { email: 'Email sudah terdaftar.' });
      const stamp = iso();
      const doc = {
        name, email, role: 'user', active: true, tokenVersion: 1, mustChangePassword: true,
        passwordHash: await hashPassword(password, hashOpts), createdAt: stamp, updatedAt: stamp,
      };
      await store.put(COLLECTION, id, doc);
      return publicUser({ ...doc, id });
    },

    async update(id, body) {
      const u = await load(id);
      ensureManageable(u, 'diubah');
      const next = { ...u, updatedAt: iso() };
      if (body?.name !== undefined) next.name = validate('user', { name: body.name, email: u.email }).name;
      if (body?.active !== undefined) {
        if (typeof body.active !== 'boolean') throw fail(400, 'Data tidak valid.', { active: 'Harus benar atau salah.' });
        next.active = body.active;
        if (!body.active) next.tokenVersion = u.tokenVersion + 1; // nonaktif = sesi langsung dicabut
      }
      await store.put(COLLECTION, id, next);
      return publicUser(next);
    },

    /** Reset oleh admin: tanpa kata sandi lama. Pengguna wajib menggantinya saat masuk berikutnya. */
    async resetPassword(id, newPassword) {
      const u = await load(id);
      ensureManageable(u, 'direset');
      checkPassword(newPassword, u.email, 'newPassword');
      await store.put(COLLECTION, id, { ...u, passwordHash: await hashPassword(newPassword, hashOpts), tokenVersion: u.tokenVersion + 1, mustChangePassword: true, updatedAt: iso() });
      await store.delete(RESETS, id); // permintaan reset (bila ada) sudah dilayani
    },

    async remove(id) {
      const u = await load(id);
      ensureManageable(u, 'dihapus');
      await store.delete(COLLECTION, id);
      await store.delete(RESETS, id);
    },

    // ---------- pengajuan akun (publik -> persetujuan admin) ----------

    /**
     * Pemohon memilih kata sandinya sendiri; yang disimpan hanya hash-nya. Akun baru dibuat saat admin menyetujui.
     * Jawabannya selalu sama (ok) baik email sudah terdaftar, sudah diajukan, maupun baru, agar endpoint ini
     * tidak bisa dipakai untuk menebak email yang terdaftar.
     */
    async requestAccount(body) {
      const { name, email } = validate('user', body);
      checkPassword(body.password, email);
      const id = userId(email);
      const passwordHash = await hashPassword(body.password, hashOpts); // selalu dihitung: waktu respons seragam
      const [taken, pending] = await Promise.all([find(id), store.get(REQUESTS, id)]);
      if (taken || pending) return { ok: true };
      if ((await store.list(REQUESTS)).length >= MAX_PENDING_REQUESTS) {
        throw fail(429, 'Antrean pengajuan sedang penuh. Coba lagi nanti atau hubungi admin PUI.', undefined, 'queue_full');
      }
      await store.put(REQUESTS, id, { name, email, passwordHash, createdAt: iso() });
      return { ok: true };
    },

    async listRequests({ q = '', page = 1, pageSize = 10 }) {
      const needle = q.toLowerCase();
      const rows = (await store.list(REQUESTS))
        .filter((r) => !needle || `${r.name} ${r.email}`.toLowerCase().includes(needle))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return {
        items: rows.slice((page - 1) * pageSize, page * pageSize).map((r) => ({ id: r.id, name: r.name, email: r.email, createdAt: r.createdAt })),
        total: rows.length,
      };
    },

    /** Menyetujui = membuat akun berperan 'user' yang langsung aktif, dengan kata sandi pilihan pemohon. */
    async approveRequest(id) {
      if (!validId(id)) throw fail(404, 'Pengajuan tidak ditemukan.');
      const r = await store.get(REQUESTS, id);
      if (!r) throw fail(404, 'Pengajuan tidak ditemukan.');
      if (await find(id)) {
        await store.delete(REQUESTS, id);
        throw fail(409, 'Email ini sudah terdaftar sebagai akun.', undefined, 'already_exists');
      }
      const stamp = iso();
      const doc = {
        name: r.name, email: r.email, role: 'user', active: true, tokenVersion: 1, mustChangePassword: false,
        passwordHash: r.passwordHash, createdAt: stamp, updatedAt: stamp,
      };
      await store.put(COLLECTION, id, doc);
      await store.delete(REQUESTS, id);
      return publicUser({ ...doc, id });
    },

    async rejectRequest(id) {
      if (!validId(id) || !(await store.delete(REQUESTS, id))) throw fail(404, 'Pengajuan tidak ditemukan.');
    },

    // ---------- permintaan reset kata sandi (publik -> admin yang mengatur sandi baru) ----------

    /**
     * Hanya mencatat permintaan untuk akun 'user' yang aktif. Akun admin sengaja tidak bisa direset lewat sini
     * (lihat README). Jawabannya selalu ok supaya email yang terdaftar tidak bisa ditebak.
     */
    async requestPasswordReset(rawEmail) {
      const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
      if (!email || email.length > 160 || !EMAIL_RE.test(email)) throw fail(400, 'Data tidak valid.', { email: 'Email tidak valid.' });
      const u = await find(userId(email));
      if (u && u.role === 'user' && u.active !== false) {
        const prev = await store.get(RESETS, u.id);
        await store.put(RESETS, u.id, { email: u.email, name: u.name, createdAt: prev?.createdAt ?? iso(), requestedAt: iso(), count: (prev?.count ?? 0) + 1 });
      }
      return { ok: true };
    },

    async dismissReset(id) {
      if (!validId(id) || !(await store.delete(RESETS, id))) throw fail(404, 'Permintaan tidak ditemukan.');
    },

    /** Jumlah pekerjaan yang menunggu admin, untuk lencana di menu. */
    async pending() {
      const [requests, resets, users] = await Promise.all([store.list(REQUESTS), store.list(RESETS), store.list(COLLECTION)]);
      const live = new Set(users.filter((u) => u.role === 'user' && u.active !== false).map((u) => u.id));
      return { accountRequests: requests.length, passwordResets: resets.filter((r) => live.has(r.id)).length };
    },
  };
}
