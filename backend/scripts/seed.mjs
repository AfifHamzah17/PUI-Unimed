// Mengisi Firestore dengan data awal. Memakai Application Default Credentials: jalankan
// `gcloud auth application-default login` dulu.
//
//   npm run seed                      isi koleksi yang masih kosong (sekali saja; setelah itu tidak mengubah apa pun)
//   npm run seed -- --add-missing     tambah entri seed BARU saja; data yang ada tidak disentuh
//   npm run seed -- --remove-demo     hapus entri bertanda "Data contoh"; data buatan admin tidak ikut terhapus
//   npm run seed -- --dry-run         tambahkan ke perintah mana pun untuk melihat rencananya tanpa menulis
//   npm run seed -- --force --yes     MENIMPA dokumen berid sama dengan versi seed (pemulihan). Tanpa --yes ditolak.
import { Firestore } from '@google-cloud/firestore';
import { createFirestoreStore } from '../src/stores/firestore.js';
import { seedStore } from '../src/seed.js';

const has = (f) => process.argv.includes(f);
if (has('--force') && !has('--yes')) {
  console.error('--force menimpa data yang sudah diubah admin. Tambahkan --yes bila Anda yakin.');
  process.exit(1);
}
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const store = createFirestoreStore(new Firestore({ databaseId }));
const report = await seedStore(store, {
  force: has('--force'), addMissing: has('--add-missing'), removeDemo: has('--remove-demo'), dryRun: has('--dry-run'),
});
console.log(`Firestore ${databaseId}:`, report);
