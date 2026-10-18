import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass, Trash } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import ListFooter from '../../components/admin/ListFooter.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { isRemote, pendaftaranApi } from '../../services/api.js';
import { useSession } from '../../services/auth.js';
import { formatDate } from '../../lib/format.js';

/** Daftar pendaftar anggota (data pribadi: khusus admin saat backend aktif). */
export default function AdminPendaftar() {
  const me = useSession()?.user;
  const allowed = !isRemote || me?.role === 'admin';
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => setPage(1), [dq, pageSize]);
  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    pendaftaranApi.list({ q: dq, page, pageSize })
      .then((d) => alive && (setData({ ...d, page, pageSize, totalPages: Math.max(1, Math.ceil(d.total / pageSize)) }), setError('')))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [allowed, dq, page, pageSize, tick]);

  if (!allowed) return <EmptyState title="Hanya untuk admin">Data pendaftar memuat informasi pribadi sehingga hanya admin yang dapat melihatnya.</EmptyState>;

  const confirmRemove = async () => {
    const r = removing;
    setRemoving(null);
    try {
      await pendaftaranApi.remove(r.id);
      setNotice({ type: 'ok', text: 'Pendaftar dihapus.' });
      setTick((n) => n + 1);
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-medium">Pendaftar anggota</h2>
      <p className="mt-1 text-sm text-muted">Pengajuan dari formulir Pendaftaran di situs publik.</p>
      <div className="relative mt-6 sm:max-w-sm">
        <label htmlFor="cari-pendaftar" className="sr-only">Cari pendaftar</label>
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input id="cari-pendaftar" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, institusi" className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[0.9375rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
      </div>
      <div className="mt-6">
        {error ? <EmptyState title="Data belum bisa dimuat">{error}</EmptyState>
          : !data ? <ul className="divide-y divide-line border-y border-line" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="py-5"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-3 h-3 w-1/2" /></li>)}</ul>
          : data.items.length === 0 ? <EmptyState title="Belum ada pendaftar">{dq ? 'Tidak ada yang cocok dengan pencarian ini.' : 'Pengajuan baru akan muncul di sini.'}</EmptyState>
          : (
            <ul className="divide-y divide-line border-y border-line">
              {data.items.map((r) => (
                <li key={r.id} className="py-4">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block font-medium">{r.nama}</span>
                        <span className="block text-sm text-muted">{r.email}, {r.institusi}, {r.peran}{r.createdAt ? `, ${formatDate(r.createdAt.slice(0, 10))}` : ''}</span>
                      </span>
                      <span className="shrink-0 text-sm text-brand group-open:hidden">Lihat</span>
                    </summary>
                    <p className="mt-3 max-w-2xl rounded-2xl bg-mist/60 p-4 text-[0.9375rem] leading-relaxed">{r.minat}</p>
                    <Button size="sm" variant="ghost" className="mt-3 text-danger" onClick={() => setRemoving(r)}><Trash size={16} aria-hidden="true" /> Hapus</Button>
                  </details>
                </li>
              ))}
            </ul>
          )}
        <ListFooter data={data} onPage={setPage} onPageSize={setPageSize} />
      </div>
      <Modal open={Boolean(removing)} onClose={() => setRemoving(null)} title="Hapus pendaftar ini?" description={removing ? `${removing.nama} (${removing.email})` : ''} size="sm"
        footer={<><Button variant="ghost" onClick={() => setRemoving(null)}>Batal</Button><Button variant="danger" onClick={confirmRemove}>Ya, hapus</Button></>}>
        <p className="text-sm text-muted">Data yang dihapus tidak bisa dikembalikan.</p>
      </Modal>
      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}
