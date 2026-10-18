// ============================================================================
// Lapisan data. Komponen hanya memanggil repo.* / sorotanApi / pendaftaranApi / adminApi.
//
//  - VITE_API_URL kosong  -> data di localStorage (mode demo, tanpa login)
//  - VITE_API_URL terisi  -> REST API di Cloud Run (backend/README.md)
//
// Mode lokal memakai MODUL YANG SAMA dengan backend (backend/src/shared): validasi, filter, urutan, sorotan.
// Karena itu perilaku kedua mode tidak bisa menyimpang satu sama lain.
// ============================================================================
import {
  applyFeatured, buildSorotan, listItems, normalizeDoc, parseListParams, prepareCreate, prepareUpdate, todayIn,
} from '../../backend/src/shared/collection.js';
import { HttpError } from '../../backend/src/shared/errors.js';
import { createTTLCache } from '../lib/memo.js';
import { safeStorage } from '../lib/safeStorage.js';
import { SEED_VERSION, kegiatanSeed, kerjasamaSeed, publikasiSeed } from '../data/seed.js';
import { auth } from './auth.js';

const BASE = "https://pui-backend-255264373167.asia-southeast2.run.app"
export const isRemote = Boolean(BASE);

export class ApiError extends Error {
  constructor(message, status, fields, code) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}
const fromHttp = (e) => (e instanceof HttpError ? new ApiError(e.message, e.status, e.fields, e.code) : e);

const LOCAL_LATENCY = 120; // meniru jeda jaringan agar keadaan loading (skeleton) ikut teruji
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix) => `${prefix}-${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`;

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  return p.toString();
};

/**
 * Pemanggil REST tunggal. `auth: true` menambahkan token sesi; 401 pada sesi sendiri menghapus sesi sehingga
 * layar login muncul lagi. Pesan galat, kode, dan galat per field diambil dari JSON server.
 */
