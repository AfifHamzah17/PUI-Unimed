import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Info, MagnifyingGlass, UserPlus, XCircle } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import ListFooter from '../../components/admin/ListFooter.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { refreshPending } from '../../hooks/usePending.js';
import { adminApi, isRemote } from '../../services/api.js';
import { useSession } from '../../services/auth.js';
import { formatDate } from '../../lib/format.js';

/** Pengajuan akun dari halaman publik. Menyetujui = membuat akun Pengguna yang langsung aktif. */
export default function AdminPengajuan() {
  const me = useSession()?.user;
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => setPage(1), [dq, pageSize]);
  const allowed = isRemote && me?.role === 'admin';
  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    adminApi.accountRequests.list({ q: dq, page, pageSize })
      .then((d) => alive && (setData({ ...d, page, pageSize, totalPages: Math.max(1, Math.ceil(d.total / pageSize)) }), setError('')))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [allowed, dq, page, pageSize, tick]);

  if (!isRemote) return <p className="text-muted">Pengajuan akun tersedia setelah backend tersambung.</p>;
  if (!allowed) return <EmptyState title="Hanya untuk admin">Akun Anda tidak memiliki akses ke pengajuan akun.</EmptyState>;

  const run = async (r, fn, okText) => {
    setBusyId(r.id);
    try {
      await fn();
      setNotice({ type: 'ok', text: okText });
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setBusyId('');
      setTick((n) => n + 1);
      refreshPending();
    }
  };

  return (
    <div>
      <div>
        <h2 className="text-2xl font-medium">Pengajuan akun</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">Orang yang mengajukan akun dari halaman Ajukan akun. Akun baru berperan Pengguna dan langsung aktif setelah Anda setujui.</p>
      </div>
      <p className="mt-5 flex max-w-2xl gap-3 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed" role="note">
        <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Email pemohon belum diverifikasi. Setujui hanya orang yang Anda kenali atau sudah Anda pastikan lewat jalur lain. Belum ada email pemberitahuan, jadi kabari pemohon setelah disetujui.</span>
      </p>

      <div className="relative mt-6 sm:max-w-sm">
        <label htmlFor="cari-pengajuan" className="sr-only">Cari pengajuan</label>
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input id="cari-pengajuan" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[0.9375rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
      </div>

      <div className="mt-6">
        {error ? <EmptyState title="Data belum bisa dimuat">{error}</EmptyState>
          : !data ? <ul className="divide-y divide-line border-y border-line" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="py-5"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-3 h-3 w-1/4" /></li>)}</ul>
          : data.items.length === 0 ? <EmptyState icon={UserPlus} title={dq ? 'Tidak ada yang cocok' : 'Tidak ada pengajuan'}>{dq ? 'Coba kata kunci lain.' : 'Pengajuan baru akan muncul di sini.'}</EmptyState>
          : (
            <ul className="divide-y divide-line border-y border-line">
              {data.items.map((r) => {
                const busy = busyId === r.id;
                return (
                  <li key={r.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between" style={{ opacity: busy ? 0.55 : 1 }}>
                    <div className="min-w-0">
                      <p className="font-medium">{r.name}</p>
                      <p className="mt-1 text-sm text-muted">{r.email}, diajukan {formatDate(r.createdAt.slice(0, 10))}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => run(r, () => adminApi.accountRequests.approve(r.id), `Akun ${r.name} disetujui dan sudah aktif.`)}><CheckCircle size={16} aria-hidden="true" /> Setujui</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(r)}><XCircle size={16} aria-hidden="true" /> Tolak</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        <ListFooter data={data} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Tolak pengajuan ini?"
        description={rejecting ? `${rejecting.name} (${rejecting.email})` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Batal</Button>
            <Button variant="danger" onClick={() => { const r = rejecting; setRejecting(null); run(r, () => adminApi.accountRequests.reject(r.id), 'Pengajuan ditolak.'); }}>Ya, tolak</Button>
          </>
        }
      >
        <p className="text-sm text-muted">Pengajuan dihapus. Pemohon bisa mengajukan lagi kapan saja.</p>
      </Modal>
      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}
