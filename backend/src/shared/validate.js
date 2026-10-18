import { HttpError } from './errors.js';
import { sanitizeRich } from './richtext.js';

// ---------- penyaring tipe dasar: (nilaiMentah, label) => { value } | { error } ----------
const str = ({ max = 200, min = 0, required = false } = {}) => (raw, label) => {
  if (raw === undefined || raw === null || raw === '') {
    return required ? { error: `${label} wajib diisi.` } : { value: '' };
  }
  if (typeof raw !== 'string') return { error: `${label} harus berupa teks.` };
  const v = raw.trim();
  if (required && v.length === 0) return { error: `${label} wajib diisi.` };
  if (v.length < min) return { error: `${label} minimal ${min} karakter.` };
  if (v.length > max) return { error: `${label} maksimal ${max} karakter.` };
  return { value: v };
};

const oneOf = (values) => (raw, label) =>
  values.includes(raw) ? { value: raw } : { error: `${label} harus salah satu dari: ${values.join(', ')}.` };

const int = ({ min, max }) => (raw, label) => {
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  return Number.isInteger(n) && n >= min && n <= max ? { value: n } : { error: `${label} harus bilangan bulat ${min}-${max}.` };
};

const isRealDate = (raw) => {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw;
};
const date = ({ required = true } = {}) => (raw, label) => {
  if (!required && (raw === undefined || raw === null || raw === '')) return { value: '' };
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { error: `${label} harus berformat TTTT-BB-HH.` };
  return isRealDate(raw) ? { value: raw } : { error: `${label} bukan tanggal yang valid.` };
};

// Alamat berkas/gambar: relatif (/docs/a.pdf) atau https.
const URL_RE = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/;
const url = () => (raw, label) => {
  if (raw === undefined || raw === null || raw === '') return { value: '' };
  if (typeof raw !== 'string') return { error: `${label} harus berupa teks.` };
  const v = raw.trim();
  return v.length <= 500 && URL_RE.test(v) ? { value: v } : { error: `${label} harus diawali / atau https://` };
};
const httpsOnly = () => (raw, label) => {
  if (raw === undefined || raw === null || raw === '') return { value: '' };
  const v = typeof raw === 'string' ? raw.trim() : '';
  return v.length <= 500 && /^https:\/\/[^\s]+$/.test(v) ? { value: v } : { error: `${label} harus diawali https://` };
};
const urlList = ({ max = 12 } = {}) => (raw, label) => {
  if (raw === undefined || raw === null) return { value: [] };
  if (!Array.isArray(raw)) return { error: `${label} harus berupa daftar.` };
  if (raw.length > max) return { error: `${label} maksimal ${max} gambar.` };
  const out = [];
  for (const x of raw) {
    const r = url()(x, label);
    if (r.error) return r;
    if (r.value) out.push(r.value);
  }
  return { value: out };
};

const list = ({ maxItems = 30, maxLen = 120, required = false } = {}) => (raw, label) => {
  if (raw === undefined || raw === null) return required ? { error: `${label} wajib diisi.` } : { value: [] };
  if (!Array.isArray(raw)) return { error: `${label} harus berupa daftar.` };
  const items = raw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  if (required && items.length === 0) return { error: `${label} wajib diisi.` };
  if (items.length > maxItems) return { error: `${label} maksimal ${maxItems} item.` };
  if (items.some((x) => x.length > maxLen)) return { error: `Setiap item ${label} maksimal ${maxLen} karakter.` };
  return { value: items };
};

const email = () => (raw, label) => {
  const r = str({ max: 160, required: true })(raw, label);
  if (r.error) return r;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value) ? { value: r.value.toLowerCase() } : { error: `${label} tidak valid.` };
};

const bool = () => (raw, label) => {
  if (raw === undefined || raw === null) return { value: false };
  return typeof raw === 'boolean' ? { value: raw } : { error: `${label} harus benar atau salah.` };
};
const mustBeTrue = () => (raw, label) => (raw === true ? { value: true } : { error: `${label} wajib dicentang.` });
const rich = () => (raw, label) => sanitizeRich(raw, label);

