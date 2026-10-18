import { HttpError } from './errors.js';

/** Pemeriksa izin untuk rute. Token diambil dari header Authorization: Bearer. */
export function createAuth({ users }) {
  /**
   * Pengguna yang sedang masuk (admin atau user). Akun yang wajib ganti kata sandi hanya boleh
   * memanggil rute yang secara eksplisit mengizinkannya (allowPasswordChange).
   */
  async function requireStaff(req, { allowPasswordChange = false } = {}) {
    const m = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
    if (!m) throw new HttpError(401, 'Perlu login.', undefined, 'login_required');
    const user = await users.authenticate(m[1]);
    if (user.mustChangePassword && !allowPasswordChange) {
      throw new HttpError(403, 'Ganti kata sandi Anda terlebih dahulu.', undefined, 'password_change_required');
    }
    return user;
  }

  async function requireAdmin(req) {
    const user = await requireStaff(req);
    if (user.role !== 'admin') throw new HttpError(403, 'Hanya admin yang dapat melakukan ini.', undefined, 'admin_only');
    return user;
  }

  return { requireStaff, requireAdmin };
}
