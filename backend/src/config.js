import { passwordProblem } from './shared/validate.js';

const list = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** Membaca dan memvalidasi environment. Gagal cepat saat start jika konfigurasi tidak aman. */
export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const store = env.STORE || (production ? 'firestore' : 'memory');
  if (!['firestore', 'memory'].includes(store)) throw new Error(`STORE tidak dikenal: ${store}`);
  if (production && store === 'memory') throw new Error('STORE=memory dilarang di produksi (data hilang saat instance berganti)');

  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET wajib diisi, minimal 32 karakter acak (simpan di Secret Manager)');
  }

  let bootstrapAdmin = null;
  if (env.BOOTSTRAP_ADMIN_EMAIL || env.BOOTSTRAP_ADMIN_PASSWORD) {
    const email = String(env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL tidak valid');
    const problem = passwordProblem(env.BOOTSTRAP_ADMIN_PASSWORD, { email });
    if (problem) throw new Error(`BOOTSTRAP_ADMIN_PASSWORD: ${problem}`);
    bootstrapAdmin = { email, password: env.BOOTSTRAP_ADMIN_PASSWORD, name: env.BOOTSTRAP_ADMIN_NAME || 'Admin PUI' };
  }

  const scryptCost = Number(env.SCRYPT_N || 16384);
  if (!Number.isInteger(scryptCost) || scryptCost < 1024 || (scryptCost & (scryptCost - 1)) !== 0) {
    throw new Error('SCRYPT_N harus pangkat dua dan minimal 1024');
  }

  const bucket = env.GCS_BUCKET || '';
  return {
    production,
    port: Number(env.PORT || 8080),
    store,
    sessionSecret: env.SESSION_SECRET,
    sessionTtlSeconds: Number(env.SESSION_TTL_HOURS || 12) * 3600,
    bootstrapAdmin,
    scryptCost,
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    firestoreDatabaseId: env.FIRESTORE_DATABASE_ID || '(default)',
    bucket,
    publicFilesBaseUrl: (env.PUBLIC_FILES_BASE_URL || (bucket ? `https://storage.googleapis.com/${bucket}` : '')).replace(/\/$/, ''),
    timeZone: env.APP_TIME_ZONE || 'Asia/Jakarta',
    cacheTtlMs: Number(env.CACHE_TTL_MS || 30_000),
    maxUploadBytes: Number(env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024),
    registrationLimit: { windowMs: 60 * 60 * 1000, max: Number(env.REGISTRATION_MAX_PER_HOUR || 5) },
    loginLimit: { windowMs: 15 * 60 * 1000, max: Number(env.LOGIN_MAX_FAILURES || 8) },
  };
}
