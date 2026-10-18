// Mengisi Firestore dengan data awal: npm run seed  (tambah --force untuk menimpa).
// Memakai Application Default Credentials: jalankan `gcloud auth application-default login` dulu.
import { Firestore } from '@google-cloud/firestore';
import { createFirestoreStore } from '../src/stores/firestore.js';
import { seedStore } from '../src/seed.js';

const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const force = process.argv.includes('--force');
const store = createFirestoreStore(new Firestore({ databaseId }));
const report = await seedStore(store, { force });
console.log(`Firestore ${databaseId}:`, report);
