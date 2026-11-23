import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyFeatured, buildSorotan, listItems, normalizeDoc, parseListParams, prepareCreate, prepareUpdate, stripForList, todayIn } from '../src/shared/collection.js';
import { doc, kegiatan, kerjasama, para, publikasi } from './helpers.js';

const P = (resource, o = {}) => parseListParams(resource, (k) => o[k] ?? null);
const ids = (r) => r.items.map((x) => x.id);

const KEG = [
  { id: 'a', ...kegiatan({ title: 'Alfa', date: '2026-09-12' }), createdAt: '2026-01-01T00:00:00Z' },
  { id: 'b', ...kegiatan({ title: 'Beta', type: 'seminar', mode: 'daring', date: '2026-11-28' }), createdAt: '2026-02-01T00:00:00Z', featured: true, featuredAt: '2026-05-01T00:00:00Z' },
  { id: 'c', ...kegiatan({ title: 'Gama', date: '2026-10-08' }), createdAt: '2026-03-01T00:00:00Z' },
  { id: 'd', ...kegiatan({ title: 'Delta', type: 'seminar', date: '2027-01-15', location: 'Jakarta' }), createdAt: '2026-04-01T00:00:00Z', featured: true, featuredAt: '2026-06-01T00:00:00Z' },
];
const ctx = { today: '2026-10-08' };

describe('parseListParams', () => {
  test('nilai bawaan', () => {
    const p = P('kegiatan');
    assert.deepEqual([p.page, p.pageSize, p.sort, p.q], [1, 6, 'date_desc', '']);
    assert.equal(P('kerjasama').sort, 'title_asc');
  });
  test('batas dan pembersihan', () => {
    assert.equal(P('kegiatan', { pageSize: '99999' }).pageSize, 50);
    assert.equal(P('kegiatan', { page: '-3' }).page, 1);
    assert.equal(P('kegiatan', { q: '  halo  ' }).q, 'halo');
  });
  test('galat 400 bagi parameter tidak valid', () => {
    for (const o of [{ from: '2026-13-01' }, { from: 'kemarin' }, { to: '2026-02-30' }, { sort: 'acak' }, { featured: 'mungkin' }, { status: 'nanti' }, { from: '2026-12-01', to: '2026-01-01' }]) {
      assert.throws(() => P('kegiatan', o), (e) => e.status === 400, JSON.stringify(o));
    }
  });
});

describe('listItems: kegiatan', () => {
  test('urutan bawaan tanggal menurun', () => assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan'), ctx)), ['d', 'b', 'c', 'a']));
  test('urutan tanggal naik dan judul', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { sort: 'date_asc' }), ctx)), ['a', 'c', 'b', 'd']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { sort: 'title_desc' }), ctx)), ['c', 'b', 'd', 'a'].sort((x, y) => KEG.find((k) => k.id === y).title.localeCompare(KEG.find((k) => k.id === x).title)));
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { sort: 'created_desc' }), ctx)), ['d', 'c', 'b', 'a']);
  });
  test('rentang tanggal inklusif di kedua ujung', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { from: '2026-09-12', to: '2026-10-08' }), ctx)), ['c', 'a']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { from: '2026-10-09' }), ctx)), ['d', 'b']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { to: '2026-09-12' }), ctx)), ['a']);
  });
  test('rentang berupa tahun saja: dari awal tahun sampai akhir tahun', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { from: '2027', to: '2027' }), ctx)), ['d']);
    assert.equal(listItems(KEG, 'kegiatan', P('kegiatan', { from: '2026', to: '2026' }), ctx).total, 3);
  });
  test('status berdasarkan hari ini: hari ini dihitung akan datang', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { status: 'upcoming' }), ctx)), ['d', 'b', 'c']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { status: 'past' }), ctx)), ['a']);
  });
  test('filter jenis, format, sorotan', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { type: 'seminar' }), ctx)), ['d', 'b']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { mode: 'daring' }), ctx)), ['b']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { featured: 'true' }), ctx)), ['d', 'b']);
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { featured: 'false' }), ctx)), ['c', 'a']);
  });
  test('pencarian di judul, lokasi, ringkasan; tidak peka huruf besar', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { q: 'JAKARTA' }), ctx)), ['d']);
    assert.equal(listItems(KEG, 'kegiatan', P('kegiatan', { q: 'ringkas' }), ctx).total, 4);
  });
  test('filter digabung (AND)', () => {
    assert.deepEqual(ids(listItems(KEG, 'kegiatan', P('kegiatan', { type: 'seminar', status: 'upcoming', from: '2026-12-01' }), ctx)), ['d']);
  });
  test('paginasi: tidak tumpang tindih, total tetap, halaman kosong di luar jangkauan', () => {
    const p1 = listItems(KEG, 'kegiatan', P('kegiatan', { pageSize: '3', page: '1' }), ctx);
    const p2 = listItems(KEG, 'kegiatan', P('kegiatan', { pageSize: '3', page: '2' }), ctx);
    assert.deepEqual([ids(p1).length, ids(p2).length, p1.total], [3, 1, 4]);
    assert.equal(ids(p1).filter((x) => ids(p2).includes(x)).length, 0);
    assert.equal(listItems(KEG, 'kegiatan', P('kegiatan', { page: '9' }), ctx).items.length, 0);
  });
  test('urutan stabil saat nilai urut sama (judul sama, id berbeda)', () => {
    const same = [{ id: 'x2', ...kegiatan(), createdAt: 'z' }, { id: 'x1', ...kegiatan(), createdAt: 'z' }];
    assert.deepEqual(ids(listItems(same, 'kegiatan', P('kegiatan'), ctx)), ['x1', 'x2']);
  });
  test('daftar tidak membawa isi teks kaya tetapi menandai hasContent', () => {
    const withContent = [{ id: 'k', ...kegiatan(), content: doc(para('isi')), createdAt: 'z' }];
    const r = listItems(withContent, 'kegiatan', P('kegiatan'), ctx).items[0];
    assert.equal('content' in r, false);
    assert.equal(r.hasContent, true);
  });
  test('dokumen lama tanpa field baru tetap terbaca (normalisasi)', () => {
    const r = listItems([{ id: 'old', ...kegiatan(), createdAt: 'z' }], 'kegiatan', P('kegiatan'), ctx).items[0];
    assert.deepEqual([r.cover, r.gallery, r.featured, r.hasContent], ['', [], false, false]);
  });
});

