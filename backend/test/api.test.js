import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/stores/memory.js';
import { doc, fakeSigner, kegiatan, kerjasama, makeClock, para, publikasi, startServer } from './helpers.js';

let s;
let T;
before(async () => { s = await startServer(); T = s.adminToken; });
after(() => s.close());

describe('dasar dan CORS', () => {
  test('healthz dan header keamanan', async () => {
    const r = await s.call('GET', '/healthz');
    assert.deepEqual([r.status, r.json], [200, { ok: true }]);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
  test('rute dan sumber daya tak dikenal -> 404 JSON, metode salah -> 405 dengan Allow', async () => {
    assert.equal((await s.call('GET', '/tidak/ada/sama/sekali')).status, 404);
    assert.equal((await s.call('GET', '/rahasia')).status, 404);
    assert.equal((await s.call('GET', '/users/abc')).status, 404);
    const r = await s.call('DELETE', '/healthz');
    assert.equal(r.status, 405);
    assert.match(r.headers.get('allow'), /GET/);
  });
  test('preflight mengizinkan PATCH dan Authorization dari origin sah saja', async () => {
    const ok = await s.call('OPTIONS', '/kegiatan/x', { headers: { Origin: 'https://pui.example' } });
    assert.equal(ok.status, 204);
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://pui.example');
    assert.match(ok.headers.get('access-control-allow-methods'), /PATCH/);
    assert.match(ok.headers.get('access-control-allow-headers'), /Authorization/);
    const bad = await s.call('GET', '/kegiatan', { headers: { Origin: 'https://jahat.example' } });
    assert.equal(bad.status, 200);
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });
});

describe('hak akses tulis', () => {
  test('tanpa token atau token palsu -> 401 untuk semua metode tulis', async () => {
    for (const tok of [null, 'palsu']) {
      for (const [m, p, b] of [['POST', '/kegiatan', kegiatan()], ['PUT', '/kegiatan/x', kegiatan()], ['PATCH', '/kegiatan/x', { featured: true }], ['DELETE', '/kegiatan/x'], ['POST', '/uploads/sign', {}]]) {
        assert.equal((await s.call(m, p, { body: b, token: tok })).status, 401, `${m} ${p}`);
      }
    }
  });
  test('membaca tetap publik', async () => {
    assert.equal((await s.call('GET', '/kegiatan')).status, 200);
    assert.equal((await s.call('GET', '/sorotan')).status, 200);
  });
});

describe('CRUD kegiatan', () => {
  let id;
  test('create: 201, id, demo=false, stempel waktu, field liar dibuang', async () => {
    const r = await s.call('POST', '/kegiatan', { token: T, body: { ...kegiatan({ title: '  Judul Spasi  ' }), id: 'palsu', demo: true, isAdmin: true } });
    assert.equal(r.status, 201);
    assert.match(r.json.id, /^keg-[0-9a-f]{8}$/);
    assert.deepEqual([r.json.title, r.json.demo, r.json.featured, 'isAdmin' in r.json], ['Judul Spasi', false, false, false]);
    assert.ok(r.json.createdAt && r.json.updatedAt);
    id = r.json.id;
  });
  test('detail menyertakan isi; PUT mengganti isi dan mempertahankan createdAt', async () => {
    const before = (await s.call('GET', `/kegiatan/${id}`)).json;
    s.clock.advance(5000);
    const r = await s.call('PUT', `/kegiatan/${id}`, { token: T, body: kegiatan({ title: 'Baru', content: doc(para('isi lengkap')) }) });
    assert.equal(r.status, 200);
    assert.deepEqual([r.json.title, r.json.createdAt === before.createdAt, r.json.updatedAt !== before.updatedAt], ['Baru', true, true]);
    const after = (await s.call('GET', `/kegiatan/${id}`)).json;
    assert.equal(after.content.content[0].content[0].text, 'isi lengkap');
  });
  test('PUT id tak ada -> 404; id berbahaya -> 404 bukan 500', async () => {
    assert.equal((await s.call('PUT', '/kegiatan/keg-nihil', { token: T, body: kegiatan() })).status, 404);
    assert.equal((await s.call('GET', '/kegiatan/..%2F..%2Fetc')).status, 404);
    assert.equal((await s.call('GET', `/kegiatan/${'a'.repeat(200)}`)).status, 404);
  });
  test('DELETE -> 204 lalu 404', async () => {
    assert.equal((await s.call('DELETE', `/kegiatan/${id}`, { token: T })).status, 204);
    assert.equal((await s.call('GET', `/kegiatan/${id}`)).status, 404);
    assert.equal((await s.call('DELETE', `/kegiatan/${id}`, { token: T })).status, 404);
  });
});

describe('validasi', () => {
  const post = (r, body) => s.call('POST', `/${r}`, { token: T, body });
  test('kegiatan kosong -> 400 dengan daftar field', async () => {
    const r = await post('kegiatan', {});
    assert.equal(r.status, 400);
    for (const f of ['title', 'type', 'date', 'mode', 'location']) assert.ok(r.json.fields[f], f);
  });
  test('enum, tanggal, tahun', async () => {
    assert.ok((await post('kegiatan', kegiatan({ type: 'konser' }))).json.fields.type);
    assert.ok((await post('kegiatan', kegiatan({ date: '2026-02-30' }))).json.fields.date);
    assert.ok((await post('publikasi', publikasi({ year: 1800 }))).json.fields.year);
    const ok = await post('publikasi', publikasi({ year: '2025' }));
    assert.deepEqual([ok.status, ok.json.year], [201, 2025]);
  });
  test('alamat gambar/PDF: javascript:, http:, // ditolak', async () => {
    for (const bad of ['javascript:alert(1)', 'http://x.com/a.png', '//evil.com/a.png', 'data:image/png;base64,AAA']) {
      assert.ok((await post('kegiatan', kegiatan({ cover: bad }))).json.fields.cover, bad);
    }
    assert.equal((await post('kegiatan', kegiatan({ cover: 'https://files.test/a.webp' }))).status, 201);
  });
  test('galeri: maksimal 12, setiap item harus URL sah', async () => {
    const img = (i) => `https://files.test/${i}.webp`;
    assert.equal((await post('kegiatan', kegiatan({ gallery: Array.from({ length: 12 }, (_, i) => img(i)) }))).status, 201);
    assert.ok((await post('kegiatan', kegiatan({ gallery: Array.from({ length: 13 }, (_, i) => img(i)) }))).json.fields.gallery);
    assert.ok((await post('kegiatan', kegiatan({ gallery: [img(1), 'javascript:x'] }))).json.fields.gallery);
    assert.ok((await post('kegiatan', kegiatan({ gallery: 'bukan-daftar' }))).json.fields.gallery);
  });
  test('kerjasama: situs wajib https, tanggal mulai opsional tetapi harus valid', async () => {
    assert.ok((await post('kerjasama', kerjasama({ website: 'http://a.id' }))).json.fields.website);
    assert.ok((await post('kerjasama', kerjasama({ since: '2025-13-01' }))).json.fields.since);
    const ok = await post('kerjasama', kerjasama({ website: 'https://a.id', since: '2025-03-01' }));
    assert.deepEqual([ok.status, ok.json.since], [201, '2025-03-01']);
  });
  test('teks kaya disanitasi di server: tautan berbahaya dibuang, elemen terlarang menolak seluruh isian', async () => {
    const evil = doc({ type: 'paragraph', content: [{ type: 'text', text: 'klik', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] });
    const r = await post('kegiatan', kegiatan({ content: evil }));
    assert.equal(r.status, 201);
    assert.equal(r.json.content.content[0].content[0].marks, undefined);
    assert.doesNotMatch(JSON.stringify(r.json), /javascript:/);
    assert.ok((await post('kegiatan', kegiatan({ content: doc({ type: 'script', content: [] }) }))).json.fields.content);
    assert.ok((await post('kegiatan', kegiatan({ content: '<script>alert(1)</script>' }))).json.fields.content);
  });
  test('featured harus boolean', async () => {
    assert.ok((await post('kegiatan', kegiatan({ featured: 'ya' }))).json.fields.featured);
  });
  test('teks panjang, tipe salah, body bukan objek, bukan JSON, bukan application/json', async () => {
    assert.ok((await post('kegiatan', kegiatan({ title: 'x'.repeat(201) }))).json.fields.title);
    assert.ok((await post('kegiatan', kegiatan({ title: { $ne: 1 } }))).json.fields.title);
    assert.equal((await s.call('POST', '/kegiatan', { token: T, raw: '[1,2]' })).status, 400);
    assert.equal((await s.call('POST', '/kegiatan', { token: T, raw: '{rusak' })).status, 400);
    assert.equal((await s.call('POST', '/kegiatan', { token: T, raw: 'a=1', headers: { 'Content-Type': 'text/plain' } })).status, 415);
  });
  test('batas ukuran: konten boleh besar (<=400 KB), login/sandi kecil (>20 KB ditolak)', async () => {
    const big = await post('kegiatan', kegiatan({ summary: 'x'.repeat(500_000) }));
    assert.equal(big.status, 413);
    const mid = await post('kegiatan', kegiatan({ content: doc(...Array.from({ length: 700 }, () => para('a'.repeat(100)))) }));
    assert.equal(mid.status, 201); // ±112 KB: melewati batas kecil 100 KB tetapi masih di bawah batas konten
    const tooMuchText = await post('kegiatan', kegiatan({ content: doc(...Array.from({ length: 900 }, () => para('a'.repeat(100)))) }));
    assert.deepEqual([tooMuchText.status, Boolean(tooMuchText.json.fields.content)], [400, true]); // 90 rb karakter > batas teks
    const small = await s.call('POST', '/auth/login', { raw: JSON.stringify({ email: 'a@b.c', password: 'x'.repeat(30_000) }) });
    assert.equal(small.status, 413);
  });
});

describe('daftar, filter, urutan, paginasi lewat HTTP', () => {
  let s2; let T2;
  before(async () => {
    s2 = await startServer(); T2 = s2.adminToken;
    const add = (r, b) => s2.call('POST', `/${r}`, { token: T2, body: b });
    // "hari ini" pada jam uji = 2026-10-08 (WIB)
    await add('kegiatan', kegiatan({ title: 'Lampau', date: '2026-09-12' }));
    await add('kegiatan', kegiatan({ title: 'Hari ini', date: '2026-10-08', type: 'seminar' }));
    await add('kegiatan', kegiatan({ title: 'Depan', date: '2026-11-28', mode: 'daring' }));
    for (let i = 1; i <= 8; i += 1) await add('publikasi', publikasi({ title: `Artikel ${i}`, year: 2020 + (i % 3), keywords: [i === 3 ? 'asesmen' : 'literasi'] }));
    await add('kerjasama', kerjasama({ partner: 'Zeta University', scope: 'luar-negeri' }));
    await add('kerjasama', kerjasama({ partner: 'Alfa Institut', since: '2024-05-01' }));
  });
  after(() => s2.close());
  const get = async (p) => (await s2.call('GET', p)).json;
  const titles = (r) => r.items.map((x) => x.title ?? x.partner);

  test('bentuk respons, total, paginasi tanpa tumpang tindih', async () => {
    const p1 = await get('/publikasi?pageSize=5&page=1');
    const p2 = await get('/publikasi?pageSize=5&page=2');
    assert.deepEqual([p1.items.length, p2.items.length, p1.total], [5, 3, 8]);
    assert.equal(p1.items.filter((a) => p2.items.some((b) => b.id === a.id)).length, 0);
    assert.equal((await get('/publikasi?page=99')).items.length, 0);
  });
  test('rentang tanggal kegiatan, inklusif', async () => {
    assert.deepEqual(titles(await get('/kegiatan?from=2026-09-12&to=2026-10-08')), ['Hari ini', 'Lampau']);
    assert.deepEqual(titles(await get('/kegiatan?from=2026-10-09')), ['Depan']);
  });
  test('status memakai tanggal WIB: hari ini = akan datang', async () => {
    assert.deepEqual(titles(await get('/kegiatan?status=upcoming&sort=date_asc')), ['Hari ini', 'Depan']);
    assert.deepEqual(titles(await get('/kegiatan?status=past')), ['Lampau']);
  });
  test('status mengikuti jam server (geser satu hari: "Hari ini" jadi lampau)', async () => {
    s2.clock.advance(24 * 3600_000);
    assert.deepEqual(titles(await get('/kegiatan?status=past&sort=date_asc')), ['Lampau', 'Hari ini']);
    s2.clock.advance(-24 * 3600_000);
  });
  test('filter jenis, format, urutan', async () => {
    assert.deepEqual(titles(await get('/kegiatan?type=seminar')), ['Hari ini']);
    assert.deepEqual(titles(await get('/kegiatan?mode=daring')), ['Depan']);
    assert.deepEqual(titles(await get('/kegiatan?sort=title_asc')), ['Depan', 'Hari ini', 'Lampau']);
  });
  test('publikasi: rentang tahun dan pencarian di kata kunci', async () => {
    const r = await get('/publikasi?from=2021&to=2021&pageSize=50');
    assert.ok(r.items.length > 0 && r.items.every((x) => x.year === 2021));
    assert.equal((await get('/publikasi?q=asesmen')).total, 1);
    assert.equal((await get('/publikasi?q=tidakadakatainiyangcocok')).total, 0);
  });
  test('kerjasama: urut nama, filter cakupan, rentang memakai tanggal mulai', async () => {
    assert.deepEqual(titles(await get('/kerjasama')), ['Alfa Institut', 'Zeta University']);
    assert.deepEqual(titles(await get('/kerjasama?type=luar-negeri')), ['Zeta University']);
    assert.deepEqual(titles(await get('/kerjasama?from=2024-01-01&to=2024-12-31')), ['Alfa Institut']);
  });
  test('parameter buruk -> 400 jelas, bukan 500', async () => {
    for (const q of ['from=kemarin', 'from=2026-12-01&to=2026-01-01', 'sort=acak', 'featured=mungkin', 'status=nanti']) {
      const r = await s2.call('GET', `/kegiatan?${q}`);
      assert.equal(r.status, 400, q);
      assert.ok(r.json.error);
    }
    const huge = await s2.call('GET', '/publikasi?pageSize=99999&page=-5');
    assert.ok(huge.json.items.length <= 50);
  });
  test('daftar tidak membawa isi teks kaya', async () => {
    const c = await s2.call('POST', '/kegiatan', { token: T2, body: kegiatan({ title: 'Berisi', content: doc(para('rahasia besar')) }) });
    const list = await s2.call('GET', '/kegiatan?q=Berisi');
    assert.equal(list.json.items[0].hasContent, true);
    assert.doesNotMatch(list.text, /rahasia besar/);
    await s2.call('DELETE', `/kegiatan/${c.json.id}`, { token: T2 });
  });
});

describe('sorotan beranda', () => {
  let s3; let T3;
  before(async () => { s3 = await startServer(); T3 = s3.adminToken; });
  after(() => s3.close());
  const add = (r, b) => s3.call('POST', `/${r}`, { token: T3, body: b });
  const sorotan = async () => (await s3.call('GET', '/sorotan')).json;

  test('kosong sama sekali -> daftar kosong', async () => assert.deepEqual(await sorotan(), { mode: 'terbaru', featuredCount: 0, items: [] }));
  test('tanpa pilihan: entri terakhir ditambahkan dari semua koleksi, terbaru dulu, maks 6', async () => {
    const ids = [];
    for (let i = 0; i < 4; i += 1) { ids.push((await add('kegiatan', kegiatan({ title: `K${i}` }))).json.id); s3.clock.advance(1000); }
    const pub = await add('publikasi', publikasi({ title: 'P' })); s3.clock.advance(1000);
    const ker = await add('kerjasama', kerjasama({ partner: 'M', kind: 'MoU' })); s3.clock.advance(1000);
    await add('kegiatan', kegiatan({ title: 'K4' })); s3.clock.advance(1000);
    await add('kegiatan', kegiatan({ title: 'K5' }));
    const s = await sorotan();
    assert.equal(s.mode, 'terbaru');
    assert.equal(s.items.length, 6);
    assert.deepEqual(s.items.map((x) => x.title ?? x.partner).slice(0, 3), ['K5', 'K4', 'M']);
    const m = s.items.find((x) => x.resource === 'kerjasama');
    assert.equal(m.id, ker.json.id);
    assert.equal(m.kind, 'MoU');
    assert.ok(s.items.some((x) => x.resource === 'publikasi' && x.id === pub.json.id) || s.items.length === 6);
  });
  test('admin memilih: hanya yang dipilih tampil, ditandai terakhir paling depan', async () => {
    const all = (await s3.call('GET', '/kegiatan?pageSize=50&sort=created_asc')).json.items;
    const first = all[0]; const second = all[1];
    assert.equal((await s3.call('PATCH', `/kegiatan/${first.id}`, { token: T3, body: { featured: true } })).json.featured, true);
    s3.clock.advance(1000);
    await s3.call('PATCH', `/kegiatan/${second.id}`, { token: T3, body: { featured: true } });
    const s = await sorotan();
    assert.deepEqual([s.mode, s.featuredCount, s.items.map((x) => x.id)], ['pilihan', 2, [second.id, first.id]]);
  });
  test('PATCH tidak mengubah isi lain dan featuredAt tidak bergeser bila sudah true', async () => {
    const a = (await s3.call('GET', '/kegiatan?pageSize=50&sort=created_asc')).json.items[0];
    s3.clock.advance(5000);
    const r = await s3.call('PATCH', `/kegiatan/${a.id}`, { token: T3, body: { featured: true } });
    assert.equal(r.json.featuredAt, a.featuredAt);
    assert.equal(r.json.title, a.title);
  });
  test('PATCH: nilai bukan boolean -> 400; id tak ada -> 404', async () => {
    const a = (await s3.call('GET', '/kegiatan?pageSize=1')).json.items[0];
    assert.equal((await s3.call('PATCH', `/kegiatan/${a.id}`, { token: T3, body: { featured: 'ya' } })).status, 400);
    assert.equal((await s3.call('PATCH', '/kegiatan/keg-nihil', { token: T3, body: { featured: true } })).status, 404);
  });
  test('membatalkan semua pilihan -> kembali ke bawaan (terbaru)', async () => {
    const picked = (await s3.call('GET', '/kegiatan?featured=true')).json.items;
    for (const p of picked) await s3.call('PATCH', `/kegiatan/${p.id}`, { token: T3, body: { featured: false } });
    assert.equal((await sorotan()).mode, 'terbaru');
  });
  test('filter featured di daftar admin', async () => {
    const any = (await s3.call('GET', '/kegiatan?pageSize=1')).json.items[0];
    await s3.call('PATCH', `/kegiatan/${any.id}`, { token: T3, body: { featured: true } });
    assert.equal((await s3.call('GET', '/kegiatan?featured=true')).json.total, 1);
    assert.ok((await s3.call('GET', '/kegiatan?featured=false')).json.total >= 5);
  });
  test('menghapus entri yang disorot langsung keluar dari sorotan (cache dibatalkan)', async () => {
    const f = (await s3.call('GET', '/kegiatan?featured=true')).json.items[0];
    await s3.call('DELETE', `/kegiatan/${f.id}`, { token: T3 });
    assert.ok(!(await sorotan()).items.some((x) => x.id === f.id));
  });
  test('isi teks kaya tidak ikut di sorotan', async () => {
    await add('kegiatan', kegiatan({ title: 'Kaya', content: doc(para('muatan-sangat-besar')) }));
    assert.doesNotMatch(JSON.stringify(await sorotan()), /muatan-sangat-besar/);
  });
});

describe('cache HTTP', () => {
  test('ETag + 304, tanpa stale-while-revalidate', async () => {
    const a = await s.call('GET', '/kerjasama');
    const etag = a.headers.get('etag');
    assert.match(a.headers.get('cache-control'), /s-maxage=60/);
    assert.doesNotMatch(a.headers.get('cache-control'), /stale-while-revalidate/);
    const b = await s.call('GET', '/kerjasama', { headers: { 'If-None-Match': etag } });
    assert.deepEqual([b.status, b.text], [304, '']);
  });
  test('ETag berubah setelah data berubah', async () => {
    const etag = (await s.call('GET', '/kerjasama')).headers.get('etag');
    const c = await s.call('POST', '/kerjasama', { token: T, body: kerjasama({ partner: 'Mitra Baru' }) });
    const after = await s.call('GET', '/kerjasama', { headers: { 'If-None-Match': etag } });
    assert.equal(after.status, 200);
    await s.call('DELETE', `/kerjasama/${c.json.id}`, { token: T });
  });
  test('respons yang membutuhkan login tidak boleh di-cache', async () => {
    for (const p of ['/auth/me', '/users', '/pendaftaran']) assert.equal((await s.call('GET', p, { token: T })).headers.get('cache-control'), 'no-store', p);
  });
});

describe('pendaftaran anggota', () => {
  const form = (o = {}) => ({ nama: 'Siti Aminah', email: 'Siti@UNIMED.ac.id', institusi: 'UNIMED', peran: 'Dosen', minat: 'Literasi digital dan seni pertunjukan.', setuju: true, ...o });
  test('valid -> 201; admin melihat dan menghapus; email dinormalkan', async () => {
    const x = await startServer({ env: { REGISTRATION_MAX_PER_HOUR: '50' } });
    try {
      assert.equal((await x.call('POST', '/pendaftaran', { body: form() })).status, 201);
      const list = await x.call('GET', '/pendaftaran', { token: x.adminToken });
      assert.deepEqual([list.json.total, list.json.items[0].email], [1, 'siti@unimed.ac.id']);
      assert.equal((await x.call('GET', '/pendaftaran?q=amin', { token: x.adminToken })).json.total, 1);
      assert.equal((await x.call('GET', '/pendaftaran?q=zzz', { token: x.adminToken })).json.total, 0);
      assert.equal((await x.call('DELETE', `/pendaftaran/${list.json.items[0].id}`, { token: x.adminToken })).status, 204);
      assert.equal((await x.call('GET', '/pendaftaran', { token: x.adminToken })).json.total, 0);
    } finally { await x.close(); }
  });
  test('validasi, honeypot, dan hanya admin yang boleh membaca', async () => {
    const x = await startServer({ env: { REGISTRATION_MAX_PER_HOUR: '50' } });
    try {
      const r = await x.call('POST', '/pendaftaran', { body: form({ email: 'bukan-email', minat: 'pendek', setuju: false, peran: 'Presiden' }) });
      for (const f of ['email', 'minat', 'setuju', 'peran']) assert.ok(r.json.fields[f], f);
      assert.equal((await x.call('POST', '/pendaftaran', { body: form({ website: 'http://spam' }) })).status, 201);
      assert.equal((await x.call('GET', '/pendaftaran', { token: x.adminToken })).json.total, 0);
      assert.equal((await x.call('GET', '/pendaftaran')).status, 401);
    } finally { await x.close(); }
  });
  test('rate limit 3 per jam per IP, XFF palsu tidak menghindarinya', async () => {
    const x = await startServer();
    try {
      const codes = [];
      for (let i = 0; i < 5; i += 1) codes.push((await x.call('POST', '/pendaftaran', { body: form(), headers: { 'X-Forwarded-For': `${i}.${i}.${i}.${i}, 7.7.7.7` } })).status);
      assert.deepEqual(codes, [201, 201, 201, 429, 429]);
    } finally { await x.close(); }
  });
});

describe('unggah berkas', () => {
  const sign = (body) => s.call('POST', '/uploads/sign', { token: T, body });
  test('PDF: URL bertanda tangan, header rentang ukuran, URL publik, nama disanitasi', async () => {
    const r = await sign({ filename: 'Jurnal Baru (Final).pdf', contentType: 'application/pdf', size: 1_000_000 });
    assert.equal(r.status, 200);
    assert.match(r.json.path, /^docs\/\d{4}\/[0-9a-f]{8}-jurnal-baru-final\.pdf$/);
    assert.match(r.json.headers['x-goog-content-length-range'], /^0,\d+$/);
    assert.equal(r.json.publicUrl, `https://storage.googleapis.com/bkt/${r.json.path}`);
    assert.equal(fakeSigner.calls.at(-1).expiresMs, 600000);
    assert.doesNotMatch((await sign({ filename: '../../etc/passwd.pdf', contentType: 'application/pdf', size: 10 })).json.path, /\.\./);
  });
  test('gambar diterima, jenis lain (svg, exe, html) ditolak', async () => {
    assert.match((await sign({ filename: 'Foto.JPG', contentType: 'image/jpeg', size: 1000 })).json.path, /^img\/\d{4}\/[0-9a-f]{8}-foto\.jpg$/);
    for (const t of ['image/svg+xml', 'application/x-msdownload', 'text/html']) assert.equal((await sign({ filename: 'a', contentType: t, size: 10 })).status, 400, t);
  });
  test('batas ukuran: PDF 20 MB, gambar 5 MB, ukuran tak valid', async () => {
    assert.equal((await sign({ filename: 'a.pdf', contentType: 'application/pdf', size: 99 * 1024 * 1024 })).status, 413);
    assert.equal((await sign({ filename: 'a.png', contentType: 'image/png', size: 6 * 1024 * 1024 })).status, 413);
    assert.equal((await sign({ filename: 'a.pdf', contentType: 'application/pdf', size: -1 })).status, 400);
  });
  test('tanpa bucket -> 501', async () => {
    const x = await startServer({ env: { GCS_BUCKET: '' }, signer: null });
    try {
      assert.equal((await x.call('POST', '/uploads/sign', { token: x.adminToken, body: { filename: 'a.pdf', contentType: 'application/pdf', size: 10 } })).status, 501);
    } finally { await x.close(); }
  });
});

describe('ketahanan', () => {
  const brokenStore = (over = {}) => ({ ...createMemoryStore(), kind: 'rusak', ...over });
  test('galat penyimpanan -> 500 generik tanpa bocoran', async () => {
    const mem = createMemoryStore();
    const x = await startServer({ store: { ...mem, list: async (r) => { if (r === 'kegiatan') throw new Error('rahasia: kredensial xyz'); return mem.list(r); } } });
    try {
      const r = await x.call('GET', '/kegiatan');
      assert.deepEqual([r.status, r.json.error], [500, 'Terjadi kesalahan pada server.']);
      assert.doesNotMatch(r.text, /rahasia/);
    } finally { await x.close(); }
  });
  test('kegagalan baca tidak di-cache', async () => {
    const mem = createMemoryStore();
    let fail = false;
    const x = await startServer({ store: { ...mem, list: async (r) => { if (fail && r === 'kegiatan') throw new Error('sementara'); return mem.list(r); } } });
    try {
      fail = true;
      assert.equal((await x.call('GET', '/kegiatan')).status, 500);
      fail = false;
      assert.equal((await x.call('GET', '/kegiatan')).status, 200);
    } finally { await x.close(); }
  });
  test('permintaan serentak ke koleksi yang sama hanya membaca penyimpanan sekali', async () => {
    const mem = createMemoryStore();
    let reads = 0;
    const x = await startServer({ store: { ...mem, list: async (r) => { if (r === 'kegiatan') { reads += 1; await new Promise((res) => setTimeout(res, 30)); } return mem.list(r); } } });
    try {
      await Promise.all(Array.from({ length: 10 }, () => x.call('GET', '/kegiatan')));
      assert.equal(reads, 1);
    } finally { await x.close(); }
  });
  test('dokumen lama tanpa field baru tetap bisa dibaca dan disunting', async () => {
    const mem = createMemoryStore();
    await mem.put('kegiatan', 'keg-lama', { title: 'Lama', type: 'workshop', date: '2026-01-01', mode: 'luring', location: 'X', summary: '', demo: true, createdAt: '2026-01-01T00:00:00Z' });
    const x = await startServer({ store: mem });
    try {
      const d = (await x.call('GET', '/kegiatan/keg-lama')).json;
      assert.deepEqual([d.cover, d.gallery, d.content, d.featured], ['', [], null, false]);
      assert.equal((await x.call('PATCH', '/kegiatan/keg-lama', { token: x.adminToken, body: { featured: true } })).status, 200);
    } finally { await x.close(); }
  });
});