async function request(path, { method = 'GET', body, auth: needsAuth = false, cache } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const bearer = needsAuth ? auth.getToken() : null;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, cache, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.', 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons bukan JSON */
  }
  if (!res.ok) {
    if (needsAuth && res.status === 401 && data?.code === 'invalid_session') auth.expire();
    if (needsAuth && res.status === 403 && data?.code === 'password_change_required') auth.patchUser({ mustChangePassword: true });
    throw new ApiError(data?.error || `Permintaan gagal (${res.status})`, res.status, data?.fields, data?.code);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Koleksi konten
// ---------------------------------------------------------------------------
function makeRepo(resource, prefix, seed) {
  const listeners = new Set();
  const cache = createTTLCache(60_000);
  let version = 0;
  const storageKey = `pui:data:${resource}`;

  const emit = () => {
    version += 1;
    cache.clear();
    listeners.forEach((l) => l());
  };

  // ---- penyimpanan lokal ----
  const readLocal = () => {
    const raw = safeStorage.get(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.v === SEED_VERSION && Array.isArray(parsed.items)) return parsed.items;
      } catch {
        /* jatuh ke seed */
      }
    }
    // createdAt dibuat berjenjang agar urutan "terakhir ditambahkan" untuk data contoh deterministik.
    const base = Date.now();
    const items = seed.map((it, i) => {
      const stamp = new Date(base - i * 60_000).toISOString();
      return normalizeDoc(resource, { ...it, createdAt: stamp, updatedAt: stamp });
    });
    safeStorage.set(storageKey, JSON.stringify({ v: SEED_VERSION, items }));
    return items;
  };
  const writeLocal = (items) => safeStorage.set(storageKey, JSON.stringify({ v: SEED_VERSION, items }));
  const nowIso = () => new Date().toISOString();

  async function list(params = {}) {
    const key = JSON.stringify(params);
    const hit = cache.get(key);
    if (hit) return hit;

    let result;
    let page;
    let pageSize;
    if (isRemote) {
      // Setelah ada perubahan di sesi ini, lewati cache HTTP peramban agar daftar langsung segar.
      result = await request(`/${resource}?${qs(params)}`, { cache: version > 0 ? 'no-cache' : undefined });
      page = Math.max(1, Number(params.page) || 1);
      pageSize = Math.min(50, Math.max(1, Number(params.pageSize) || 6));
    } else {
      await wait(LOCAL_LATENCY);
      try {
        const p = parseListParams(resource, (k) => params[k] ?? null);
        result = listItems(readLocal(), resource, p, { today: todayIn() });
        ({ page, pageSize } = p);
      } catch (e) {
        throw fromHttp(e);
      }
    }
    const out = { ...result, page, pageSize, totalPages: Math.max(1, Math.ceil(result.total / pageSize)) };
    cache.set(key, out);
    return out;
  }

  async function get(id) {
    if (isRemote) {
      try {
        return await request(`/${resource}/${encodeURIComponent(id)}`, { cache: version > 0 ? 'no-cache' : undefined });
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    }
    await wait(LOCAL_LATENCY / 2);
    return readLocal().find((it) => it.id === id) ?? null;
  }

  async function mutateLocal(fn) {
    await wait(LOCAL_LATENCY);
    try {
      const out = fn(readLocal());
      emit();
      return out;
    } catch (e) {
      throw fromHttp(e);
    }
  }
  const missing = () => new HttpError(404, 'Data tidak ditemukan.');

  async function create(data) {
    if (isRemote) {
      const created = await request(`/${resource}`, { method: 'POST', body: data, auth: true });
      emit();
      return created;
    }
    return mutateLocal((items) => {
      const { id, doc } = prepareCreate(resource, data, { id: uid(prefix), nowIso: nowIso() });
      writeLocal([{ ...doc, id }, ...items]);
      return { ...doc, id };
    });
  }

  async function update(id, data) {
    if (isRemote) {
      const updated = await request(`/${resource}/${encodeURIComponent(id)}`, { method: 'PUT', body: data, auth: true });
      emit();
      return updated;
    }
    return mutateLocal((items) => {
      const existing = items.find((it) => it.id === id);
      if (!existing) throw missing();
      const doc = { ...prepareUpdate(resource, existing, data, { nowIso: nowIso() }), id };
      writeLocal(items.map((it) => (it.id === id ? doc : it)));
      return doc;
    });
  }

  async function setFeatured(id, featured) {
    if (isRemote) {
      const updated = await request(`/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: { featured }, auth: true });
      emit();
      return updated;
    }
    return mutateLocal((items) => {
      const existing = items.find((it) => it.id === id);
      if (!existing) throw missing();
      const doc = applyFeatured(existing, featured, nowIso());
      writeLocal(items.map((it) => (it.id === id ? doc : it)));
      return doc;
    });
  }

  async function remove(id) {
    if (isRemote) {
      await request(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
      emit();
      return;
    }
    await mutateLocal((items) => {
      if (!items.some((it) => it.id === id)) throw missing();
      writeLocal(items.filter((it) => it.id !== id));
    });
  }

  // Hanya mode lokal: kembalikan data ke seed (tombol "Setel ulang" di admin).
  function reset() {
    safeStorage.remove(storageKey);
    emit();
  }

  return {
    resource, list, get, create, update, setFeatured, remove, reset, readLocal,
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getVersion: () => version,
  };
}

export const kegiatanRepo = makeRepo('kegiatan', 'keg', kegiatanSeed);
export const publikasiRepo = makeRepo('publikasi', 'pub', publikasiSeed);
export const kerjasamaRepo = makeRepo('kerjasama', 'ker', kerjasamaSeed);
export const repos = { kegiatan: kegiatanRepo, publikasi: publikasiRepo, kerjasama: kerjasamaRepo };

/** Kartu sorotan beranda: pilihan admin, atau entri terakhir ditambahkan bila belum ada yang dipilih. */
export const sorotanApi = {
  async get() {
    if (isRemote) return request('/sorotan', { cache: 'no-cache' });
    await wait(LOCAL_LATENCY);
    return buildSorotan({ kegiatan: kegiatanRepo.readLocal(), publikasi: publikasiRepo.readLocal(), kerjasama: kerjasamaRepo.readLocal() });
  },
};

// ---------------------------------------------------------------------------
// Pendaftaran anggota
// ---------------------------------------------------------------------------
const LOCAL_REG = 'pui:data:pendaftaran';
const readReg = () => {
  try {
    return JSON.parse(safeStorage.get(LOCAL_REG, '[]') || '[]');
  } catch {
    return [];
  }
};

export const pendaftaranApi = {
  async submit(data) {
    if (isRemote) {
      // Kolom `website` adalah jebakan untuk bot (honeypot); sengaja tidak pernah diisi oleh formulir.
      return request('/pendaftaran', { method: 'POST', body: { ...data, website: '' } });
    }
    await wait(LOCAL_LATENCY * 3);
    safeStorage.set(LOCAL_REG, JSON.stringify([{ ...data, id: uid('daf'), createdAt: new Date().toISOString() }, ...readReg()]));
    return { ok: true };
  },
  async list({ q = '', page = 1, pageSize = 10 } = {}) {
    if (isRemote) return request(`/pendaftaran?${qs({ q, page, pageSize })}`, { auth: true, cache: 'no-cache' });
    await wait(LOCAL_LATENCY);
    const needle = q.toLowerCase();
    const rows = readReg().filter((r) => !needle || `${r.nama} ${r.email} ${r.institusi}`.toLowerCase().includes(needle));
    return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
  },
  async remove(id) {
    if (isRemote) return request(`/pendaftaran/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
    await wait(LOCAL_LATENCY);
    safeStorage.set(LOCAL_REG, JSON.stringify(readReg().filter((r) => r.id !== id)));
    return null;
  },
};

// ---------------------------------------------------------------------------
// Akun, pengguna, dan unggah berkas (hanya bermakna saat backend aktif)
// ---------------------------------------------------------------------------
export const adminApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', auth: true, body: { oldPassword, newPassword } }),

  /** Publik. Pemohon memilih kata sandinya; akun baru ada setelah admin menyetujui. `website` = jebakan bot. */
  requestAccount: ({ name, email, password }) =>
    request('/auth/register-request', { method: 'POST', body: { name, email, password, website: '' } }),
  /** Publik. Selalu dijawab sukses oleh server agar email terdaftar tidak bisa ditebak. */
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email, website: '' } }),

  /** Jumlah pekerjaan menunggu admin: { accountRequests, passwordResets }. */
  pending: () => request('/admin/pending', { auth: true, cache: 'no-cache' }),
  accountRequests: {
    list: (params = {}) => request(`/account-requests?${qs(params)}`, { auth: true, cache: 'no-cache' }),
    approve: (id) => request(`/account-requests/${encodeURIComponent(id)}/approve`, { method: 'POST', auth: true, body: {} }),
    reject: (id) => request(`/account-requests/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  },

  users: {
    list: (params = {}) => request(`/users?${qs(params)}`, { auth: true, cache: 'no-cache' }),
    create: (body) => request('/users', { method: 'POST', auth: true, body }),
    update: (id, body) => request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body }),
    resetPassword: (id, newPassword) =>
      request(`/users/${encodeURIComponent(id)}/reset-password`, { method: 'POST', auth: true, body: { newPassword } }),
    remove: (id) => request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
    dismissReset: (id) => request(`/password-resets/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  },

  /** Unggah langsung ke Cloud Storage lewat URL bertanda tangan dari API. Mengembalikan URL publik. */
  async upload(file, onProgress) {
    const grant = await request('/uploads/sign', {
      method: 'POST', auth: true, body: { filename: file.name, contentType: file.type, size: file.size },
    });
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(grant.method, grant.uploadUrl);
      Object.entries(grant.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(`Unggah gagal (${xhr.status}).`, xhr.status)));
      xhr.onerror = () => reject(new ApiError('Unggah gagal. Periksa koneksi dan pengaturan CORS bucket.', 0));
      xhr.send(file);
    });
    return grant.publicUrl;
  },
};
