import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Info, LockKey } from '@phosphor-icons/react';
import AuthCard, { linkClass } from '../../components/auth/AuthCard.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import PasswordField from '../../components/admin/PasswordField.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';
import { adminApi, isRemote } from '../../services/api.js';
import { auth, useSession } from '../../services/auth.js';
import { safeStorage } from '../../lib/safeStorage.js';

const EMAIL_KEY = 'pui:login-email'; // hanya email; kata sandi tidak pernah disimpan

// Hanya tujuan di dalam /admin yang diikuti setelah masuk (mencegah pengalihan ke situs lain).
const safeNext = (n) => (typeof n === 'string' && /^\/admin(\/|$|\?)/.test(n) ? n : '/admin');

/** Masuk dengan email dan kata sandi. Pesan galat sengaja generik agar tidak membocorkan email yang terdaftar. */
export default function Login() {
  useDocumentTitle('Masuk');
  useNoIndex();
  const location = useLocation();
  const session = useSession();
  const next = safeNext(location.state?.from ?? new URLSearchParams(location.search).get('next'));

  const [email, setEmail] = useState(() => safeStorage.get(EMAIL_KEY, ''));
  const [remember, setRemember] = useState(() => Boolean(safeStorage.get(EMAIL_KEY)));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ended] = useState(() => auth.wasEnded());
  useEffect(() => auth.clearEnded(), []);

  if (!isRemote) {
    return (
      <AuthCard icon={LockKey} title="Masuk" lead="Mode demo tidak memakai akun.">
        <p className="flex gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed"><Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Situs ini berjalan tanpa backend, jadi halaman kelola konten terbuka tanpa login dan datanya hanya tersimpan di browser ini.</p>
        <Button to="/admin" size="lg" className="mt-6 w-full">Buka kelola konten</Button>
      </AuthCard>
    );
  }
  if (session) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await adminApi.login(email.trim(), password);
      if (remember) safeStorage.set(EMAIL_KEY, email.trim());
      else safeStorage.remove(EMAIL_KEY);
      auth.setSession(result); // halaman ini langsung mengalihkan karena sesi sudah ada
    } catch (err) {
      setError(err.message);
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <AuthCard
      icon={LockKey}
      title="Masuk untuk mengelola konten"
      lead="Gunakan akun yang diberikan admin PUI."
      footer={<>Belum punya akun? <Link to="/daftar-akun" className={linkClass}>Ajukan akun</Link></>}
    >
      <form onSubmit={submit} noValidate aria-label="Masuk">
        {ended && <p role="status" className="mb-6 flex gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed"><Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Sesi Anda berakhir atau dicabut. Masuk kembali untuk melanjutkan.</p>}
        <div className="grid gap-5">
          <Field label="Email" type="email" autoComplete="username" inputMode="email" autoFocus={!email} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordField label="Kata sandi" autoComplete="current-password" hint={null} autoFocus={Boolean(email)} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[0.875rem]">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[1.125rem] w-[1.125rem] shrink-0 rounded-md border-line accent-[rgb(var(--brand))]" />
            Ingat email di perangkat ini
          </label>
          <Link to="/lupa-sandi" className={linkClass}>Lupa kata sandi?</Link>
        </div>
        {error && <p role="alert" className="mt-5 text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || !email.trim() || !password}>{busy ? 'Memeriksa...' : 'Masuk'}</Button>
      </form>
    </AuthCard>
  );
}
