/** Penyimpanan di memori: untuk tes dan pengembangan lokal. Antarmuka sama dengan store Firestore. */
export function createMemoryStore() {
  const db = new Map();
  const col = (name) => {
    if (!db.has(name)) db.set(name, new Map());
    return db.get(name);
  };
  return {
    kind: 'memory',
    async list(resource) {
      return [...col(resource).entries()].map(([id, doc]) => ({ ...structuredClone(doc), id }));
    },
    async get(resource, id) {
      const doc = col(resource).get(id);
      return doc ? { ...structuredClone(doc), id } : null;
    },
    async put(resource, id, doc) {
      const { id: _drop, ...data } = doc;
      col(resource).set(id, structuredClone(data));
    },
    async delete(resource, id) {
      return col(resource).delete(id);
    },
  };
}
