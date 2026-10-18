import { HttpError } from '../../../backend/src/shared/errors.js';
import { validate as validateShared } from '../../../backend/src/shared/validate.js';
import { kegiatanRepo, kerjasamaRepo, publikasiRepo } from '../../services/api.js';
import { formatDate } from '../../lib/format.js';

const opt = (pairs) => pairs.map(([value, label]) => ({ value, label }));
const TYPE_LABEL = { workshop: 'Workshop', seminar: 'Seminar', jurnal: 'Jurnal', penelitian: 'Penelitian', pengabdian: 'Pengabdian', 'dalam-negeri': 'Dalam negeri', 'luar-negeri': 'Luar negeri' };

/**
 * Skema admin. Satu komponen membaca skema ini untuk membuat filter, daftar, dan formulir.
 * type field: text | textarea | select | date | number | list | image | gallery | rich | checkbox
 * section: 'info' | 'foto' | 'isi' | 'opsi'
 * Aturan validasi TIDAK ditulis ulang di sini: formulir memakai validator yang sama dengan server (shared/validate).
 */
export const schemas = {
  kegiatan: {
    label: 'Kegiatan',
    repo: kegiatanRepo,
    typeFilter: { label: 'Jenis', options: opt([['workshop', 'Workshop'], ['seminar', 'Seminar']]) },
    extraFilters: [
      { name: 'mode', label: 'Format', options: opt([['luring', 'Tatap muka'], ['daring', 'Daring'], ['hybrid', 'Hybrid']]) },
      { name: 'status', label: 'Waktu', options: opt([['upcoming', 'Akan datang'], ['past', 'Sudah lewat']]) },
    ],
    dateRange: { kind: 'date', label: 'Tanggal kegiatan' },
    sorts: opt([['date_desc', 'Tanggal terbaru'], ['date_asc', 'Tanggal terlama'], ['created_desc', 'Terakhir ditambahkan'], ['title_asc', 'Judul A-Z']]),
    defaultSort: 'date_desc',
    defaults: { title: '', type: 'workshop', date: '', mode: 'luring', location: '', summary: '', cover: '', gallery: [], content: null, featured: false },
    fields: [
      { name: 'title', label: 'Judul kegiatan', type: 'text', required: true, section: 'info', full: true },
      { name: 'type', label: 'Jenis', type: 'select', required: true, section: 'info', options: opt([['workshop', 'Workshop'], ['seminar', 'Seminar']]) },
      { name: 'mode', label: 'Format', type: 'select', required: true, section: 'info', options: opt([['luring', 'Tatap muka'], ['daring', 'Daring'], ['hybrid', 'Hybrid']]) },
      { name: 'date', label: 'Tanggal', type: 'date', required: true, section: 'info' },
      { name: 'location', label: 'Lokasi atau tautan', type: 'text', required: true, section: 'info' },
      { name: 'summary', label: 'Ringkasan singkat', type: 'textarea', section: 'info', full: true, hint: 'Tampil di daftar dan kartu sorotan (maks 1000 karakter).' },
      { name: 'cover', label: 'Foto sampul', type: 'image', section: 'foto' },
      { name: 'gallery', label: 'Galeri foto', type: 'gallery', section: 'foto' },
      { name: 'content', label: 'Isi kegiatan', type: 'rich', section: 'isi' },
      { name: 'featured', label: 'Sorot di beranda', type: 'checkbox', section: 'opsi', hint: 'Kartu ini tampil di bagian Sorotan terbaru pada beranda.' },
    ],
    row: (it) => ({ title: it.title, meta: `${TYPE_LABEL[it.type]}, ${it.location}`, badge: TYPE_LABEL[it.type], when: formatDate(it.date) }),
    publicPath: (it) => `/kegiatan/${it.type}/${it.id}`,
  },
  publikasi: {
    label: 'Publikasi',
    repo: publikasiRepo,
    typeFilter: { label: 'Jenis', options: opt([['jurnal', 'Jurnal'], ['penelitian', 'Penelitian'], ['pengabdian', 'Pengabdian']]) },
    extraFilters: [],
    dateRange: { kind: 'year', label: 'Tahun terbit' },
    sorts: opt([['date_desc', 'Tahun terbaru'], ['date_asc', 'Tahun terlama'], ['created_desc', 'Terakhir ditambahkan'], ['title_asc', 'Judul A-Z']]),
    defaultSort: 'date_desc',
    defaults: { title: '', type: 'jurnal', year: new Date().getFullYear(), authors: [], venue: '', volume: '', abstract: '', keywords: [], pdfUrl: '', cover: '', featured: false },
    fields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, section: 'info', full: true },
      { name: 'type', label: 'Jenis', type: 'select', required: true, section: 'info', options: opt([['jurnal', 'Jurnal'], ['penelitian', 'Penelitian'], ['pengabdian', 'Pengabdian']]) },
      { name: 'year', label: 'Tahun', type: 'number', required: true, section: 'info' },
      { name: 'authors', label: 'Penulis', type: 'list', required: true, section: 'info', full: true, hint: 'Pisahkan dengan koma.' },
      { name: 'venue', label: 'Terbit di', type: 'text', section: 'info', full: true },
      { name: 'volume', label: 'Volume dan halaman', type: 'text', section: 'info' },
      { name: 'keywords', label: 'Kata kunci', type: 'list', section: 'info', hint: 'Pisahkan dengan koma.' },
      { name: 'abstract', label: 'Ringkasan', type: 'textarea', section: 'info', full: true },
      { name: 'pdfUrl', label: 'Berkas PDF', type: 'pdf', section: 'foto', hint: 'Contoh: /docs/nama-berkas.pdf atau tautan Cloud Storage. Kosongkan bila belum ada.' },
      { name: 'cover', label: 'Foto sampul', type: 'image', section: 'foto' },
      { name: 'featured', label: 'Sorot di beranda', type: 'checkbox', section: 'opsi', hint: 'Kartu ini tampil di bagian Sorotan terbaru pada beranda.' },
    ],
    row: (it) => ({ title: it.title, meta: it.authors.join(', '), badge: TYPE_LABEL[it.type], when: String(it.year) }),
    publicPath: (it) => `/publikasi/baca/${it.id}`,
  },
  kerjasama: {
    label: 'Kerjasama',
    repo: kerjasamaRepo,
    typeFilter: { label: 'Cakupan', options: opt([['dalam-negeri', 'Dalam negeri'], ['luar-negeri', 'Luar negeri']]) },
    extraFilters: [],
    dateRange: { kind: 'date', label: 'Mulai kerja sama' },
    sorts: opt([['title_asc', 'Nama A-Z'], ['title_desc', 'Nama Z-A'], ['date_desc', 'Mulai terbaru'], ['created_desc', 'Terakhir ditambahkan']]),
    defaultSort: 'title_asc',
    defaults: { partner: '', scope: 'dalam-negeri', kind: '', since: '', website: '', summary: '', cover: '', gallery: [], content: null, featured: false },
    fields: [
      { name: 'partner', label: 'Nama mitra', type: 'text', required: true, section: 'info', full: true },
      { name: 'scope', label: 'Cakupan', type: 'select', required: true, section: 'info', options: opt([['dalam-negeri', 'Dalam negeri'], ['luar-negeri', 'Luar negeri']]) },
      { name: 'kind', label: 'Bentuk kerja sama', type: 'text', section: 'info', hint: 'Mis. Kolaborasi riset, MoU, pendanaan.' },
      { name: 'since', label: 'Mulai kerja sama', type: 'date', section: 'info' },
      { name: 'website', label: 'Situs mitra', type: 'text', section: 'info', hint: 'Harus diawali https://' },
      { name: 'summary', label: 'Keterangan singkat', type: 'textarea', section: 'info', full: true },
      { name: 'cover', label: 'Foto atau logo mitra', type: 'image', section: 'foto' },
      { name: 'gallery', label: 'Galeri foto', type: 'gallery', section: 'foto' },
      { name: 'content', label: 'Uraian kerja sama', type: 'rich', section: 'isi' },
      { name: 'featured', label: 'Sorot di beranda', type: 'checkbox', section: 'opsi', hint: 'Kartu ini tampil di bagian Sorotan terbaru pada beranda.' },
    ],
    row: (it) => ({ title: it.partner, meta: it.kind || '', badge: TYPE_LABEL[it.scope], when: it.since ? formatDate(it.since) : '' }),
    publicPath: (it) => `/kerjasama/${it.scope}/${it.id}`,
  },
};

