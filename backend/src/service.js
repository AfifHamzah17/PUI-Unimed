import crypto from 'node:crypto';
import { HttpError } from './errors.js';
import { applyFeatured, buildSorotan, CONTENT_RESOURCES, listItems, normalizeDoc, prepareCreate, prepareUpdate, todayIn } from './shared/collection.js';
import { validate } from './shared/validate.js';

const PREFIX = { kegiatan: 'keg', publikasi: 'pub', kerjasama: 'ker', pendaftaran: 'daf' };
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const notFound = () => new HttpError(404, 'Data tidak ditemukan.');
const newId = (resource) => `${PREFIX[resource]}-${crypto.randomUUID().slice(0, 8)}`;

export function createService({ store, config, now = () => new Date() }) {
  // Cache seluruh koleksi per sumber daya (TTL singkat). Satu pembacaan Firestore melayani banyak permintaan;
  // filter, urutan, dan paginasi dikerjakan di memori oleh logika bersama. Dibatalkan saat ada perubahan.
  const cache = new Map();

  function all(resource) {
    const hit = cache.get(resource);
    if (hit && hit.expires > Date.now()) return hit.promise;
    const promise = store.list(resource).then((rows) => rows.map((r) => normalizeDoc(resource, r)));
    cache.set(resource, { promise, expires: Date.now() + config.cacheTtlMs });
    promise.catch(() => cache.delete(resource)); // jangan simpan kegagalan
    return promise;
  }
  const requireId = (id) => {
    if (!ID_RE.test(id)) throw notFound();
  };
  const today = () => todayIn(config.timeZone, now());

  return {
    async list(resource, params) {
      return listItems(await all(resource), resource, params, { today: today() });
    },

    async get(resource, id) {
      requireId(id);
      const item = (await all(resource)).find((it) => it.id === id);
      if (!item) throw notFound();
      return item;
    },

    async sorotan() {
      const entries = await Promise.all(CONTENT_RESOURCES.map(async (r) => [r, await all(r)]));
      return buildSorotan(Object.fromEntries(entries));
    },

    async create(resource, body) {
      const { id, doc } = prepareCreate(resource, body, { id: newId(resource), nowIso: now().toISOString() });
      await store.put(resource, id, doc);
      cache.delete(resource);
      return { ...doc, id };
    },

    async update(resource, id, body) {
      requireId(id);
      const existing = await store.get(resource, id);
      if (!existing) throw notFound();
      const doc = prepareUpdate(resource, normalizeDoc(resource, existing), body, { nowIso: now().toISOString() });
      await store.put(resource, id, doc);
      cache.delete(resource);
      return { ...doc, id };
    },

    async setFeatured(resource, id, body) {
      requireId(id);
      const existing = await store.get(resource, id);
      if (!existing) throw notFound();
      const doc = applyFeatured(normalizeDoc(resource, existing), body?.featured, now().toISOString());
      await store.put(resource, id, doc);
      cache.delete(resource);
      return { ...doc, id };
    },

    async remove(resource, id) {
      requireId(id);
      if (!(await store.delete(resource, id))) throw notFound();
      cache.delete(resource);
    },

    async submitRegistration(body) {
      const value = validate('pendaftaran', body);
      await store.put('pendaftaran', newId('pendaftaran'), { ...value, createdAt: now().toISOString() });
      return { ok: true };
    },

    async listRegistrations({ q = '', page = 1, pageSize = 10 }) {
      const needle = q.toLowerCase();
      const rows = (await store.list('pendaftaran'))
        .filter((r) => !needle || `${r.nama} ${r.email} ${r.institusi}`.toLowerCase().includes(needle))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
    },

    async removeRegistration(id) {
      requireId(id);
      if (!(await store.delete('pendaftaran', id))) throw notFound();
    },
  };
}
