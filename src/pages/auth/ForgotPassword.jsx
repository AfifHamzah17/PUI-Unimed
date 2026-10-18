import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Key, PaperPlaneTilt } from '@phosphor-icons/react';
import AuthCard, { linkClass } from '../../components/auth/AuthCard.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';
import { adminApi, isRemote } from '../../services/api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lupa kata sandi tanpa email: permintaan diteruskan ke admin, yang mengatur kata sandi sementara baru
 * di menu Pengguna. Jawaban server sama untuk email terdaftar maupun tidak, jadi halaman ini pun tidak membedakan.
 */
export default function ForgotPassword() {
  useDocumentTitle('Lupa kata sandi');
  useNoIndex();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');

  if (!isRemote) {
    return (
      <AuthCard icon={Key} title="Lupa kata sandi" lead="Mode demo tidak memakai akun.">
        <p className="flex gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed"><Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Permintaan reset tersedia setelah backend tersambung.</p>
      </AuthCard>
    );
  }

  if (sent) {
    return (
      <AuthCard icon={PaperPlaneTilt} title="Permintaan diteruskan" lead={`Untuk ${sent}`}>
        <div className="grid gap-4 text-[0.9375rem] leading-relaxed text-muted">
          <p>Jika email itu terdaftar sebagai akun pengguna, admin PUI sudah menerima permintaan Anda. Admin akan membuat kata sandi sementara baru dan memberikannya lewat saluran yang aman.</p>
          <p>Saat masuk dengan kata sandi sementara itu, Anda diminta langsung membuat kata sandi sendiri.</p>
        </div>
        <Button to="/masuk" size="lg" className="mt-6 w-full">Ke halaman masuk</Button>
        <button type="button" onClick={() => { setSent(''); setEmail(''); }} className={`mt-4 block w-full text-center text-sm ${linkClass}`}>Pakai email lain</button>
      </AuthCard>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError('Format email belum benar, contoh: nama@unimed.ac.id.');
    setBusy(true);
    setError('');
    try {
      await adminApi.forgotPassword(value);
      setSent(value);
    } catch (err) {
      setError(err.fields?.email ?? err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      icon={Key}
      title="Lupa kata sandi"
      lead="Masukkan email akun Anda. Permintaan diteruskan ke admin PUI yang akan mengatur kata sandi sementara baru."
      footer={<Link to="/masuk" className={`inline-flex items-center gap-1.5 ${linkClass}`}><ArrowLeft size={14} aria-hidden="true" /> Kembali ke halaman masuk</Link>}
    >
      <form onSubmit={submit} noValidate aria-label="Permintaan reset kata sandi">
        <Field label="Email" type="email" autoComplete="username" inputMode="email" autoFocus required value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} error={error} />
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || !email.trim()}>{busy ? 'Mengirim...' : 'Kirim permintaan'}</Button>
      </form>
      <p className="mt-5 text-[0.8125rem] leading-relaxed text-muted">Akun admin tidak bisa direset dari sini. Hubungi pengelola sistem untuk pemulihan.</p>
    </AuthCard>
  );
}
