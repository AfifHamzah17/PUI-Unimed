/** Cache hasil fungsi murni berdasarkan kunci. Cocok untuk agregasi data yang dipanggil berulang. */
export function memoize(fn, keyFn = (x) => x) {
  const cache = new Map();
  return (arg) => {
    const key = keyFn(arg);
    if (cache.has(key)) return cache.get(key);
    const value = fn(arg);
    cache.set(key, value);
    return value;
  };
}

/** Cache dengan masa kedaluwarsa (ms). Dipakai klien API agar daftar tidak diminta ulang tiap render. */
export function createTTLCache(ttl = 60_000) {
  const store = new Map();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (Date.now() - hit.at > ttl) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      store.set(key, { value, at: Date.now() });
    },
    clear() {
      store.clear();
    },
  };
}
