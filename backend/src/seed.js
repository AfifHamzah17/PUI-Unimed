// Memuat data awal dari frontend (src/data/seed.js di akar repo). Hanya dipakai pengembangan dan skrip seed;
// image Docker tidak menyertakan folder frontend, jadi modul ini tidak boleh diimpor saat produksi.
import { kegiatanSeed, kerjasamaSeed, publikasiSeed, sliderSeed } from '../../src/data/seed.js';

const SETS = { kegiatan: kegiatanSeed, publikasi: publikasiSeed, kerjasama: kerjasamaSeed, slider: sliderSeed };
const META = ['_meta', 'seeded'];

/**
 * Mengisi data awal TANPA PERNAH menghapus atau menimpa data yang sudah ada, kecuali diminta eksplisit.
 *
 *  - Bawaan: koleksi yang masih kosong diisi; koleksi yang sudah berisi dilewati. Setelah itu penanda `_meta/seeded`
 *    ditulis, dan pemanggilan berikutnya tanpa opsi apa pun tidak mengubah apa-apa.
 *  - `addMissing`: menambahkan entri seed yang idnya belum ada DAN belum pernah di-seed (entri seed yang sudah dihapus
 *    admin tidak dihidupkan lagi). Dokumen yang sudah ada tidak disentuh.
 *  - `removeDemo`: menghapus dokumen bertanda `demo: true` (data contoh lama). Data buatan admin tidak pernah ikut.
 *  - `force`: menimpa dokumen berid sama dengan versi seed. Hanya untuk pemulihan.
 *  - `dryRun`: hanya melaporkan.
 */
export async function seedStore(store, { force = false, addMissing = false, removeDemo = false, dryRun = false } = {}) {
  const report = {};
  const stamp = new Date().toISOString();
  const meta = (await store.get(...META)) ?? null;
  const seededIds = meta?.ids ?? {};
  const nextIds = {};
  const write = async (...args) => (dryRun ? undefined : store.put(...args));

  if (meta && !force && !addMissing && !removeDemo) {
    return { _meta: `sudah pernah diisi pada ${meta.at}; tidak ada yang diubah (pakai --add-missing untuk menambah entri baru)` };
  }

  for (const [resource, items] of Object.entries(SETS)) {
    const existing = await store.list(resource);
    const have = new Set(existing.map((d) => d.id));
    const lines = [];
    const written = []; // hanya id yang benar-benar ada di basis data yang dicatat sebagai "sudah di-seed"

    if (removeDemo) {
      const demo = existing.filter((d) => d.demo === true);
      for (const d of demo) if (!dryRun) await store.delete(resource, d.id);
      lines.push(`${demo.length} data contoh dihapus`);
      demo.forEach((d) => have.delete(d.id));
    }

    if (force) {
      for (const { id, ...data } of items) await write(resource, id, { demo: false, ...data, createdAt: stamp, updatedAt: stamp });
      written.push(...items.map((i) => i.id));
      lines.push(`${items.length} dokumen ditimpa`);
    } else if (addMissing) {
      const already = new Set(seededIds[resource] ?? []);
      const fresh = items.filter((i) => !have.has(i.id) && !already.has(i.id));
      for (const { id, ...data } of fresh) await write(resource, id, { demo: false, ...data, createdAt: stamp, updatedAt: stamp });
      written.push(...fresh.map((i) => i.id));
      lines.push(`${fresh.length} dokumen baru ditambahkan${fresh.length ? `: ${fresh.map((i) => i.id).join(', ')}` : ''}`);
    } else if (!removeDemo) {
      if (existing.length > 0) lines.push(`dilewati (${existing.length} dokumen sudah ada)`);
      else {
        for (const { id, ...data } of items) await write(resource, id, { demo: false, ...data, createdAt: stamp, updatedAt: stamp });
        written.push(...items.map((i) => i.id));
        lines.push(`${items.length} dokumen ditulis`);
      }
    }
    const present = items.filter((i) => have.has(i.id)).map((i) => i.id);
    nextIds[resource] = [...new Set([...(seededIds[resource] ?? []), ...written, ...present])];
    report[resource] = lines.join('; ') || 'tidak ada perubahan';
  }

  if (!dryRun) await store.put(...META, { at: meta?.at ?? stamp, updatedAt: stamp, ids: nextIds });
  if (dryRun) report._dryRun = 'tidak ada yang ditulis';
  return report;
}
