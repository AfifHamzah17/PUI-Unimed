// Memuat data awal dari frontend (src/data/seed.js di akar repo). Hanya dipakai pengembangan dan skrip seed;
// image Docker tidak menyertakan folder frontend, jadi modul ini tidak boleh diimpor saat produksi.
import { kegiatanSeed, kerjasamaSeed, publikasiSeed } from '../../src/data/seed.js';

const SETS = { kegiatan: kegiatanSeed, publikasi: publikasiSeed, kerjasama: kerjasamaSeed };

/** Mengisi koleksi yang masih kosong. `force` menimpa dokumen dengan id yang sama. */
export async function seedStore(store, { force = false } = {}) {
  const report = {};
  const stamp = new Date().toISOString();
  for (const [resource, items] of Object.entries(SETS)) {
    const existing = await store.list(resource);
    if (existing.length > 0 && !force) {
      report[resource] = `dilewati (${existing.length} dokumen sudah ada)`;
      continue;
    }
    for (const item of items) {
      const { id, ...data } = item;
      await store.put(resource, id, { demo: false, ...data, createdAt: stamp, updatedAt: stamp });
    }
    report[resource] = `${items.length} dokumen ditulis`;
  }
  return report;
}