export const titleOf = (resource, it) => (resource === 'kerjasama' ? it.partner : it.title);
export const typeLabel = (v) => TYPE_LABEL[v] ?? v;

const splitList = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);

/** Data dari repo -> nilai formulir (daftar jadi teks berkoma, angka jadi teks). */
export function toForm(schema, item) {
  const base = { ...schema.defaults, ...(item ?? {}) };
  schema.fields.forEach((f) => {
    if (f.type === 'list') base[f.name] = Array.isArray(base[f.name]) ? base[f.name].join(', ') : base[f.name] ?? '';
    if (f.type === 'number') base[f.name] = String(base[f.name] ?? '');
    if (f.type === 'gallery') base[f.name] = Array.isArray(base[f.name]) ? base[f.name] : [];
  });
  return base;
}

/** Nilai formulir -> payload untuk API. Hanya field yang ada di skema yang dikirim. */
export function fromForm(schema, values) {
  const out = {};
  schema.fields.forEach((f) => {
    const v = values[f.name];
    if (f.type === 'list') out[f.name] = splitList(v);
    else if (f.type === 'number') out[f.name] = v === '' ? '' : Number(v);
    else if (typeof v === 'string') out[f.name] = v.trim();
    else out[f.name] = v;
  });
  return out;
}

/** Validasi di klien dengan aturan YANG SAMA seperti server. Mengembalikan { field: pesan }. */
export function validateForm(resource, schema, payload) {
  try {
    validateShared(resource, payload);
    return {};
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
    const fields = { ...(e.fields ?? {}) };
    // Isian wajib yang kosong lebih ramah dengan pesan "wajib diisi" daripada pesan format.
    schema.fields.forEach((f) => {
      const v = payload[f.name];
      if (f.required && fields[f.name] && (v === '' || v === null || (Array.isArray(v) && v.length === 0))) fields[f.name] = `${f.label} wajib diisi.`;
    });
    return fields;
  }
}
