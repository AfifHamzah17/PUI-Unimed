// Formatter Intl itu mahal dibuat; buat sekali lalu pakai ulang.
const dateLong = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const dateShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const monthShort = new Intl.DateTimeFormat('id-ID', { month: 'short' });
const numberId = new Intl.NumberFormat('id-ID');

const toDate = (iso) => (iso instanceof Date ? iso : new Date(`${iso}T00:00:00`));

export const formatDate = (iso) => (iso ? dateLong.format(toDate(iso)) : '');
export const formatDay = (iso) => (iso ? dateShort.format(toDate(iso)) : '');
export const formatMonth = (iso) => (iso ? monthShort.format(toDate(iso)) : '');
export const dayOf = (iso) => (iso ? toDate(iso).getDate() : '');
export const formatNumber = (n) => numberId.format(n);

/** Tanggal acara sudah lewat? Dibandingkan per hari, bukan per jam. */
export const isPast = (iso) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDate(iso) < today;
};
