import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_EMAIL, startServer } from './helpers.js';

const PW = 'Pilihanku123';
const register = (s, over = {}) => s.call('POST', '/auth/register-request', { body: { name: 'Calon Pengguna', email: 'calon@pui.test', password: PW, ...over } });
const login = (s, email, password) => s.call('POST', '/auth/login', { body: { email, password } });

describe('pengajuan akun', () => {
  let s;
  before(async () => { s = await startServer({ env: { REGISTRATION_MAX_PER_HOUR: '1000' } }); });
  after(() => s.close());
  const list = () => s.call('GET', '/account-requests', { token: s.adminToken });

  test('pengajuan diterima, belum bisa masuk, dan hash tidak pernah bocor', async () => {
    const r = await register(s);
    assert.deepEqual([r.status, r.json], [202, { ok: true }]);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    const l = await list();
    assert.equal(l.status, 200);
    assert.equal(l.json.total, 1);
    assert.deepEqual(Object.keys(l.json.items[0]).sort(), ['createdAt', 'email', 'id', 'name']);
    assert.doesNotMatch(l.text, /passwordHash|scrypt/);
    const early = await login(s, 'calon@pui.test', PW);
    assert.deepEqual([early.status, early.json.code], [401, 'bad_credentials']);
  });

  test('email tidak peka huruf besar; pengajuan ganda dan email yang sudah terdaftar dijawab sama, tanpa entri baru', async () => {
    const before = (await list()).json.total;
    assert.deepEqual((await register(s, { email: 'CALON@pui.test', name: 'Lain' })).json, { ok: true });
    assert.deepEqual((await register(s, { email: ADMIN_EMAIL })).json, { ok: true });
    assert.equal((await list()).json.total, before);
  });

  test('menyetujui membuat akun pengguna aktif dengan kata sandi pilihan pemohon, tanpa paksa ganti sandi', async () => {
    const id = (await list()).json.items[0].id;
    const ok = await s.call('POST', `/account-requests/${id}/approve`, { token: s.adminToken, body: {} });
    assert.equal(ok.status, 200);
    assert.deepEqual([ok.json.role, ok.json.active, ok.json.mustChangePassword, ok.json.email], ['user', true, false, 'calon@pui.test']);
    assert.doesNotMatch(ok.text, /passwordHash|scrypt/);
    const me = await login(s, 'calon@pui.test', PW);
    assert.equal(me.status, 200);
    assert.deepEqual([me.json.user.role, me.json.user.mustChangePassword], ['user', false]);
    assert.equal((await list()).json.total, 0);
    assert.equal((await s.call('POST', `/account-requests/${id}/approve`, { token: s.adminToken, body: {} })).status, 404);
  });

  test('peran dari klien diabaikan: hasilnya selalu pengguna biasa', async () => {
    await register(s, { email: 'nakal@pui.test', name: 'Nakal', role: 'admin' });
    const id = (await list()).json.items[0].id;
    const ok = await s.call('POST', `/account-requests/${id}/approve`, { token: s.adminToken, body: {} });
    assert.equal(ok.json.role, 'user');
  });

  test('menolak menghapus pengajuan; pemohon tetap tidak bisa masuk', async () => {
    await register(s, { email: 'tolak@pui.test', name: 'Ditolak' });
    const id = (await list()).json.items[0].id;
    assert.equal((await s.call('DELETE', `/account-requests/${id}`, { token: s.adminToken })).status, 204);
    assert.equal((await s.call('DELETE', `/account-requests/${id}`, { token: s.adminToken })).status, 404);
    assert.equal((await login(s, 'tolak@pui.test', PW)).status, 401);
  });

  test('hanya admin: tanpa token 401, pengguna biasa 403', async () => {
    const u = await s.makeUser('Staf Dua', 'staf2@pui.test');
    await register(s, { email: 'siapa@pui.test', name: 'Siapa' });
    const id = (await list()).json.items[0].id;
    for (const token of [undefined, u.token]) {
      const want = token ? 403 : 401;
      assert.equal((await s.call('GET', '/account-requests', { token })).status, want);
      assert.equal((await s.call('POST', `/account-requests/${id}/approve`, { token, body: {} })).status, want);
      assert.equal((await s.call('DELETE', `/account-requests/${id}`, { token })).status, want);
      assert.equal((await s.call('GET', '/admin/pending', { token })).status, want);
    }
    assert.equal((await list()).json.total, 1); // tidak ada yang terhapus atau disetujui
  });

  test('validasi: kata sandi lemah, email salah, nama pendek, isi bukan objek', async () => {
    const weak = await register(s, { email: 'a@pui.test', password: 'pendek' });
    assert.equal(weak.status, 400);
    assert.ok(weak.json.fields.password);
    assert.ok((await register(s, { email: 'bukan-email' })).json.fields.email);
    assert.ok((await register(s, { email: 'b@pui.test', name: 'X' })).json.fields.name);
    assert.equal((await register(s, { email: 'c@pui.test', password: 'hanyahuruf' })).status, 400);
    assert.equal((await register(s, { email: 'c@pui.test', password: 'c@pui.test' })).status, 400);
    assert.equal((await s.call('POST', '/auth/register-request', { raw: '[]' })).status, 400);
  });

  test('honeypot: terlihat sukses tetapi tidak menyimpan apa pun', async () => {
    const n = (await list()).json.total;
    const r = await register(s, { email: 'bot@pui.test', website: 'http://spam' });
    assert.deepEqual([r.status, r.json], [202, { ok: true }]);
    assert.equal((await list()).json.total, n);
  });

  test('antrean dibatasi 200 pengajuan', async () => {
    const t = await startServer({ env: { REGISTRATION_MAX_PER_HOUR: '5000' } });
    try {
      for (let i = 0; i < 200; i += 1) assert.equal((await register(t, { email: `p${i}@pui.test` })).status, 202);
      const full = await register(t, { email: 'terlambat@pui.test' });
      assert.deepEqual([full.status, full.json.code], [429, 'queue_full']);
    } finally { await t.close(); }
  });
});

