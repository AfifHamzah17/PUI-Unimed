/** Pembatas laju jendela-tetap per kunci (mis. IP). Per instance: cukup untuk menahan spam dan tebak-tebakan sederhana. */
export function createRateLimiter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map();
  const live = (key) => {
    const cur = hits.get(key);
    if (!cur || cur.reset <= now()) {
      hits.delete(key);
      return null;
    }
    return cur;
  };
  const prune = () => {
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now()) hits.delete(k);
  };
  return {
    /** Hitung satu permintaan. true = boleh lanjut, false = kena batas. */
    take(key) {
      prune();
      const cur = live(key);
      if (!cur) {
        hits.set(key, { count: 1, reset: now() + windowMs });
        return true;
      }
      cur.count += 1;
      return cur.count <= max;
    },
    /** Sudah mencapai batas? Tidak menambah hitungan. */
    blocked(key) {
      const cur = live(key);
      return Boolean(cur && cur.count >= max);
    },
    /** Catat satu kegagalan (dipakai untuk login). */
    hit(key) {
      prune();
      const cur = live(key);
      if (cur) cur.count += 1;
      else hits.set(key, { count: 1, reset: now() + windowMs });
    },
    reset(key) {
      hits.delete(key);
    },
  };
}
