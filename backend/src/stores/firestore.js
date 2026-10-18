const MAX_DOCS = 2000; // pagar pengaman; koleksi sebesar ini sudah layak memakai kueri berindeks

/**
 * Adapter Cloud Firestore (Native mode). `db` adalah instance `Firestore` dari @google-cloud/firestore,
 * disuntikkan dari luar agar adapter bisa diuji dengan tiruan.
 * Dokumen disimpan tanpa field `id`; id adalah ID dokumen.
 */
export function createFirestoreStore(db) {
  return {
    kind: 'firestore',
    async list(resource) {
      const snap = await db.collection(resource).limit(MAX_DOCS).get();
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    },
    async get(resource, id) {
      const snap = await db.collection(resource).doc(id).get();
      return snap.exists ? { ...snap.data(), id: snap.id } : null;
    },
    async put(resource, id, doc) {
      const { id: _drop, ...data } = doc;
      await db.collection(resource).doc(id).set(data);
    },
    async delete(resource, id) {
      const ref = db.collection(resource).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      await ref.delete();
      return true;
    },
  };
}
