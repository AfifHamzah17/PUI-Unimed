// Logika koleksi yang IDENTIK di backend (Firestore) dan di frontend mode lokal (localStorage).
// Menempatkannya di satu tempat menjamin filter, urutan, sorotan, dan validasi tidak bisa berbeda antar keduanya.
import { HttpError } from './errors.js';
import { RESOURCES, isRealDate, validate } from './validate.js';

export const CONTENT_RESOURCES = ['kegiatan', 'publikasi', 'kerjasama'];
export const SORTS = ['date_desc', 'date_asc', 'created_desc', 'created_asc', 'title_asc', 'title_desc'];
export const DEFAULT_SORT = { kegiatan: 'date_desc', publikasi: 'date_desc', kerjasama: 'title_asc' };
export const MAX_PAGE_SIZE = 50;

const DEFAULTS = {
  kegiatan: { cover: '', gallery: [], content: null, featured: false, featuredAt: null, demo: false },
  publikasi: { cover: '', featured: false, featuredAt: null, demo: false },
  kerjasama: { cover: '', gallery: [], content: null, since: '', website: '', featured: false, featuredAt: null, demo: false },
};
const SEARCH = {
  kegiatan: ['title', 'location', 'summary'],
  publikasi: ['title', 'authors', 'venue', 'keywords'],
  kerjasama: ['partner', 'kind', 'summary'],
};
const titleOf = (resource, it) => String(resource === 'kerjasama' ? it.partner : it.title ?? '');

/** Mengisi field baru pada dokumen lama (mis. data Firestore sebelum fitur foto ditambahkan). */
export const normalizeDoc = (resource, doc) => ({ ...DEFAULTS[resource], ...doc });

/** Daftar tidak membawa isi teks kaya yang besar; detail (GET /:id) membawanya. */
export const stripForList = (item) => {
  const { content, ...rest } = item;
  return { ...rest, hasContent: Boolean(content) };
};

/** Tanggal acuan untuk filter rentang. Publikasi hanya punya tahun, jadi dibandingkan per tahun. */
const dateOf = (resource, it) =>
  resource === 'publikasi' ? String(it.year) : resource === 'kegiatan' ? it.date : it.since || String(it.createdAt ?? '').slice(0, 10);

const lower = (v) => String(Array.isArray(v) ? v.join(' ') : v ?? '').toLowerCase();

// Rentang boleh berupa TTTT atau TTTT-BB-HH; disesuaikan dengan ketelitian tanggal sumber daya.
const edge = (v, len, end) => {
  if (!v) return '';
  if (v.length === len) return v;
  if (len === 4) return v.slice(0, 4);
  return `${v}${end ? '-12-31' : '-01-01'}`;
};

/**
 * Menormalkan dan memvalidasi parameter daftar. `get(nama)` mengembalikan string atau null
 * (cocok dengan URLSearchParams.get maupun objek biasa).
 */
export function parseListParams(resource, get) {
  const s = (k, max = 100) => String(get(k) ?? '').trim().slice(0, max);
  const num = (k, d) => Math.max(1, parseInt(get(k) ?? '', 10) || d);
  const p = {
    q: s('q'), type: s('type', 40), mode: s('mode', 20), status: s('status', 20),
    featured: s('featured', 5), from: s('from', 10), to: s('to', 10), sort: s('sort', 20) || DEFAULT_SORT[resource],
    page: num('page', 1), pageSize: Math.min(MAX_PAGE_SIZE, num('pageSize', 6)),
  };
  for (const k of ['from', 'to']) {
    if (p[k] && !(/^\d{4}$/.test(p[k]) || (/^\d{4}-\d{2}-\d{2}$/.test(p[k]) && isRealDate(p[k])))) {
      throw new HttpError(400, `Parameter ${k} harus TTTT atau TTTT-BB-HH.`, { [k]: 'Tanggal tidak valid.' });
    }
  }
  if (p.from && p.to && edge(p.from, 10, false) > edge(p.to, 10, true)) throw new HttpError(400, 'Rentang tanggal terbalik.', { from: 'Tanggal awal setelah tanggal akhir.' });
  if (!SORTS.includes(p.sort)) throw new HttpError(400, `Parameter sort harus salah satu dari: ${SORTS.join(', ')}.`);
  if (p.featured && !['true', 'false'].includes(p.featured)) throw new HttpError(400, 'Parameter featured harus true atau false.');
  if (p.status && !['upcoming', 'past'].includes(p.status)) throw new HttpError(400, 'Parameter status harus upcoming atau past.');
  return p;
}

