import { useCallback, useEffect, useState } from 'react';
import { Copy, Key, MagnifyingGlass, Plus, Prohibit, ShieldCheck, Trash, UserPlus, CheckCircle } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Field from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import PasswordField from '../../components/admin/PasswordField.jsx';
import ListFooter from '../../components/admin/ListFooter.jsx';
import { passwordProblem } from '../../../backend/src/shared/validate.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { refreshPending } from '../../hooks/usePending.js';
import { adminApi, isRemote } from '../../services/api.js';
import { useSession } from '../../services/auth.js';
import { formatDate } from '../../lib/format.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kelola pengguna (khusus admin). Admin hanya dapat membuat akun berperan "pengguna", tidak pernah admin. */
export default function AdminPengguna() {
  const me = useSession()?.user;
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [credential, setCredential] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  const reload = () => {
    setTick((n) => n + 1);
    refreshPending(); // lencana permintaan reset di menu ikut diperbarui
  };

  useEffect(() => setPage(1), [dq, pageSize]);
  const allowed = isRemote && me?.role === 'admin';
  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    adminApi.users.list({ q: dq, page, pageSize })
      .then((d) => alive && (setData({ ...d, page, pageSize, totalPages: Math.max(1, Math.ceil(d.total / pageSize)) }), setError('')))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [allowed, dq, page, pageSize, tick]);

  if (!isRemote) return <p className="text-muted">Pengelolaan pengguna tersedia setelah backend tersambung.</p>;
  if (!allowed) return <EmptyState title="Hanya untuk admin">Akun Anda tidak memiliki akses ke pengelolaan pengguna.</EmptyState>;

  const run = async (id, fn, okText) => {
    setBusyId(id);
    try {
      await fn();
      setNotice({ type: 'ok', text: okText });
      reload();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-medium">Pengguna</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">Pengguna dapat mengelola konten seperti admin, tetapi tidak dapat membuat atau mengubah akun lain.</p>
        </div>
        <Button onClick={() => setAdding(true)}><UserPlus size={18} aria-hidden="true" /> Tambah pengguna</Button>
      </div>

      <div className="relative mt-6 sm:max-w-sm">
        <label htmlFor="cari-pengguna" className="sr-only">Cari pengguna</label>
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input id="cari-pengguna" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[0.9375rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
      </div>

      <div className="mt-6">
        {error ? <EmptyState title="Data belum bisa dimuat">{error}</EmptyState>
          : !data ? <ul className="divide-y divide-line border-y border-line" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="py-5"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-3 h-3 w-1/4" /></li>)}</ul>
          : data.items.length === 0 ? <EmptyState title="Tidak ada pengguna">Tidak ada yang cocok dengan pencarian ini.</EmptyState>
          : (
            <ul className="divide-y divide-line border-y border-line">
              {data.items.map((u) => {
                const isAdmin = u.role === 'admin';
                const busy = busyId === u.id;
                return (
                  <li key={u.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between" style={{ opacity: busy ? 0.55 : 1 }}>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {u.name}
                        {isAdmin ? <Badge tone="accent"><ShieldCheck size={12} aria-hidden="true" /> Admin</Badge> : <Badge tone="brand">Pengguna</Badge>}
                        {!u.active && <Badge tone="danger">Nonaktif</Badge>}
                        {u.active && u.mustChangePassword && <Badge tone="accent">Belum ganti sandi</Badge>}
                        {u.resetRequestedAt && <Badge tone="accent">Minta reset sandi, {formatDate(u.resetRequestedAt.slice(0, 10))}</Badge>}
                      </p>
                      <p className="mt-1 text-sm text-muted">{u.email}{u.lastLoginAt ? `, terakhir masuk ${formatDate(u.lastLoginAt.slice(0, 10))}` : ', belum pernah masuk'}</p>
                    </div>
                    {isAdmin ? (
                      <p className="text-sm text-muted">{u.id === me?.id ? 'Ini akun Anda. Ubah lewat Akun saya.' : 'Akun admin dilindungi'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={u.resetRequestedAt ? 'primary' : 'outline'} disabled={busy} onClick={() => setResetting(u)}><Key size={16} aria-hidden="true" /> Reset sandi</Button>
                        {u.resetRequestedAt && <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(u.id, () => adminApi.users.dismissReset(u.id), 'Permintaan reset diabaikan.')}>Abaikan permintaan</Button>}
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => run(u.id, () => adminApi.users.update(u.id, { active: !u.active }), u.active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.')}>
                          {u.active ? <><Prohibit size={16} aria-hidden="true" /> Nonaktifkan</> : <><CheckCircle size={16} aria-hidden="true" /> Aktifkan</>}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} className="text-danger" onClick={() => setRemoving(u)} aria-label={`Hapus ${u.name}`}><Trash size={16} aria-hidden="true" /> Hapus</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        <ListFooter data={data} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {adding && <AddUser onClose={() => setAdding(false)} onCreated={(cred) => { setAdding(false); setCredential(cred); reload(); }} />}
      {resetting && (
        <ResetPassword
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={(cred) => { setResetting(null); setCredential(cred); reload(); }}
        />
      )}

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Hapus pengguna ini?"
        description={removing ? `${removing.name} (${removing.email})` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Batal</Button>
            <Button variant="danger" onClick={() => { const u = removing; setRemoving(null); run(u.id, () => adminApi.users.remove(u.id), 'Pengguna dihapus.'); }}>Ya, hapus</Button>
          </>
        }
      >
        <p className="text-sm text-muted">Akun dihapus permanen dan sesi yang sedang aktif langsung berakhir. Konten yang pernah ia buat tetap ada.</p>
      </Modal>

      <Modal open={Boolean(credential)} onClose={() => setCredential(null)} title={credential?.title ?? ''} size="sm" footer={<Button onClick={() => setCredential(null)}>Selesai</Button>}>
        {credential && (
          <div className="grid gap-4 text-sm">
            <p className="leading-relaxed text-muted">Berikan data ini kepada pengguna lewat saluran yang aman. Kata sandi sementara <strong className="text-ink">tidak akan ditampilkan lagi</strong>, dan pengguna wajib menggantinya saat masuk pertama.</p>
            <dl className="divide-y divide-line rounded-2xl border border-line">
              <div className="flex justify-between gap-4 p-3"><dt className="text-muted">Email</dt><dd className="font-medium">{credential.email}</dd></div>
              <div className="flex items-center justify-between gap-4 p-3"><dt className="text-muted">Kata sandi</dt><dd className="font-mono font-medium" data-testid="temp-password">{credential.password}</dd></div>
            </dl>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(`Email: ${credential.email}\nKata sandi sementara: ${credential.password}`).then(() => setNotice({ type: 'ok', text: 'Disalin.' }))}>
              <Copy size={16} aria-hidden="true" /> Salin
            </Button>
          </div>
        )}
      </Modal>
      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}

function AddUser({ onClose, onCreated }) {
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (v.name.trim().length < 2) next.name = 'Nama minimal 2 karakter.';
    if (!EMAIL_RE.test(v.email.trim())) next.email = 'Email tidak valid.';
    const problem = passwordProblem(v.password, { email: v.email });
    if (problem) next.password = problem;
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const u = await adminApi.users.create({ name: v.name.trim(), email: v.email.trim(), password: v.password });
      onCreated({ title: 'Pengguna dibuat', email: u.email, password: v.password });
    } catch (err) {
      setErrors(err.fields ?? { name: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={() => !busy && onClose()} dismissible={!busy} variant="drawer" size="sm" title="Tambah pengguna" description="Peran otomatis Pengguna. Admin lain tidak dapat dibuat dari sini."
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Batal</Button><Button type="submit" form="form-pengguna" disabled={busy}><Plus size={16} weight="bold" aria-hidden="true" /> {busy ? 'Membuat...' : 'Buat akun'}</Button></>}>
      <form id="form-pengguna" onSubmit={submit} noValidate className="grid gap-5">
        <Field id="u-name" label="Nama lengkap" required value={v.name} onChange={set('name')} error={errors.name} autoComplete="off" />
        <Field id="u-email" label="Email" type="email" required value={v.email} onChange={set('email')} error={errors.email} autoComplete="off" />
        <PasswordField id="u-password" label="Kata sandi sementara" required value={v.password} onChange={set('password')} error={errors.password} onGenerate={(pw) => setV((s) => ({ ...s, password: pw }))} />
      </form>
    </Modal>
  );
}

function ResetPassword({ user, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = passwordProblem(password, { email: user.email });
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await adminApi.users.resetPassword(user.id, password); // tanpa kata sandi lama
      onDone({ title: 'Kata sandi direset', email: user.email, password });
    } catch (err) {
      setError(err.fields?.newPassword ?? err.message);
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={() => !busy && onClose()} dismissible={!busy} size="sm" title="Reset kata sandi" description={`${user.name} (${user.email})`}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Batal</Button><Button type="submit" form="form-reset" disabled={busy}>{busy ? 'Menyimpan...' : 'Reset kata sandi'}</Button></>}>
      <form id="form-reset" onSubmit={submit} noValidate className="grid gap-4">
        <p className="text-sm leading-relaxed text-muted">Sebagai admin Anda tidak memerlukan kata sandi lama. Semua sesi pengguna ini langsung berakhir dan ia wajib menggantinya saat masuk berikutnya.</p>
        <PasswordField id="r-password" label="Kata sandi sementara baru" required value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} error={error} onGenerate={(pw) => { setPassword(pw); setError(''); }} />
      </form>
    </Modal>
  );
}
