// localStorage bisa melempar error (mode privat, kuota penuh). Bungkus agar aplikasi tidak ikut rusak.
export const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* diabaikan */
    }
  },
};