/** Kebijakan kata sandi, dipakai juga oleh frontend untuk umpan balik langsung. */
export function passwordProblem(pw, { email: mail = '' } = {}) {
  if (typeof pw !== 'string') return 'Kata sandi wajib diisi.';
  if (pw.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (pw.length > 128) return 'Kata sandi maksimal 128 karakter.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Kata sandi harus mengandung huruf dan angka.';
  if (mail && pw.toLowerCase() === String(mail).toLowerCase()) return 'Kata sandi tidak boleh sama dengan email.';
  return null;
}

// ---------- definisi sumber daya ----------
export const RESOURCES = {
  kegiatan: {
    typeField: 'type',
    fields: {
      title: ['Judul', str({ max: 200, required: true })],
      type: ['Jenis', oneOf(['workshop', 'seminar'])],
      date: ['Tanggal', date()],
      mode: ['Format', oneOf(['luring', 'daring', 'hybrid'])],
      location: ['Lokasi', str({ max: 200, required: true })],
      summary: ['Ringkasan', str({ max: 1000 })],
      cover: ['Foto sampul', url()],
      gallery: ['Galeri', urlList({ max: 12 })],
      content: ['Isi kegiatan', rich()],
      featured: ['Sorotan', bool()],
    },
  },
  publikasi: {
    typeField: 'type',
    fields: {
      title: ['Judul', str({ max: 300, required: true })],
      type: ['Jenis', oneOf(['jurnal', 'penelitian', 'pengabdian'])],
      year: ['Tahun', int({ min: 1990, max: 2100 })],
      authors: ['Penulis', list({ required: true })],
      venue: ['Terbit di', str({ max: 200 })],
      volume: ['Volume', str({ max: 60 })],
      abstract: ['Ringkasan', str({ max: 3000 })],
      keywords: ['Kata kunci', list({ maxItems: 15 })],
      pdfUrl: ['Alamat PDF', url()],
      cover: ['Foto sampul', url()],
      featured: ['Sorotan', bool()],
    },
  },
  kerjasama: {
    typeField: 'scope',
    fields: {
      partner: ['Nama mitra', str({ max: 200, required: true })],
      scope: ['Cakupan', oneOf(['dalam-negeri', 'luar-negeri'])],
      kind: ['Bentuk kerja sama', str({ max: 120 })],
      since: ['Mulai kerja sama', date({ required: false })],
      website: ['Situs mitra', httpsOnly()],
      summary: ['Keterangan', str({ max: 1500 })],
      cover: ['Foto atau logo', url()],
      gallery: ['Galeri', urlList({ max: 12 })],
      content: ['Isi kerja sama', rich()],
      featured: ['Sorotan', bool()],
    },
  },
  pendaftaran: {
    fields: {
      nama: ['Nama', str({ min: 3, max: 120, required: true })],
      email: ['Email', email()],
      institusi: ['Institusi', str({ max: 160, required: true })],
      peran: ['Peran', oneOf(['Dosen', 'Mahasiswa', 'Guru atau tenaga pendidik', 'Pegiat seni dan budaya', 'Peneliti mitra', 'Lainnya'])],
      minat: ['Minat', str({ min: 20, max: 1500, required: true })],
      setuju: ['Persetujuan', mustBeTrue()],
    },
  },
  user: {
    fields: {
      name: ['Nama', str({ min: 2, max: 100, required: true })],
      email: ['Email', email()],
    },
  },
};

/**
 * Whitelist: hanya field yang didefinisikan yang dibawa. Sisanya (id, demo, createdAt, role, dll) dibuang
 * diam-diam sehingga klien tidak bisa menyuntikkan field sembarangan ke penyimpanan.
 */
export function validate(resource, body) {
  const def = RESOURCES[resource];
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Isi permintaan harus berupa objek JSON.');
  const value = {};
  const fields = {};
  for (const [name, [label, check]] of Object.entries(def.fields)) {
    const r = check(body[name], label);
    if (r.error) fields[name] = r.error;
    else value[name] = r.value;
  }
  if (Object.keys(fields).length) throw new HttpError(400, 'Data tidak valid.', fields);
  return value;
}

export { isRealDate };
