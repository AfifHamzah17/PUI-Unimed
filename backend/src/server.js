import http from 'node:http';
import { createApp } from './app.js';
import { createAuth } from './auth.js';
import { loadConfig } from './config.js';
import { log } from './log.js';
import { createRateLimiter } from './ratelimit.js';
import { createService } from './service.js';
import { createSessions } from './session.js';
import { createUsers } from './users.js';
import { createGcsSigner, createUploads } from './uploads.js';
import { createMemoryStore } from './stores/memory.js';
import { createFileStore } from './stores/file.js';
import { createFirestoreStore } from './stores/firestore.js';

async function main() {
  const config = loadConfig();

  let store;
  if (config.store === 'firestore') {
    const { Firestore } = await import('@google-cloud/firestore');
    // maxIdleChannels: tahan beberapa kanal gRPC tetap terbuka antar permintaan (bawaan hanya 1), sehingga lonjakan
    // pengunjung tidak membayar jabat tangan TLS baru berulang kali. SDK sendiri mengelola kolam kanalnya.
    store = createFirestoreStore(new Firestore({ databaseId: config.firestoreDatabaseId, maxIdleChannels: 4 }));
  } else {
    store = config.store === 'file' ? createFileStore(config.dataFile) : createMemoryStore();
    // Data contoh dimuat SEKALI saja (ditandai di koleksi _meta), bukan setiap start, supaya data yang sudah
    // ditambah atau dihapus tidak dikembalikan lagi ke data contoh.
    // Hanya pengembangan lokal (STORE=file atau memory). Pertama kali: isi data awal. Sesudahnya: tambahkan entri seed
    // yang baru dan buang entri bertanda "Data contoh" lama; data buatan admin tidak pernah disentuh.
    if (process.env.SEED === '1') {
      const { seedStore } = await import('./seed.js');
      const first = !(await store.get('_meta', 'seeded'));
      await seedStore(store, first ? {} : { addMissing: true, removeDemo: true });
      log('INFO', 'data contoh dimuat', { store: store.kind });
    }
  }

  let signer = null;
  if (config.bucket) {
    const { Storage } = await import('@google-cloud/storage');
    signer = createGcsSigner(new Storage(), config.bucket);
  }

  const sessions = createSessions({ secret: config.sessionSecret, ttlSeconds: config.sessionTtlSeconds });
  const users = createUsers({ store, sessions, config });
  const boot = await users.bootstrap();
  if (boot.created) log('WARNING', 'admin pertama dibuat dari BOOTSTRAP_ADMIN_*; wajib ganti kata sandi saat login pertama dan hapus variabel itu', { email: boot.email });

  const app = createApp({
    storeKind: store.kind,
    config,
    service: createService({ store, config }),
    users,
    auth: createAuth({ users }),
    uploads: createUploads({ config, signer }),
    limiter: createRateLimiter(config.registrationLimit),
    loginLimiter: createRateLimiter(config.loginLimit),
  });

  const server = http.createServer(app.handle);
  server.keepAliveTimeout = 650_000; // lebih panjang dari batas idle load balancer Google
  server.headersTimeout = 660_000;
  server.requestTimeout = 30_000;
  server.listen(config.port, '0.0.0.0', () =>
    log('INFO', 'server berjalan', { port: config.port, store: store.kind, production: config.production })
  );

  const stop = (sig) => {
    log('INFO', 'menutup server', { sig });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 9000).unref(); // Cloud Run memberi 10 detik setelah SIGTERM
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('unhandledRejection', (e) => log('ERROR', 'unhandledRejection', { error: String(e?.stack || e) }));
}

main().catch((e) => {
  log('ERROR', 'gagal start', { error: e.message });
  process.exit(1);
});