describe('pembatasan laju pengajuan dan permintaan reset', () => {
  test('3 per jam per IP untuk masing-masing jenis; jendela berlalu membuka lagi', async () => {
    const s = await startServer();
    try {
      for (let i = 0; i < 3; i += 1) assert.equal((await register(s, { email: `r${i}@pui.test` })).status, 202);
      const r = await register(s, { email: 'r9@pui.test' });
      assert.deepEqual([r.status, r.json.code], [429, 'rate_limited']);
      // jenis lain punya hitungan sendiri
      assert.equal((await s.call('POST', '/auth/forgot-password', { body: { email: 'siapa@pui.test' } })).status, 202);
      s.clock.advance(61 * 60_000);
      assert.equal((await register(s, { email: 'r10@pui.test' })).status, 202);
    } finally { await s.close(); }
  });
});

describe('permintaan reset kata sandi', () => {
  let s;
  let staf;
  before(async () => {
    s = await startServer({ env: { REGISTRATION_MAX_PER_HOUR: '1000' } });
    staf = await s.makeUser('Staf Satu', 'staf1@pui.test');
  });
  after(() => s.close());
  const forgot = (email) => s.call('POST', '/auth/forgot-password', { body: { email } });
  const users = async () => (await s.call('GET', '/users', { token: s.adminToken })).json.items;
  const pending = async () => (await s.call('GET', '/admin/pending', { token: s.adminToken })).json;

  test('jawaban sama untuk email terdaftar maupun tidak (tidak membocorkan akun)', async () => {
    const a = await forgot('staf1@pui.test');
    const b = await forgot('tidakada@pui.test');
    assert.deepEqual([a.status, a.json], [202, { ok: true }]);
    assert.deepEqual([b.status, b.json], [a.status, a.json]);
  });

  test('admin melihat permintaan di daftar pengguna (naik ke atas) dan di hitungan menunggu', async () => {
    await s.makeUser('Abjad Awal', 'abjad@pui.test');
    const rows = await users();
    const flagged = rows.filter((u) => u.resetRequestedAt);
    assert.deepEqual(flagged.map((u) => u.email), ['staf1@pui.test']);
    const regular = rows.filter((u) => u.role === 'user');
    assert.equal(regular[0].email, 'staf1@pui.test'); // "Staf" di depan "Abjad" karena meminta reset
    assert.deepEqual(await pending(), { accountRequests: 0, passwordResets: 1 });
  });

  test('permintaan berulang tetap satu entri', async () => {
    await forgot('STAF1@pui.test');
    await forgot('staf1@pui.test');
    assert.equal((await users()).filter((u) => u.resetRequestedAt).length, 1);
    assert.equal((await pending()).passwordResets, 1);
  });

  test('akun admin dan akun nonaktif tidak membuat permintaan, tetapi jawabannya tetap sama', async () => {
    const off = await s.makeUser('Mati', 'mati@pui.test');
    await s.call('PUT', `/users/${off.id}`, { token: s.adminToken, body: { active: false } });
    for (const email of [ADMIN_EMAIL, 'mati@pui.test']) assert.deepEqual((await forgot(email)).json, { ok: true });
    const flagged = (await users()).filter((u) => u.resetRequestedAt).map((u) => u.email);
    assert.deepEqual(flagged, ['staf1@pui.test']);
  });

  test('email tidak valid atau bukan teks -> 400', async () => {
    assert.equal((await forgot('')).status, 400);
    assert.equal((await forgot('bukan-email')).status, 400);
    assert.equal((await forgot({ $ne: 1 })).status, 400);
    assert.equal((await forgot(`${'a'.repeat(200)}@pui.test`)).status, 400);
  });

  test('hanya admin yang melihat hitungan dan mengabaikan permintaan', async () => {
    const id = staf.id;
    for (const token of [undefined, staf.token]) {
      const want = token ? 403 : 401;
      assert.equal((await s.call('GET', '/admin/pending', { token })).status, want);
      assert.equal((await s.call('DELETE', `/password-resets/${id}`, { token })).status, want);
    }
    assert.equal((await pending()).passwordResets, 1);
  });

  test('admin mengatur sandi baru: permintaan hilang, sesi lama dicabut, pengguna wajib ganti sandi', async () => {
    const r = await s.call('POST', `/users/${staf.id}/reset-password`, { token: s.adminToken, body: { newPassword: 'SementaraBaru1' } });
    assert.equal(r.status, 204);
    assert.equal((await users()).filter((u) => u.resetRequestedAt).length, 0);
    assert.equal((await pending()).passwordResets, 0);
    assert.equal((await s.call('GET', '/auth/me', { token: staf.token })).status, 401);
    const li = await login(s, 'staf1@pui.test', 'SementaraBaru1');
    assert.deepEqual([li.status, li.json.user.mustChangePassword], [200, true]);
  });

  test('mengabaikan permintaan, dan menghapus pengguna ikut menghapus permintaannya', async () => {
    await forgot('staf1@pui.test');
    assert.equal((await s.call('DELETE', `/password-resets/${staf.id}`, { token: s.adminToken })).status, 204);
    assert.equal((await s.call('DELETE', `/password-resets/${staf.id}`, { token: s.adminToken })).status, 404);
    await forgot('staf1@pui.test');
    assert.equal((await s.call('DELETE', `/users/${staf.id}`, { token: s.adminToken })).status, 204);
    assert.equal((await pending()).passwordResets, 0);
  });

  test('id tidak sah dijawab 404, bukan 500', async () => {
    for (const id of ['__rusak__', '..', 'a'.repeat(200)]) {
      assert.equal((await s.call('DELETE', `/password-resets/${id}`, { token: s.adminToken })).status, 404);
      assert.equal((await s.call('POST', `/account-requests/${id}/approve`, { token: s.adminToken, body: {} })).status, 404);
    }
  });
});
