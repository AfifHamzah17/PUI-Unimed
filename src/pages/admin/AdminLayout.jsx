import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpenText, CalendarBlank, EnvelopeSimple, Handshake, SignOut, SquaresFour, Star, UserCircle, UserPlus, Users } from '@phosphor-icons/react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';
import { refreshPending, resetPending, usePending } from '../../hooks/usePending.js';
import { adminApi } from '../../services/api.js';
import { auth, useSession } from '../../services/auth.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

const items = [
  { to: '/admin', label: 'Ringkasan', icon: SquaresFour, end: true },
  { to: '/admin/kegiatan', label: 'Kegiatan', icon: CalendarBlank },
  { to: '/admin/publikasi', label: 'Publikasi', icon: BookOpenText },
  { to: '/admin/kerjasama', label: 'Kerjasama', icon: Handshake },
  { to: '/admin/sorotan', label: 'Sorotan beranda', icon: Star },
  { to: '/admin/pendaftar', label: 'Pendaftar', icon: EnvelopeSimple, adminOnly: true },
  { to: '/admin/pengguna', label: 'Pengguna', icon: Users, adminOnly: true, badge: 'passwordResets' },
  { to: '/admin/pengajuan', label: 'Pengajuan akun', icon: UserPlus, adminOnly: true, badge: 'accountRequests' },
  { to: '/admin/akun', label: 'Akun saya', icon: UserCircle },
];

export default function AdminLayout() {
  useDocumentTitle('Kelola konten');
  const { pathname } = useLocation();
  const session = useSession();
  const user = session?.user ?? null;

  useNoIndex(); // halaman admin tidak untuk mesin pencari
  const pending = usePending();

  // Segarkan peran/status dari server saat sesi ada (peran bisa berubah, akun bisa dinonaktifkan).
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    adminApi.me().then(({ user: fresh }) => auth.patchUser(fresh)).catch(() => {});
  }, [token]);

  // Hitungan pengajuan akun dan permintaan reset untuk lencana menu (khusus admin); dimuat ulang tiap pindah halaman.
  const canSeePending = Boolean(token) && user?.role === 'admin' && !user?.mustChangePassword;
  useEffect(() => {
    if (canSeePending) refreshPending();
  }, [canSeePending, pathname]);

  // Tanpa sesi, halaman masuk khusus; setelah berhasil, pengguna dikembalikan ke halaman admin yang dituju.
  if (!session) return <Navigate to="/masuk" state={{ from: pathname }} replace />;
  if (user?.mustChangePassword && pathname !== '/admin/akun') return <Navigate to="/admin/akun" replace />;

  const isAdmin = user?.role === 'admin';
  const visible = items.filter((i) => !i.adminOnly || isAdmin);
  const forced = Boolean(user?.mustChangePassword);

  return (
    <section className="shell pb-8 pt-28 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2rem,4.4vw,3.25rem)] font-medium leading-tight">Kelola konten</h1>
        {user && (
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
    </section>
  );
}
