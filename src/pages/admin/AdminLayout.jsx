import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpenText, CalendarBlank, EnvelopeSimple, Handshake, Info, SignOut, SquaresFour, Star, UserCircle, UserPlus, Users } from '@phosphor-icons/react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';
import { refreshPending, resetPending, usePending } from '../../hooks/usePending.js';
import { adminApi, isRemote, repos } from '../../services/api.js';
import { auth, useSession } from '../../services/auth.js';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

const items = [
  { to: '/admin', label: 'Ringkasan', icon: SquaresFour, end: true },
  { to: '/admin/kegiatan', label: 'Kegiatan', icon: CalendarBlank },
  { to: '/admin/publikasi', label: 'Publikasi', icon: BookOpenText },
  { to: '/admin/kerjasama', label: 'Kerjasama', icon: Handshake },
  { to: '/admin/sorotan', label: 'Sorotan beranda', icon: Star },
  { to: '/admin/pendaftar', label: 'Pendaftar', icon: EnvelopeSimple, adminOnlyWhenRemote: true },
  { to: '/admin/pengguna', label: 'Pengguna', icon: Users, remoteAdminOnly: true, badge: 'passwordResets' },
  { to: '/admin/pengajuan', label: 'Pengajuan akun', icon: UserPlus, remoteAdminOnly: true, badge: 'accountRequests' },
  { to: '/admin/akun', label: 'Akun saya', icon: UserCircle, remoteOnly: true },
];

export default function AdminLayout() {
  useDocumentTitle('Kelola konten');
  const { pathname } = useLocation();
  const session = useSession();
  const user = session?.user ?? null;
  const [confirmReset, setConfirmReset] = useState(false);

  useNoIndex(); // halaman admin tidak untuk mesin pencari
  const pending = usePending();

  // Segarkan peran/status dari server saat sesi ada (peran bisa berubah, akun bisa dinonaktifkan).
  const token = session?.token;
  useEffect(() => {
    if (!isRemote || !token) return;
    adminApi.me().then(({ user: fresh }) => auth.patchUser(fresh)).catch(() => {});
  }, [token]);

  // Hitungan pengajuan akun dan permintaan reset untuk lencana menu (khusus admin); dimuat ulang tiap pindah halaman.
  const canSeePending = isRemote && Boolean(token) && user?.role === 'admin' && !user?.mustChangePassword;
  useEffect(() => {
    if (canSeePending) refreshPending();
  }, [canSeePending, pathname]);

  // Tanpa sesi, halaman masuk khusus; setelah berhasil, pengguna dikembalikan ke halaman admin yang dituju.
  if (isRemote && !session) return <Navigate to="/masuk" state={{ from: pathname }} replace />;
  if (isRemote && user?.mustChangePassword && pathname !== '/admin/akun') return <Navigate to="/admin/akun" replace />;

  const isAdmin = !isRemote || user?.role === 'admin';
  const visible = items.filter((i) => {
    if (i.remoteOnly && !isRemote) return false;
    if (i.remoteAdminOnly && !(isRemote && isAdmin)) return false;
    if (i.adminOnlyWhenRemote && isRemote && !isAdmin) return false;
    return true;
  });
  const forced = isRemote && user?.mustChangePassword;

  return (
    <section className="shell pb-8 pt-28 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2rem,4.4vw,3.25rem)] font-medium leading-tight">Kelola konten</h1>
        {isRemote && user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-right leading-tight">
              <span className="block font-medium">{user.name}</span>
              <span className="text-muted">{user.email}</span>
            </span>
            <Badge tone={user.role === 'admin' ? 'accent' : 'brand'}>{user.role === 'admin' ? 'Admin' : 'Pengguna'}</Badge>
            <Button size="sm" variant="outline" onClick={() => { resetPending(); auth.clear(); }}><SignOut size={16} aria-hidden="true" /> Keluar</Button>
          </div>
        )}
      </div>

      {!isRemote && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-accent/20 p-5 sm:flex-row sm:items-center sm:justify-between" role="note">
          <p className="flex gap-3 text-sm leading-relaxed">
            <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Mode demo. Perubahan hanya tersimpan di browser ini dan belum ada login, akun, maupun unggah berkas. Isi VITE_API_URL untuk memakai backend.</span>
          </p>
          <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)} className="shrink-0">Setel ulang data</Button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Menu admin" className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:sticky lg:top-28 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0">
          {visible.map((i) => {
            const Icon = i.icon;
            const disabled = forced && i.to !== '/admin/akun';
            return (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.9375rem] font-medium transition',
                    isActive ? 'bg-brand text-on-brand' : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
                    disabled && 'pointer-events-none opacity-40'
                  )
                }
              >
                <Icon size={19} aria-hidden="true" />
                {i.label}
                {i.badge && pending[i.badge] > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold tabular text-deep">
                    {pending[i.badge]}<span className="sr-only"> menunggu</span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="min-w-0 pb-6"><Outlet /></div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Setel ulang semua data?"
        description="Data contoh akan dipulihkan dan perubahan Anda di browser ini hilang."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Batal</Button>
            <Button variant="danger" onClick={() => { Object.values(repos).forEach((r) => r.reset()); setConfirmReset(false); }}>Ya, setel ulang</Button>
          </>
        }
      >
        <p className="text-sm text-muted">Tindakan ini tidak bisa dibatalkan.</p>
      </Modal>
    </section>
  );
}
