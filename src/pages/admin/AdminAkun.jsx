import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Toast from '../../components/ui/Toast.jsx';
import PasswordField from '../../components/admin/PasswordField.jsx';
import PasswordStrength from '../../components/auth/PasswordStrength.jsx';
import { passwordProblem } from '../../../backend/src/shared/validate.js';
import { adminApi, isRemote } from '../../services/api.js';
import { auth, useSession } from '../../services/auth.js';

/** Akun saya: ganti kata sandi sendiri, WAJIB dengan kata sandi lama. */
export default function AdminAkun() {
  const session = useSession();
  const user = session?.user;
  const navigate = useNavigate();
  const [v, setV] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const clear = useCallback(() => setNotice(null), []);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  if (!isRemote) return <p className="text-muted">Akun tersedia setelah backend tersambung (mode demo tidak memiliki login).</p>;
  if (!user) return null;
  const forced = user.mustChangePassword;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!v.oldPassword) next.oldPassword = 'Kata sandi lama wajib diisi.';
    const problem = passwordProblem(v.newPassword, { email: user.email });
    if (problem) next.newPassword = problem;
    else if (v.newPassword === v.oldPassword) next.newPassword = 'Kata sandi baru harus berbeda dari yang lama.';
    if (v.confirm !== v.newPassword) next.confirm = 'Konfirmasi tidak sama dengan kata sandi baru.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      auth.setSession(await adminApi.changePassword(v.oldPassword, v.newPassword)); // sesi lama dicabut, sesi baru dipakai
      setV({ oldPassword: '', newPassword: '', confirm: '' });
      setNotice({ type: 'ok', text: 'Kata sandi diperbarui.' });
      if (forced) navigate('/admin');
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-medium">Akun saya</h2>
      <dl className="mt-6 divide-y divide-line border-y border-line text-[0.9375rem]">
        <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Nama</dt><dd className="font-medium">{user.name}</dd></div>
        <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Email</dt><dd className="font-medium">{user.email}</dd></div>
        <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Peran</dt><dd><Badge tone={user.role === 'admin' ? 'accent' : 'brand'}>{user.role === 'admin' ? 'Admin' : 'Pengguna'}</Badge></dd></div>
      </dl>

      {forced && (
        <p role="status" className="mt-8 flex gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed">
          <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          Kata sandi Anda masih sementara. Buat kata sandi baru untuk mulai mengelola konten.
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-10 grid gap-5" aria-label="Ganti kata sandi">
        <h3 className="font-sans text-lg font-semibold">Ganti kata sandi</h3>
        <PasswordField label="Kata sandi lama" autoComplete="current-password" hint={null} required value={v.oldPassword} onChange={set('oldPassword')} error={errors.oldPassword} />
        <div>
          <PasswordField label="Kata sandi baru" required hint={null} value={v.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
          <PasswordStrength value={v.newPassword} email={user.email} />
        </div>
        <PasswordField label="Ulangi kata sandi baru" hint={null} required value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        <div><Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan kata sandi'}</Button></div>
      </form>
      <Toast notice={notice} onDone={clear} />
    </div>
  );
}
