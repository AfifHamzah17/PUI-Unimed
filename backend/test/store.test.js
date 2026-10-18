import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreStore } from '../src/stores/firestore.js';
import { createMemoryStore } from '../src/stores/memory.js';
import { loadConfig } from '../src/config.js';
import { seedStore } from '../src/seed.js';

// Tiruan minimal permukaan Firestore yang dipakai adapter: collection().limit().get(), doc().get/set/delete.
// Catatan: ini menguji LOGIKA adapter, bukan SDK asli.
function fakeFirestore() {
  const data = new Map();
  const col = (n) => (data.has(n) ? data.get(n) : (data.set(n, new Map()), data.get(n)));
  return {
    data,
    collection: (name) => ({
      limit: (n) => ({ get: async () => ({ docs: [...col(name)].slice(0, n).map(([id, v]) => ({ id, data: () => structuredClone(v) })) }) }),
      doc: (id) => ({
        get: async () => ({ exists: col(name).has(id), id, data: () => structuredClone(col(name).get(id)) }),
        set: async (v) => { col(name).set(id, structuredClone(v)); },
        delete: async () => { col(name).delete(id); },
      }),
    }),
  };
}

for (const [name, make] of [['memori', () => createMemoryStore()], ['Firestore (tiruan)', () => createFirestoreStore(fakeFirestore())]]) {
  describe(`kontrak store: ${name}`, () => {
    test('put, get, list, delete', async () => {
      const s = make();
      assert.deepEqual(await s.list('x'), []);
      await s.put('x', 'a', { id: 'diabaikan', judul: 'A' });
      await s.put('x', 'b', { judul: 'B' });
      assert.deepEqual(await s.get('x', 'a'), { judul: 'A', id: 'a' }); // id berasal dari kunci dokumen
      assert.equal((await s.list('x')).length, 2);
      assert.equal(await s.get('x', 'nihil'), null);
      assert.equal(await s.delete('x', 'a'), true);
      assert.equal(await s.delete('x', 'a'), false);
      assert.equal((await s.list('x')).length, 1);
    });
    test('koleksi terpisah', async () => {
      const s = make();
      await s.put('x', '1', { a: 1 });
      assert.deepEqual(await s.list('y'), []);
    });
    test('mutasi hasil baca tidak mengubah isi penyimpanan', async () => {
      const s = make();
      await s.put('x', '1', { arr: [1] });
      (await s.get('x', '1')).arr.push(2);
      assert.deepEqual((await s.get('x', '1')).arr, [1]);
    });
  });
}

describe('adapter Firestore', () => {
  test('dokumen disimpan tanpa field id', async () => {
    const db = fakeFirestore();
    await createFirestoreStore(db).put('kegiatan', 'keg-1', { id: 'keg-1', title: 'T' });
    assert.deepEqual(db.data.get('kegiatan').get('keg-1'), { title: 'T' });
  });
});

describe('seed', () => {
  test('mengisi koleksi kosong dan melewati yang sudah ada', async () => {
    const s = createMemoryStore();
    const r1 = await seedStore(s);
    assert.match(r1.publikasi, /ditulis/);
    const jurnal = await s.get('publikasi', 'pub-gendered-digital-2026');
    assert.equal(jurnal.pdfUrl, '/docs/jurnal-gendered-digital-vulnerabilities.pdf');
    assert.equal(jurnal.demo ?? false, false); // jurnal asli bukan data contoh
    assert.equal((await s.get('kegiatan', 'keg-1')).demo, true);
    const r2 = await seedStore(s);
    assert.match(r2.publikasi, /dilewati/);
  });
});

describe('config', () => {
  const base = { NODE_ENV: 'production', STORE: 'firestore', SESSION_SECRET: 'x'.repeat(40) };
  test('produksi valid', () => {
    const c = loadConfig(base);
    assert.deepEqual([c.store, c.production, c.bootstrapAdmin, c.sessionTtlSeconds], ['firestore', true, null, 12 * 3600]);
  });
  test('SESSION_SECRET wajib dan minimal 32 karakter (juga di dev)', () => {
    assert.throws(() => loadConfig({}), /SESSION_SECRET/);
    assert.throws(() => loadConfig({ SESSION_SECRET: 'pendek' }), /SESSION_SECRET/);
    assert.equal(loadConfig({ SESSION_SECRET: 'x'.repeat(32) }).store, 'memory');
  });
  test('produksi menolak STORE=memory', () => assert.throws(() => loadConfig({ ...base, STORE: 'memory' }), /dilarang/));
  test('produksi tanpa STORE memakai firestore', () => assert.equal(loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(40) }).store, 'firestore'));
  test('bootstrap admin divalidasi: email dan kebijakan kata sandi', () => {
    assert.throws(() => loadConfig({ ...base, BOOTSTRAP_ADMIN_EMAIL: 'bukan', BOOTSTRAP_ADMIN_PASSWORD: 'Kuat12345' }), /EMAIL/);
    assert.throws(() => loadConfig({ ...base, BOOTSTRAP_ADMIN_EMAIL: 'a@b.id', BOOTSTRAP_ADMIN_PASSWORD: 'lemah' }), /PASSWORD/);
    assert.throws(() => loadConfig({ ...base, BOOTSTRAP_ADMIN_EMAIL: 'a@b.id' }), /PASSWORD/);
    const c = loadConfig({ ...base, BOOTSTRAP_ADMIN_EMAIL: ' Admin@B.ID ', BOOTSTRAP_ADMIN_PASSWORD: 'Kuat12345' });
    assert.deepEqual([c.bootstrapAdmin.email, c.bootstrapAdmin.name], ['admin@b.id', 'Admin PUI']);
  });
  test('SCRYPT_N harus pangkat dua dan minimal 1024', () => {
    for (const n of ['100', '3000', 'abc']) assert.throws(() => loadConfig({ ...base, SCRYPT_N: n }), /SCRYPT_N/);
    assert.equal(loadConfig({ ...base, SCRYPT_N: '2048' }).scryptCost, 2048);
  });
  test('URL publik berkas diturunkan dari bucket', () => assert.equal(loadConfig({ ...base, GCS_BUCKET: 'bkt' }).publicFilesBaseUrl, 'https://storage.googleapis.com/bkt'));
  test('rahasia tidak muncul di pesan galat', () => {
    try { loadConfig({ ...base, BOOTSTRAP_ADMIN_EMAIL: 'a@b.id', BOOTSTRAP_ADMIN_PASSWORD: 'lemah' }); } catch (e) { assert.doesNotMatch(e.message, /lemah/); }
  });
});
