import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

const body = { filename: 'Foto Kegiatan.png', contentType: 'image/png', size: 1024 };
let s;
before(async () => {
  const denied = { async sign() { throw new Error("Permission 'iam.serviceAccounts.signBlob' denied on resource\n    at Gaxios._request (/app/node_modules/gaxios.js:142:23)"); } };
  s = await startServer({ signer: denied });
});
after(() => s.close());

test('gagal menandatangani URL (izin IAM) -> 503 yang jelas, rincian teknis tidak bocor ke klien', async () => {
  const r = await s.call('POST', '/uploads/sign', { token: s.adminToken, body });
  assert.equal(r.status, 503);
  assert.equal(r.json.code, 'upload_unavailable');
  assert.doesNotMatch(r.text, /signBlob|Gaxios|iam\./);
});

test('validasi tetap berjalan sebelum menandatangani', async () => {
  assert.equal((await s.call('POST', '/uploads/sign', { token: s.adminToken, body: { ...body, contentType: 'text/html' } })).status, 400);
  assert.equal((await s.call('POST', '/uploads/sign', { token: s.adminToken, body: { ...body, size: 6 * 1024 * 1024 } })).status, 413);
  assert.equal((await s.call('POST', '/uploads/sign', { body })).status, 401);
});
