import { useCallback, useSyncExternalStore } from 'react';
import { safeStorage } from '../lib/safeStorage.js';

const KEY = 'pui:theme';
const listeners = new Set();
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const read = () => safeStorage.get(KEY, 'system');
const isDark = (mode) => mode === 'dark' || (mode === 'system' && !!mq?.matches);

function apply(mode) {
  document.documentElement.classList.toggle('dark', isDark(mode));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#0a2018');
}

mq?.addEventListener('change', () => {
  if (read() === 'system') {
    apply('system');
    listeners.forEach((l) => l());
  }
});

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Tema: 'light' | 'dark' | 'system'. Disimpan di localStorage, diterapkan lewat kelas .dark pada <html>. */
export function useTheme() {
  const mode = useSyncExternalStore(subscribe, read, () => 'system');
  const setMode = useCallback((next) => {
    safeStorage.set(KEY, next);
    apply(next);
    listeners.forEach((l) => l());
  }, []);
  const toggle = useCallback(() => setMode(isDark(read()) ? 'light' : 'dark'), [setMode]);
  return { mode, dark: isDark(mode), setMode, toggle };
}
