// Pembuat kata sandi acak untuk admin yang membuat akun atau mereset kata sandi pengguna.
// Memakai crypto.getRandomValues; huruf/angka yang mudah tertukar (I l O 0 1) dibuang agar mudah dibacakan.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const ALL = LETTERS + DIGITS;

const pick = (set) => {
  // Penolakan sampel agar distribusi seragam (tanpa bias modulo).
  const limit = 256 - (256 % set.length);
  for (;;) {
    const [b] = crypto.getRandomValues(new Uint8Array(1));
    if (b < limit) return set[b % set.length];
  }
};

export function generatePassword(length = 12) {
  const chars = [pick(LETTERS), pick(DIGITS), ...Array.from({ length: length - 2 }, () => pick(ALL))];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const [r] = crypto.getRandomValues(new Uint32Array(1));
    const j = r % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
