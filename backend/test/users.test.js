import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_EMAIL, ADMIN_PW, USER_PW, kegiatan, startServer } from './helpers.js';

describe('login dan sesi', () => {
  let s;
  before(async () => { s = await startServer(); });
  after(() => s.close());
  const login = (email, password) => s.call('POST', '/auth/login', { body: { email, password } });

  test('berhasil: token, masa berlaku, dan data pengguna tanpa hash', async () => {
    const r = await login(ADMIN_EMAIL, ADMIN_PW);
    assert.equal(r.status, 200);
    assert.ok(r.json.token && r.json.expiresAt);
    assert.deepEqual([r.json.user.email, r.json.user.role, r.json.user.mustChangePassword], [ADMIN_EMAIL, 'admin', false]);
    assert.doesNotMatch(r.text, /passwordHash|scrypt/);
    assert.equal(r.headers.get('cache-control'), 'no-store');
  });
  test('email tidak peka huruf besar dan spasi di tepi diabaikan', async () => {
    assert.equal((await login('  ADMIN@PUI.TEST ', ADMIN_PW)).status, 200);
  });
  test('kata sandi salah dan email tak dikenal memberi respons yang sama (tidak membocorkan akun)', async () => {
    const a = await login(ADMIN_EMAIL, 'SalahSalah1');
    const b = await login('tidakada@pui.test', 'SalahSalah1');
    assert.equal(a.status, 401);
    assert.deepEqual([b.status, b.json.error, b.json.code], [401, a.json.error, a.json.code]);
  });
  test('isian kosong atau bertipe salah -> 400', async () => {
    assert.equal((await login('', '')).status, 400);
    assert.equal((await login({ $ne: 1 }, { $ne: 1 })).status, 400);
    assert.equal((await login(ADMIN_EMAIL, 'x'.repeat(500))).status, 400);
  });
  test('tanpa token, token sampah, dan token dimodifikasi -> 401', async () => {
    const good = (await login(ADMIN_EMAIL, ADMIN_PW)).json.token;
    const [body, sig] = good.split('.');
    const forged = `${Buffer.from(JSON.stringify({ sub: 'x', ver: 1, exp: 9_999_999_999 })).toString('base64url')}.${sig}`;
    for (const t of [undefined, 'sampah', `${body}.AAAA`, forged]) assert.equal((await s.call('GET', '/auth/me', { token: t })).status, 401);
    assert.equal((await s.call('GET', '/auth/me', { token: good })).status, 200);
  });
  test('sesi berakhir setelah masa berlaku (12 jam)', async () => {
    const t = (await login(ADMIN_EMAIL, ADMIN_PW)).json.token;
    s.clock.advance(11 * 3600_000);
    assert.equal((await s.call('GET', '/auth/me', { token: t })).status, 200);
    s.clock.advance(2 * 3600_000);
    const r = await s.call('GET', '/auth/me', { token: t });
    assert.deepEqual([r.status, r.json.code], [401, 'invalid_session']);
  });
});

describe('pembatasan percobaan masuk', () => {
  test('5 kegagalan mengunci IP, bahkan untuk kata sandi benar; terbuka lagi setelah jendela berlalu', async () => {
    const s = await startServer();
    try {
      for (let i = 0; i < 5; i += 1) assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'Salah12345' } })).status, 401);
      const locked = await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } });
      assert.deepEqual([locked.status, locked.json.code], [429, 'rate_limited']);
      s.clock.advance(16 * 60_000);
      assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).status, 200);
    } finally { await s.close(); }
  });
  test('login berhasil menghapus hitungan kegagalan', async () => {
    const s = await startServer();
    try {
      for (let i = 0; i < 4; i += 1) await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'Salah12345' } });
      assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).status, 200);
      for (let i = 0; i < 4; i += 1) await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'Salah12345' } });
      assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).status, 200);
    } finally { await s.close(); }
  });
  test('XFF palsu di depan tidak menghindari penguncian', async () => {
    const s = await startServer();
    try {
      for (let i = 0; i < 5; i += 1) await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'Salah12345' }, headers: { 'X-Forwarded-For': `${i}.${i}.${i}.${i}, 7.7.7.7` } });
      const r = await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW }, headers: { 'X-Forwarded-For': '8.8.8.8, 7.7.7.7' } });
      assert.equal(r.status, 429);
    } finally { await s.close(); }
  });
});

