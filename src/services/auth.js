// Sesi admin di sisi klien (sessionStorage: hilang saat tab ditutup). Token dikeluarkan oleh backend
// lewat POST /auth/login. Data pengguna disimpan bersama token hanya untuk menampilkan nama/peran;
// hak akses yang sebenarnya selalu diputuskan server.
import { useSyncExternalStore } from 'react';

const KEY = 'pui:admin-session';
const ENDED_KEY = 'pui:admin-session-ended'; // penanda "sesi habis" agar halaman masuk bisa memberi tahu alasannya
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

const readRaw = () => {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

// useSyncExternalStore menuntut snapshot yang sama selama data tidak berubah, jadi hasil parse di-cache per string mentah.
let cachedRaw;
let cachedValue = null;
function snapshot() {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    cachedValue = parsed?.token && (!parsed.expiresAt || Date.parse(parsed.expiresAt) > Date.now()) ? parsed : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

const write = (value) => {
  try {
    if (value) window.sessionStorage.setItem(KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* mode privat tanpa storage: sesi tidak bertahan setelah muat ulang */
  }
  notify();
};

export const auth = {
  getSession: snapshot,
  getToken: () => snapshot()?.token ?? null,
  /** Dipanggil setelah login atau ganti kata sandi: { token, expiresAt, user }. */
  setSession: ({ token, expiresAt, user }) => write({ token, expiresAt, user }),
  patchUser(patch) {
    const s = snapshot();
    if (s) write({ ...s, user: { ...s.user, ...patch } });
  },
  clear: () => write(null),
  /** Sesi dicabut atau kedaluwarsa di server: hapus sesi dan tandai agar layar masuk menjelaskan alasannya. */
  expire() {
    try {
      window.sessionStorage.setItem(ENDED_KEY, '1');
    } catch {
      /* diabaikan */
    }
    write(null);
  },
  /** Dibaca (tanpa menghapus) oleh halaman masuk; dihapus lewat clearEnded() setelah tampil. */
  wasEnded() {
    try {
      return window.sessionStorage.getItem(ENDED_KEY) === '1';
    } catch {
      return false;
    }
  },
  clearEnded() {
    try {
      window.sessionStorage.removeItem(ENDED_KEY);
    } catch {
      /* diabaikan */
    }
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

/** { token, expiresAt, user } atau null. */
export const useSession = () => useSyncExternalStore(auth.subscribe, snapshot, () => null);
