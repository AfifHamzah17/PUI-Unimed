import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hourglass, Info, UserPlus } from '@phosphor-icons/react';
import AuthCard, { linkClass } from '../../components/auth/AuthCard.jsx';
import PasswordStrength from '../../components/auth/PasswordStrength.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import PasswordField from '../../components/admin/PasswordField.jsx';
import { passwordProblem } from '../../../backend/src/shared/validate.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';
import { adminApi, isRemote } from '../../services/api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', email: '', password: '', confirm: '', agree: false };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Format email belum benar, contoh: nama@unimed.ac.id.';
  const problem = passwordProblem(v.password, { email: v.email });
  if (problem) e.password = problem;
  if (v.confirm !== v.password) e.confirm = 'Konfirmasi tidak sama dengan kata sandi.';
  if (!v.agree) e.agree = 'Centang pernyataan ini untuk melanjutkan.';
  return e;
}

/** Pengajuan akun pengelola konten. Akun baru aktif setelah admin menyetujui; tidak ada email otomatis. */
export default function RegisterRequest() {
  useDocumentTitle('Ajukan akun');
  useNoIndex();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  if (!isRemote) {
    return (
      <AuthCard icon={UserPlus} title="Ajukan akun" lead="Mode demo tidak memakai akun.">
        <p className="flex gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed"><Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Pengajuan akun tersedia setelah backend tersambung.</p>
      </AuthCard>
    );
  }

  if (sent) {
    return (
      <AuthCard icon={Hourglass} title="Pengajuan terkirim" lead="Admin PUI akan meninjau pengajuan Anda.">
        <p className="text-[0.9375rem] leading-relaxed text-muted">
          Akun atas nama <strong className="text-ink">{sent.name}</strong> ({sent.email}) baru bisa dipakai setelah disetujui. Belum ada email pemberitahuan,
          jadi coba masuk lagi dengan kata sandi yang Anda buat tadi, atau hubungi admin PUI bila sudah beberapa hari.
        </p>
        <Button to="/masuk" size="lg" className="mt-6 w-full">Ke halaman masuk</Button>
      </AuthCard>
    );
  }

  const set = (name) => (e) => {
    const next = { ...v, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value };
    setV(next);
    if (touched[name] || (name === 'password' && touched.confirm)) setErrors(validate(next));
  };
  const blur = (name) => () => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(v));
  };
  const err = (name) => (touched[name] ? errors[name] : undefined);

  const submit = async (ev) => {
    ev.preventDefault();
    const found = validate(v);
    setErrors(found);
    setTouched({ name: true, email: true, password: true, confirm: true, agree: true });
    if (Object.keys(found).length) {
      document.getElementById(`ajukan-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await adminApi.requestAccount({ name: v.name.trim(), email: v.email.trim(), password: v.password });
      setSent({ name: v.name.trim(), email: v.email.trim() });
    } catch (e) {
      setErrors(e.fields ?? { submit: e.message });
      if (e.fields) setTouched((t) => ({ ...t, ...Object.fromEntries(Object.keys(e.fields).map((k) => [k, true])) }));
      setBusy(false);
    }
  };

  return (
    <AuthCard
      wide
      icon={UserPlus}
      title="Ajukan akun pengelola"
      lead="Untuk mengelola konten situs PUI. Admin akan meninjau lebih dulu. Ini bukan pendaftaran keanggotaan."
      footer={<>Sudah punya akun? <Link to="/masuk" className={linkClass}>Masuk</Link>. Ingin menjadi anggota PUI? Gunakan <Link to="/keanggotaan/pendaftaran" className={linkClass}>formulir pendaftaran</Link>.</>}
    >
      <form onSubmit={submit} noValidate aria-label="Pengajuan akun" className="grid gap-5">
        <Field id="ajukan-name" label="Nama lengkap" required autoComplete="name" autoFocus value={v.name} onChange={set('name')} onBlur={blur('name')} error={err('name')} />
        <Field id="ajukan-email" label="Email" type="email" required autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} onBlur={blur('email')} error={err('email')} />
        <div>
          <PasswordField id="ajukan-password" label="Kata sandi" required hint={null} value={v.password} onChange={set('password')} onBlur={blur('password')} error={err('password')} />
          <PasswordStrength value={v.password} email={v.email} />
        </div>
        <PasswordField id="ajukan-confirm" label="Ulangi kata sandi" required hint={null} value={v.confirm} onChange={set('confirm')} onBlur={blur('confirm')} error={err('confirm')} />

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
            <input id="ajukan-agree" type="checkbox" checked={v.agree} onChange={set('agree')} onBlur={blur('agree')} aria-invalid={err('agree') ? 'true' : undefined} className="mt-1 h-5 w-5 shrink-0 rounded-md border-line accent-[rgb(var(--brand))]" />
            <span>Saya memahami akun ini baru aktif setelah disetujui admin, dan kata sandi ini hanya saya yang tahu.</span>
          </label>
          {err('agree') && <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-danger">{errors.agree}</p>}
        </div>

        {errors.submit && <p role="alert" className="text-sm font-medium text-danger">{errors.submit}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Mengirim...' : 'Kirim pengajuan'}</Button>
      </form>
    </AuthCard>
  );
}
