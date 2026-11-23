import { useEffect, useState } from 'react';
import { kegiatanRepo, kerjasamaRepo, publikasiRepo } from '../services/api.js';

const TTL = 60_000;
let cache = null;
let pending = null;

// Perubahan lewat admin pada sesi yang sama membuang cache ini, sehingga beranda langsung memperlihatkannya.
[kegiatanRepo, kerjasamaRepo, publikasiRepo].forEach((r) => r.subscribe(() => { cache = null; }));

/** Seluruh entri satu koleksi (maks. 4 halaman x 50). */
async function all(repo) {
  const rows = [];
  for (let page = 1; page <= 4; page += 1) {
    const r = await repo.list({ page, pageSize: 50 });
    rows.push(...r.items);
    if (rows.length >= r.total) break;
  }
  return rows;
}

function load() {
  if (cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.data);
  if (!pending) {
    pending = Promise.all([all(publikasiRepo), all(kegiatanRepo), all(kerjasamaRepo)])
      .then(([publikasi, kegiatan, kerjasama]) => {
        cache = { at: Date.now(), data: { publikasi, kegiatan, kerjasama } };
        return cache.data;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/**
 * Data nyata untuk angka dan grafik di beranda. Satu pengambilan dipakai bersama oleh semua bagian.
 * undefined = memuat, null = API gagal (bagian terkait disembunyikan), objek = data (boleh kosong).
 */
export function useSiteData() {
  const [data, setData] = useState(cache?.data);
  useEffect(() => {
    let alive = true;
    load().then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** Hitungan per tahun dari `from` sampai `to`, tahun kosong diisi 0. */
export function perYear(rows, getYear, from, to) {
  const out = [];
  for (let y = from; y <= to; y += 1) out.push({ year: y, n: rows.filter((r) => getYear(r) === y).length });
  return out;
}
