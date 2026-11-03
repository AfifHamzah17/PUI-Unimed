import fs from 'node:fs';
import path from 'node:path';

/**
 * Penyimpanan berkas JSON untuk pengembangan lokal. Antarmuka sama dengan store Firestore, tetapi data
 * TIDAK hilang saat server dimulai ulang (mis. `node --watch` setiap kali berkas disimpan).
 * Penulisan atomik (tulis ke berkas sementara lalu rename) dan diserialkan agar tidak saling menimpa.
 */
export function createFileStore(file) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });

  let db = {};
  try {
    db = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw new Error(`Berkas data ${target} rusak: ${e.message}`);
  }

  let chain = Promise.resolve();
  const persist = () => {
    chain = chain.then(async () => {
      const tmp = `${target}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(db));
      await fs.promises.rename(tmp, target);
    });
    return chain;
  };
  const col = (name) => (db[name] ??= {});

  return {
    kind: 'file',
    async list(resource) {
      return Object.entries(col(resource)).map(([id, doc]) => ({ ...structuredClone(doc), id }));
    },
    async get(resource, id) {
      const doc = col(resource)[id];
      return doc ? { ...structuredClone(doc), id } : null;
    },
    async put(resource, id, doc) {
      const { id: _drop, ...data } = doc;
      col(resource)[id] = structuredClone(data);
      await persist();
    },
    async delete(resource, id) {
      if (!(id in col(resource))) return false;
      delete col(resource)[id];
      await persist();
      return true;
    },
  };
}