describe('ganti kata sandi sendiri (wajib kata sandi lama)', () => {
  let s;
  before(async () => { s = await startServer(); });
  after(() => s.close());
  const change = (token, oldPassword, newPassword) => s.call('POST', '/auth/change-password', { token, body: { oldPassword, newPassword } });

  test('tanpa login -> 401', async () => assert.equal((await change(undefined, 'a', 'b')).status, 401));
  test('kata sandi lama salah -> 400 di field oldPassword', async () => {
    const r = await change(s.adminToken, 'BukanYangLama1', 'BaruKuat1234');
    assert.deepEqual([r.status, r.json.fields.oldPassword], [400, 'Kata sandi lama salah.']);
  });
  test('kata sandi lemah ditolak dengan alasan', async () => {
    for (const weak of ['pendek1', 'hanyahurufsaja', '123456789', 'x'.repeat(200) + '1a', ADMIN_EMAIL]) {
      const r = await change(s.adminToken, ADMIN_PW, weak);
      assert.equal(r.status, 400, weak.slice(0, 20));
      assert.ok(r.json.fields.newPassword);
    }
  });
  test('sama dengan yang lama ditolak', async () => {
    assert.ok((await change(s.adminToken, ADMIN_PW, ADMIN_PW)).json.fields.newPassword);
  });
  test('berhasil: token lama dicabut, token baru dipakai, kata sandi lama tak lagi berlaku', async () => {
    const login = (await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).json.token;
    const r = await change(login, ADMIN_PW, 'AdminBaru9999');
    assert.equal(r.status, 200);
    assert.notEqual(r.json.token, login);
    assert.equal((await s.call('GET', '/auth/me', { token: login })).status, 401);
    assert.equal((await s.call('GET', '/auth/me', { token: r.json.token })).status, 200);
    assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).status, 401);
    assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'AdminBaru9999' } })).status, 200);
  });
});

describe('kelola pengguna: aturan peran', () => {
  let s;
  before(async () => { s = await startServer(); });
  after(() => s.close());
  const A = () => s.adminToken;
  const create = (body, token = A()) => s.call('POST', '/users', { token, body });
  const newUser = { name: 'Staf Baru', email: 'Staf.Baru@PUI.test', password: 'Awal12345' };

  test('admin membuat pengguna biasa: peran user, wajib ganti sandi, email dinormalkan, tanpa hash', async () => {
    const r = await create(newUser);
    assert.equal(r.status, 201);
    assert.deepEqual([r.json.role, r.json.mustChangePassword, r.json.email, r.json.active], ['user', true, 'staf.baru@pui.test', true]);
    assert.doesNotMatch(r.text, /passwordHash|scrypt|Awal12345/);
  });
  test('admin TIDAK bisa membuat akun admin (peran apa pun selain user ditolak)', async () => {
    for (const role of ['admin', 'superadmin', 'Admin', 1, true]) {
      const r = await create({ name: 'Calon Admin', email: `x${String(role)}@pui.test`, password: 'Awal12345', role });
      assert.deepEqual([r.status, r.json.code], [403, 'forbidden_role'], String(role));
    }
    assert.equal((await create({ name: 'Eksplisit User', email: 'eks@pui.test', password: 'Awal12345', role: 'user' })).status, 201);
  });
  test('email ganda (tanpa peduli huruf besar) -> 409', async () => {
    const r = await create({ ...newUser, email: 'STAF.BARU@pui.test' });
    assert.deepEqual([r.status, r.json.fields.email], [409, 'Email sudah terdaftar.']);
  });
  test('tidak bisa menimpa akun admin dengan email yang sama', async () => {
    assert.equal((await create({ name: 'Palsu', email: ADMIN_EMAIL, password: 'Awal12345' })).status, 409);
  });
  test('validasi: sandi lemah, email salah, nama pendek', async () => {
    assert.ok((await create({ ...newUser, email: 'a1@pui.test', password: 'lemah' })).json.fields.password);
    assert.ok((await create({ ...newUser, email: 'bukan-email' })).json.fields.email);
    assert.ok((await create({ ...newUser, email: 'a2@pui.test', name: 'A' })).json.fields.name);
  });
  test('tanpa login -> 401', async () => assert.equal((await create(newUser, null)).status, 401));

  test('pengguna biasa tidak bisa mengakses SATU PUN endpoint pengguna', async () => {
    const u = await s.makeUser('Biasa', 'biasa@pui.test');
    const id = (await s.call('GET', '/users', { token: A() })).json.items.find((x) => x.email === 'biasa@pui.test').id;
    const calls = [
      ['GET', '/users'], ['POST', '/users', { name: 'Hacker', email: 'h@pui.test', password: 'Awal12345' }],
      ['PUT', `/users/${id}`, { active: false }], ['POST', `/users/${id}/reset-password`, { newPassword: 'Baru12345' }],
      ['DELETE', `/users/${id}`], ['GET', '/pendaftaran'], ['DELETE', '/pendaftaran/daf-x'],
    ];
    for (const [m, p, body] of calls) {
      const r = await s.call(m, p, { token: u.token, body });
      assert.deepEqual([r.status, r.json.code], [403, 'admin_only'], `${m} ${p}`);
    }
  });
  test('pengguna biasa tetap bisa CRUD konten dan meminta URL unggah', async () => {
    const u = await s.makeUser('Penulis', 'penulis@pui.test');
    const c = await s.call('POST', '/kegiatan', { token: u.token, body: kegiatan({ title: 'Dibuat staf' }) });
    assert.equal(c.status, 201);
    assert.equal((await s.call('PUT', `/kegiatan/${c.json.id}`, { token: u.token, body: kegiatan({ title: 'Diubah staf' }) })).status, 200);
    assert.equal((await s.call('PATCH', `/kegiatan/${c.json.id}`, { token: u.token, body: { featured: true } })).status, 200);
    assert.equal((await s.call('POST', '/uploads/sign', { token: u.token, body: { filename: 'a.png', contentType: 'image/png', size: 100 } })).status, 200);
    assert.equal((await s.call('DELETE', `/kegiatan/${c.json.id}`, { token: u.token })).status, 204);
  });

  test('daftar: admin lebih dulu, pencarian, paginasi', async () => {
    const r = await s.call('GET', '/users?pageSize=2', { token: A() });
    assert.equal(r.json.items[0].role, 'admin');
    assert.equal(r.json.items.length, 2);
    assert.ok(r.json.total >= 4);
    assert.equal((await s.call('GET', '/users?q=penulis', { token: A() })).json.total, 1);
    assert.doesNotMatch(r.text, /passwordHash|tokenVersion/);
  });
});