describe('listItems: publikasi dan kerjasama', () => {
  const PUB = [
    { id: 'p1', ...publikasi({ title: 'B', year: 2024 }), createdAt: '1' },
    { id: 'p2', ...publikasi({ title: 'A', year: 2026 }), createdAt: '2' },
    { id: 'p3', ...publikasi({ title: 'C', year: 2025, type: 'penelitian' }), createdAt: '3' },
  ];
  test('urut tahun menurun lalu judul', () => assert.deepEqual(ids(listItems(PUB, 'publikasi', P('publikasi'), ctx)), ['p2', 'p3', 'p1']));
  test('rentang tahun (menerima TTTT dan tanggal penuh)', () => {
    assert.deepEqual(ids(listItems(PUB, 'publikasi', P('publikasi', { from: '2025', to: '2026' }), ctx)), ['p2', 'p3']);
    assert.deepEqual(ids(listItems(PUB, 'publikasi', P('publikasi', { from: '2025-06-01', to: '2025-07-01' }), ctx)), ['p3']);
  });
  test('penulis ikut dicari', () => assert.equal(listItems(PUB, 'publikasi', P('publikasi', { q: 'siti' }), ctx).total, 3));
  const KER = [
    { id: 'k1', ...kerjasama({ partner: 'Zeta' }), since: '2025-03-01', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'k2', ...kerjasama({ partner: 'Alfa', scope: 'luar-negeri' }), createdAt: '2026-06-01T00:00:00Z' },
  ];
  test('kerjasama: urut nama, filter cakupan lewat type', () => {
    assert.deepEqual(ids(listItems(KER, 'kerjasama', P('kerjasama'), ctx)), ['k2', 'k1']);
    assert.deepEqual(ids(listItems(KER, 'kerjasama', P('kerjasama', { type: 'luar-negeri' }), ctx)), ['k2']);
  });
  test('kerjasama: rentang memakai "mulai", jatuh ke tanggal dibuat bila kosong', () => {
    assert.deepEqual(ids(listItems(KER, 'kerjasama', P('kerjasama', { from: '2025-01-01', to: '2025-12-31' }), ctx)), ['k1']);
    assert.deepEqual(ids(listItems(KER, 'kerjasama', P('kerjasama', { from: '2026-05-01' }), ctx)), ['k2']);
  });
});

