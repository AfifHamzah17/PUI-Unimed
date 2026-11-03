// Gabungkan nama kelas, abaikan nilai kosong.
export const cn = (...parts) => parts.filter(Boolean).join(' ');
