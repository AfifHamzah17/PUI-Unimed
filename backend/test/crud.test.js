import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { kegiatan, kerjasama, publikasi, startServer } from './helpers.js';

let s;
let T;
before(async () => { s = await startServer(); T = s.adminToken; });
after(() => s.close());

const slide = (o = {}) => ({ title: 'Slide A', subtitle: 'Keterangan', image: '/kegiatan/x/01-1600.webp', linkUrl: '/kegiatan', ctaLabel: 'Lihat', order: 1, active: true, ...o });

describe('CRUD lengkap untuk setiap koleksi', () => {
  const cases = [
    ['kegiatan', kegiatan(), { title: 'Judul baru' }, 'title'],
    ['publikasi', publikasi(), { title: 'Judul baru' }, 'title'],
    ['kerjasama', kerjasama(), { partner: 'Mitra baru' }, 'partner'],
    ['slider', slide(), { title: 'Judul baru' }, 'title'],
  ];
  for (const [res, body, patch, field] of cases) {
    test(`${res}: tambah, baca, ubah, hapus, dan tidak ada sisa`, async () => {
      const made = await s.call('POST', `/${res}`, { token: T, body });
      assert.equal(made.status, 201, JSON.stringify(made.json));
      const id = made.json.id;
      assert.ok(id);
      const got = await s.call('GET', `/${res}/${id}`);
      assert.equal(got.status, 200);
      assert.equal(got.json[field], body[field]);

      const upd = await s.call('PUT', `/${res}/${id}`, { token: T, body: { ...body, ...patch } });
      assert.equal(upd.status, 200, JSON.stringify(upd.json));
      assert.equal(upd.json[field], patch[field]);
      assert.equal((await s.call('GET', `/${res}/${id}`)).json[field], patch[field]);

      const listed = await s.call('GET', `/${res}?pageSize=50`);
      assert.ok(listed.json.items.some((x) => x.id === id));

      assert.equal((await s.call('DELETE', `/${res}/${id}`, { token: T })).status, 204);
      assert.equal((await s.call('GET', `/${res}/${id}`)).status, 404);
      assert.equal((await s.call('DELETE', `/${res}/${id}`, { token: T })).status, 404);
      assert.ok(!(await s.call('GET', `/${res}?pageSize=50`)).json.items.some((x) => x.id === id));
    });

    test(`${res}: tanpa token ditolak untuk tulis, bisa dibaca publik`, async () => {
      assert.equal((await s.call('POST', `/${res}`, { body })).status, 401);
      assert.equal((await s.call('GET', `/${res}`)).status, 200);
    });

    test(`${res}: isian tidak valid memberi 400 dengan pesan per field`, async () => {
      const r = await s.call('POST', `/${res}`, { token: T, body: { ...body, [field]: '' } });
      assert.equal(r.status, 400);
      assert.ok(r.json.fields[field]);
    });
  }

  test('ubah dengan PUT tidak membuat field sorotan atau demo bisa disuntik', async () => {
    const made = await s.call('POST', '/kegiatan', { token: T, body: { ...kegiatan(), demo: true, id: 'x', createdAt: '1999' } });
    assert.equal(made.json.demo, false);
    assert.notEqual(made.json.id, 'x');
    assert.notEqual(made.json.createdAt, '1999');
  });
});

describe('slider', () => {
  test('urut menurut `order`, dan field yang dihapus kembali ke bawaan', async () => {
    for (const [t, o] of [['C', 30], ['A', 10], ['B', 20]]) await s.call('POST', '/slider', { token: T, body: slide({ title: `Urut ${t}`, order: o }) });
    const r = await s.call('GET', '/slider?q=Urut&pageSize=50');
    assert.deepEqual(r.json.items.map((x) => x.title), ['Urut A', 'Urut B', 'Urut C']);
  });
  test('slide tanpa foto dan urutan kosong tetap valid (order jadi 0)', async () => {
    const r = await s.call('POST', '/slider', { token: T, body: { title: 'Tanpa foto', order: '', active: false } });
    assert.equal(r.status, 201);
    assert.equal(r.json.order, 0);
    assert.equal(r.json.image, '');
    assert.equal(r.json.active, false);
  });
  test('tautan tombol harus relatif atau https; foto tidak boleh http', async () => {
    assert.equal((await s.call('POST', '/slider', { token: T, body: slide({ linkUrl: 'javascript:alert(1)' }) })).status, 400);
    assert.equal((await s.call('POST', '/slider', { token: T, body: slide({ image: 'http://x/y.jpg' }) })).status, 400);
    assert.equal((await s.call('POST', '/slider', { token: T, body: slide({ linkUrl: 'https://unimed.ac.id' }) })).status, 201);
  });
  test('slider tidak ikut Sorotan beranda', async () => {
    const r = await s.call('GET', '/sorotan');
    assert.ok(r.json.items.every((x) => x.resource !== 'slider'));
  });
  test('urutan di luar 0-999 ditolak', async () => {
    assert.equal((await s.call('POST', '/slider', { token: T, body: slide({ order: 1000 }) })).status, 400);
    assert.equal((await s.call('POST', '/slider', { token: T, body: slide({ order: -1 }) })).status, 400);
  });
});

describe('sorotan dan cache setelah perubahan', () => {
  test('sorot, lepas sorot, lalu daftar langsung segar tanpa menunggu cache', async () => {
    const made = await s.call('POST', '/kegiatan', { token: T, body: kegiatan({ title: 'Cache uji' }) });
    const id = made.json.id;
    assert.equal((await s.call('GET', '/kegiatan?q=Cache+uji')).json.total, 1);
    assert.equal((await s.call('PATCH', `/kegiatan/${id}`, { token: T, body: { featured: true } })).status, 200);
    assert.equal((await s.call('GET', '/kegiatan?featured=true&q=Cache+uji')).json.total, 1);
    assert.equal((await s.call('PATCH', `/kegiatan/${id}`, { token: T, body: { featured: false } })).status, 200);
    assert.equal((await s.call('GET', '/kegiatan?featured=true&q=Cache+uji')).json.total, 0);
    await s.call('PUT', `/kegiatan/${id}`, { token: T, body: kegiatan({ title: 'Cache uji ganti' }) });
    assert.equal((await s.call('GET', '/kegiatan?q=Cache+uji+ganti')).json.total, 1);
    await s.call('DELETE', `/kegiatan/${id}`, { token: T });
    assert.equal((await s.call('GET', '/kegiatan?q=Cache+uji')).json.total, 0);
  });
  test('jenis kunjungan diterima dan bisa difilter', async () => {
    const r = await s.call('POST', '/kegiatan', { token: T, body: kegiatan({ title: 'Kunjungan uji', type: 'kunjungan' }) });
    assert.equal(r.status, 201);
    assert.equal((await s.call('GET', '/kegiatan?type=kunjungan&q=Kunjungan+uji')).json.total, 1);
    assert.equal((await s.call('GET', '/kegiatan?type=workshop&q=Kunjungan+uji')).json.total, 0);
  });
});
