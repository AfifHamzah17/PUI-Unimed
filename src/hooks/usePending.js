import { useSyncExternalStore } from 'react';
import { adminApi } from '../services/api.js';

// Jumlah pengajuan akun dan permintaan reset sandi yang menunggu admin. Satu sumber untuk lencana menu,
// ringkasan, dan halaman terkait; halaman memanggil refreshPending() setelah mengubah sesuatu.
const EMPTY = { accountRequests: 0, passwordResets: 0 };
let state = EMPTY;
const listeners = new Set();
const set = (next) => {
  if (next.accountRequests === state.accountRequests && next.passwordResets === state.passwordResets) return;
  state = next;
  listeners.forEach((l) => l());
};

export async function refreshPending() {
  try {
    const { accountRequests = 0, passwordResets = 0 } = await adminApi.pending();
    set({ accountRequests, passwordResets });
  } catch {
    /* lencana hanya pelengkap; abaikan galat */
  }
}
export const resetPending = () => set(EMPTY);

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const usePending = () => useSyncExternalStore(subscribe, () => state, () => EMPTY);