function comparator(resource, sort) {
  const dir = sort.endsWith('_asc') ? 1 : -1;
  const kind = sort.split('_')[0];
  const base =
    kind === 'created' ? (a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
    : kind === 'title' ? (a, b) => titleOf(resource, a).localeCompare(titleOf(resource, b))
    : (a, b) => dateOf(resource, a).localeCompare(dateOf(resource, b));
  // Pemecah seri yang stabil: judul lalu id, agar halaman tidak tumpang tindih saat nilai sama.
  return (a, b) => dir * base(a, b) || titleOf(resource, a).localeCompare(titleOf(resource, b)) || String(a.id).localeCompare(String(b.id));
}

/** Menyaring, mengurutkan, memenggal halaman. `ctx.today` = 'TTTT-BB-HH' untuk filter status. */
export function listItems(items, resource, params, ctx) {
  const typeField = RESOURCES[resource].typeField;
  const needle = params.q.toLowerCase();
  const len = resource === 'publikasi' ? 4 : 10;
  const from = edge(params.from, len, false);
  const to = edge(params.to, len, true);

  const rows = items
    .map((it) => normalizeDoc(resource, it))
    .filter((it) => {
      if (params.type && it[typeField] !== params.type) return false;
      if (params.mode && it.mode !== params.mode) return false;
      if (params.featured && String(Boolean(it.featured)) !== params.featured) return false;
      if (params.status && resource === 'kegiatan') {
        if (params.status === 'upcoming' ? it.date < ctx.today : it.date >= ctx.today) return false;
      }
      if (from || to) {
        const d = dateOf(resource, it);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return !needle || SEARCH[resource].some((f) => lower(it[f]).includes(needle));
    })
    .sort(comparator(resource, params.sort));

  const start = (params.page - 1) * params.pageSize;
  return { items: rows.slice(start, start + params.pageSize).map(stripForList), total: rows.length };
}

/**
 * Kartu sorotan beranda. Bila ada entri yang ditandai admin, tampilkan itu (terbaru ditandai lebih dulu).
 * Bila tidak ada satu pun, tampilkan entri yang paling baru ditambahkan dari ketiga sumber.
 */
export function buildSorotan(map, { featuredLimit = 8, defaultLimit = 6 } = {}) {
  const all = CONTENT_RESOURCES.flatMap((kind) =>
    // `resource` (bukan `kind`): kerjasama sudah punya field `kind` untuk bentuk kerja sama.
    (map[kind] ?? []).map((it) => ({ ...stripForList(normalizeDoc(kind, it)), resource: kind }))
  );
  const picked = all.filter((x) => x.featured).sort((a, b) => String(b.featuredAt ?? '').localeCompare(String(a.featuredAt ?? '')));
  if (picked.length) return { mode: 'pilihan', featuredCount: picked.length, items: picked.slice(0, featuredLimit) };
  const latest = [...all].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, defaultLimit);
  return { mode: 'terbaru', featuredCount: 0, items: latest };
}

/** Dokumen baru yang siap disimpan. */
export function prepareCreate(resource, body, { id, nowIso }) {
  const value = validate(resource, body);
  const doc = {
    ...normalizeDoc(resource, {}), ...value,
    demo: false, featuredAt: value.featured ? nowIso : null, createdAt: nowIso, updatedAt: nowIso,
  };
  return { id, doc };
}

/** Penggantian penuh; `createdAt` dipertahankan dan `featuredAt` hanya berubah saat status sorotan berubah. */
export function prepareUpdate(resource, existing, body, { nowIso }) {
  const value = validate(resource, body);
  const was = Boolean(existing.featured);
  return {
    ...normalizeDoc(resource, {}), ...value,
    demo: false,
    featuredAt: value.featured ? (was ? existing.featuredAt ?? nowIso : nowIso) : null,
    createdAt: existing.createdAt ?? nowIso, updatedAt: nowIso,
  };
}

/** Mengubah hanya status sorotan (tombol bintang di admin). */
export function applyFeatured(existing, featured, nowIso) {
  if (typeof featured !== 'boolean') throw new HttpError(400, 'Data tidak valid.', { featured: 'Harus benar atau salah.' });
  const was = Boolean(existing.featured);
  return { ...existing, featured, featuredAt: featured ? (was ? existing.featuredAt ?? nowIso : nowIso) : null, updatedAt: nowIso };
}

/** Tanggal hari ini (TTTT-BB-HH) pada zona waktu tertentu; dipakai server agar "akan datang" mengikuti WIB. */
export const todayIn = (timeZone = 'Asia/Jakarta', now = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