describe('sorotan beranda', () => {
  test('ada yang dipilih: hanya itu, yang terakhir ditandai paling depan', () => {
    const s = buildSorotan({ kegiatan: KEG });
    assert.equal(s.mode, 'pilihan');
    assert.deepEqual(s.items.map((x) => x.id), ['d', 'b']);
    assert.equal(s.featuredCount, 2);
  });
  test('tidak ada yang dipilih: entri terakhir ditambahkan dari SEMUA sumber', () => {
    const s = buildSorotan({
      kegiatan: [{ id: 'k', ...kegiatan(), createdAt: '2026-01-01T00:00:00Z' }],
      publikasi: [{ id: 'p', ...publikasi(), createdAt: '2026-03-01T00:00:00Z' }],
      kerjasama: [{ id: 'm', ...kerjasama(), createdAt: '2026-02-01T00:00:00Z' }],
    });
    assert.equal(s.mode, 'terbaru');
    assert.deepEqual(s.items.map((x) => [x.resource, x.id]), [['publikasi', 'p'], ['kerjasama', 'm'], ['kegiatan', 'k']]);
    assert.equal(s.items[1].kind, 'MoU'); // field kerjasama tidak tertimpa label sumber
  });
  test('batas jumlah: 6 untuk bawaan, 8 untuk pilihan', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `k${i}`, ...kegiatan(), createdAt: `2026-01-${String(i + 1).padStart(2, '0')}` }));
    assert.equal(buildSorotan({ kegiatan: many }).items.length, 6);
    const picked = many.map((m, i) => ({ ...m, featured: true, featuredAt: `2026-02-${String(i + 1).padStart(2, '0')}` }));
    const s = buildSorotan({ kegiatan: picked });
    assert.equal(s.items.length, 8);
    assert.equal(s.featuredCount, 12);
  });
  test('kosong sama sekali -> daftar kosong, tidak error', () => assert.deepEqual(buildSorotan({}).items, []));
  test('isi teks kaya tidak ikut terkirim', () => {
    const s = buildSorotan({ kegiatan: [{ id: 'k', ...kegiatan(), content: doc(para('besar')), createdAt: 'z' }] });
    assert.equal('content' in s.items[0], false);
    assert.equal(s.items[0].hasContent, true);
  });
});

describe('prepareCreate/Update/applyFeatured', () => {
  const NOW = '2026-10-08T03:00:00.000Z';
  test('create: id, stempel, demo=false, field liar dibuang', () => {
    const { id, doc: d } = prepareCreate('kegiatan', { ...kegiatan(), id: 'palsu', demo: true, role: 'admin' }, { id: 'keg-1', nowIso: NOW });
    assert.equal(id, 'keg-1');
    assert.deepEqual([d.demo, d.createdAt, d.updatedAt, d.featured, d.featuredAt, 'role' in d, 'id' in d], [false, NOW, NOW, false, null, false, false]);
  });
  test('create dengan featured=true mengisi featuredAt', () => {
    assert.equal(prepareCreate('kegiatan', { ...kegiatan(), featured: true }, { id: 'x', nowIso: NOW }).doc.featuredAt, NOW);
  });
  test('update: createdAt tetap; featuredAt hanya berubah bila status berubah', () => {
    const base = { ...prepareCreate('kegiatan', { ...kegiatan(), featured: true }, { id: 'x', nowIso: '2026-01-01T00:00:00.000Z' }).doc };
    const same = prepareUpdate('kegiatan', base, { ...kegiatan({ title: 'Baru' }), featured: true }, { nowIso: NOW });
    assert.deepEqual([same.createdAt, same.featuredAt, same.updatedAt, same.title], ['2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NOW, 'Baru']);
    const off = prepareUpdate('kegiatan', base, { ...kegiatan(), featured: false }, { nowIso: NOW });
    assert.equal(off.featuredAt, null);
    const on = prepareUpdate('kegiatan', off, { ...kegiatan(), featured: true }, { nowIso: NOW });
    assert.equal(on.featuredAt, NOW);
  });
  test('applyFeatured', () => {
    const base = normalizeDoc('kegiatan', { ...kegiatan(), createdAt: 'c', updatedAt: 'c' });
    const on = applyFeatured(base, true, NOW);
    assert.deepEqual([on.featured, on.featuredAt], [true, NOW]);
    assert.equal(applyFeatured(on, true, '2099-01-01').featuredAt, NOW); // tidak berubah
    assert.deepEqual([applyFeatured(on, false, NOW).featured, applyFeatured(on, false, NOW).featuredAt], [false, null]);
    assert.throws(() => applyFeatured(base, 'ya', NOW), (e) => e.status === 400);
  });
  test('stripForList', () => assert.deepEqual(stripForList({ a: 1, content: doc(para('x')) }), { a: 1, hasContent: true }));
  test('todayIn memakai zona waktu (UTC 20:00 = besok pagi di WIB)', () => {
    assert.equal(todayIn('Asia/Jakarta', new Date('2026-10-07T20:00:00Z')), '2026-10-08');
    assert.equal(todayIn('UTC', new Date('2026-10-07T20:00:00Z')), '2026-10-07');
  });
});