describe('siklus akun pengguna', () => {
  let s;
  before(async () => { s = await startServer(); });
  after(() => s.close());
  const A = () => s.adminToken;
  const find = async (email) => (await s.call('GET', `/users?q=${email}`, { token: A() })).json.items[0];

  test('sandi sementara: boleh masuk tetapi konten diblokir sampai ganti sandi', async () => {
    await s.call('POST', '/users', { token: A(), body: { name: 'Baru Masuk', email: 'baru@pui.test', password: 'Sementara1' } });
    const login = await s.call('POST', '/auth/login', { body: { email: 'baru@pui.test', password: 'Sementara1' } });
    assert.equal(login.json.user.mustChangePassword, true);
    const t = login.json.token;
    const blocked = await s.call('POST', '/kegiatan', { token: t, body: kegiatan() });
    assert.deepEqual([blocked.status, blocked.json.code], [403, 'password_change_required']);
    assert.equal((await s.call('POST', '/uploads/sign', { token: t, body: {} })).json.code, 'password_change_required');
    assert.equal((await s.call('GET', '/auth/me', { token: t })).status, 200); // tetap boleh
    const changed = await s.call('POST', '/auth/change-password', { token: t, body: { oldPassword: 'Sementara1', newPassword: USER_PW } });
    assert.equal(changed.json.user.mustChangePassword, false);
    assert.equal((await s.call('POST', '/kegiatan', { token: changed.json.token, body: kegiatan() })).status, 201);
  });

  test('menonaktifkan: sesi aktif langsung dicabut, tidak bisa login, bisa diaktifkan lagi', async () => {
    const u = await s.makeUser('Akan Nonaktif', 'nonaktif@pui.test');
    const id = (await find('nonaktif@pui.test')).id;
    assert.equal((await s.call('GET', '/auth/me', { token: u.token })).status, 200);
    const off = await s.call('PUT', `/users/${id}`, { token: A(), body: { active: false } });
    assert.equal(off.json.active, false);
    assert.equal((await s.call('GET', '/auth/me', { token: u.token })).status, 401);
    const bad = await s.call('POST', '/auth/login', { body: { email: 'nonaktif@pui.test', password: USER_PW } });
    assert.deepEqual([bad.status, bad.json.code], [403, 'account_disabled']);
    const wrongPw = await s.call('POST', '/auth/login', { body: { email: 'nonaktif@pui.test', password: 'SalahTotal1' } });
    assert.equal(wrongPw.status, 401); // sandi salah tidak membocorkan status akun
    await s.call('PUT', `/users/${id}`, { token: A(), body: { active: true } });
    assert.equal((await s.call('POST', '/auth/login', { body: { email: 'nonaktif@pui.test', password: USER_PW } })).status, 200);
  });

  test('mengubah nama; field lain (peran, email) tidak bisa diubah lewat PUT', async () => {
    await s.makeUser('Nama Lama', 'ubah@pui.test');
    const id = (await find('ubah@pui.test')).id;
    const r = await s.call('PUT', `/users/${id}`, { token: A(), body: { name: 'Nama Baru', role: 'admin', email: 'lain@pui.test' } });
    assert.deepEqual([r.json.name, r.json.role, r.json.email], ['Nama Baru', 'user', 'ubah@pui.test']);
    assert.equal((await s.call('PUT', `/users/${id}`, { token: A(), body: { active: 'ya' } })).status, 400);
  });

  test('reset oleh admin: TANPA kata sandi lama; sandi lama & sesi lama tidak berlaku; wajib ganti saat masuk', async () => {
    const u = await s.makeUser('Lupa Sandi', 'lupa@pui.test');
    const id = (await find('lupa@pui.test')).id;
    const r = await s.call('POST', `/users/${id}/reset-password`, { token: A(), body: { newPassword: 'ResetAdmin77' } });
    assert.equal(r.status, 204);
    assert.equal((await s.call('GET', '/auth/me', { token: u.token })).status, 401);
    assert.equal((await s.call('POST', '/auth/login', { body: { email: 'lupa@pui.test', password: USER_PW } })).status, 401);
    const again = await s.call('POST', '/auth/login', { body: { email: 'lupa@pui.test', password: 'ResetAdmin77' } });
    assert.equal(again.status, 200);
    assert.equal(again.json.user.mustChangePassword, true);
  });
  test('reset oleh admin: sandi lemah ditolak; pengguna tak ada -> 404', async () => {
    const id = (await find('lupa@pui.test')).id;
    assert.ok((await s.call('POST', `/users/${id}/reset-password`, { token: A(), body: { newPassword: 'lemah' } })).json.fields.newPassword);
    assert.equal((await s.call('POST', '/users/tidak-ada/reset-password', { token: A(), body: { newPassword: 'ResetAdmin77' } })).status, 404);
  });

  test('akun admin dilindungi: tidak bisa direset, diubah, dinonaktifkan, atau dihapus oleh siapa pun', async () => {
    const me = (await s.call('GET', '/auth/me', { token: A() })).json.user;
    const checks = [
      ['POST', `/users/${me.id}/reset-password`, { newPassword: 'ResetAdmin77' }], ['PUT', `/users/${me.id}`, { active: false }],
      ['PUT', `/users/${me.id}`, { name: 'X Y' }], ['DELETE', `/users/${me.id}`],
    ];
    for (const [m, p, body] of checks) {
      const r = await s.call(m, p, { token: A(), body });
      assert.deepEqual([r.status, r.json.code], [403, 'admin_protected'], `${m} ${p}`);
    }
    assert.equal((await s.call('GET', '/auth/me', { token: A() })).status, 200); // admin tetap utuh
  });

  test('menghapus pengguna: sesi dan login langsung tidak berlaku; hapus lagi -> 404', async () => {
    const u = await s.makeUser('Akan Dihapus', 'hapus@pui.test');
    const id = (await find('hapus@pui.test')).id;
    assert.equal((await s.call('DELETE', `/users/${id}`, { token: A() })).status, 204);
    assert.equal((await s.call('GET', '/auth/me', { token: u.token })).status, 401);
    assert.equal((await s.call('POST', '/auth/login', { body: { email: 'hapus@pui.test', password: USER_PW } })).status, 401);
    assert.equal((await s.call('DELETE', `/users/${id}`, { token: A() })).status, 404);
  });

  test('pengguna biasa mengganti sandinya sendiri dengan sandi lama', async () => {
    const u = await s.makeUser('Ganti Sendiri', 'sendiri@pui.test');
    assert.ok((await s.call('POST', '/auth/change-password', { token: u.token, body: { oldPassword: 'Salah12345', newPassword: 'BaruLagi123' } })).json.fields.oldPassword);
    const ok = await s.call('POST', '/auth/change-password', { token: u.token, body: { oldPassword: USER_PW, newPassword: 'BaruLagi123' } });
    assert.equal(ok.status, 200);
    assert.equal((await s.call('POST', '/auth/login', { body: { email: 'sendiri@pui.test', password: 'BaruLagi123' } })).status, 200);
  });
});

describe('bootstrap admin', () => {
  test('hanya membuat admin bila belum ada, dan tidak menimpa sandi admin yang sudah ada', async () => {
    const s = await startServer();
    try {
      const { createUsers } = await import('../src/users.js');
      const { createSessions } = await import('../src/session.js');
      const users = createUsers({ store: s.store, sessions: createSessions({ secret: s.config.sessionSecret, ttlSeconds: 60 }), config: s.config });
      assert.deepEqual(await users.bootstrap(), { created: false });
      assert.equal((await s.call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PW } })).status, 200);
    } finally { await s.close(); }
  });
});
