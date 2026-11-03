// Menangkap event pemasangan PWA sedini mungkin (sebelum komponen React terpasang).
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export const pwa = {
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  canInstall: () => deferred !== null,
  async install() {
    if (!deferred) return 'unavailable';
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    notify();
    return outcome;
  },
  isStandalone: () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true),
  isIos: () =>
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent),
};
