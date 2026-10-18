import crypto from 'node:crypto';
import { HttpError } from './errors.js';

const TYPES = {
  'application/pdf': { ext: 'pdf', folder: 'docs', maxKey: 'maxUploadBytes' },
  'image/webp': { ext: 'webp', folder: 'img', cap: 5 * 1024 * 1024 },
  'image/jpeg': { ext: 'jpg', folder: 'img', cap: 5 * 1024 * 1024 },
  'image/png': { ext: 'png', folder: 'img', cap: 5 * 1024 * 1024 },
};

const slug = (name) =>
  String(name).replace(/\.[^.]+$/, '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'berkas';

/** Signer Cloud Storage: URL PUT bertanda tangan v4 dengan batas ukuran yang ditegakkan oleh GCS. */
export function createGcsSigner(storage, bucketName) {
  return {
    async sign({ path, contentType, maxBytes, expiresMs }) {
      const [url] = await storage.bucket(bucketName).file(path).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + expiresMs,
        contentType,
        extensionHeaders: { 'x-goog-content-length-range': `0,${maxBytes}` },
      });
      return url;
    },
  };
}

/**
 * Admin meminta izin unggah; peramban lalu PUT langsung ke bucket. Berkas tidak lewat Cloud Run,
 * jadi tidak kena batas ukuran permintaan 32 MB dan tidak memakan memori instance.
 */
export function createUploads({ config, signer, now = () => new Date() }) {
  return {
    async sign({ filename, contentType, size }) {
      if (!signer || !config.publicFilesBaseUrl) throw new HttpError(501, 'Unggah berkas belum dikonfigurasi (GCS_BUCKET).');
      const spec = TYPES[contentType];
      if (!spec) throw new HttpError(400, 'Jenis berkas tidak didukung. Gunakan PDF, WebP, JPEG, atau PNG.');
      const cap = spec.cap ?? config[spec.maxKey];
      if (!Number.isInteger(size) || size <= 0) throw new HttpError(400, 'Ukuran berkas tidak valid.');
      if (size > cap) throw new HttpError(413, `Berkas terlalu besar. Maksimal ${Math.round(cap / 1024 / 1024)} MB.`);

      const path = `${spec.folder}/${now().getUTCFullYear()}/${crypto.randomUUID().slice(0, 8)}-${slug(filename)}.${spec.ext}`;
      const uploadUrl = await signer.sign({ path, contentType, maxBytes: cap, expiresMs: 10 * 60 * 1000 });
      return {
        uploadUrl,
        method: 'PUT',
        headers: { 'Content-Type': contentType, 'x-goog-content-length-range': `0,${cap}` },
        publicUrl: `${config.publicFilesBaseUrl}/${path}`,
        path,
      };
    },
  };
}
