import { Link } from 'react-router-dom';
import { ArrowUpRight, Bell, Star } from '@phosphor-icons/react';
import { useRepoList } from '../../hooks/useRepo.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { usePending } from '../../hooks/usePending.js';
import { isRemote } from '../../services/api.js';
import { useSession } from '../../services/auth.js';
import { schemas } from './schemas.js';

const P = { page: 1, pageSize: 1 };
const F = { page: 1, pageSize: 1, featured: 'true' };

function Count({ resource }) {
  const schema = schemas[resource];
  const total = useRepoList(schema.repo, P).data;
  const picked = useRepoList(schema.repo, F).data;
  return (
    <Link to={`/admin/${resource}`} className="group flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <p className="text-muted">{schema.label}</p>
        <ArrowUpRight size={20} aria-hidden="true" className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <div className="mt-10 font-mono text-6xl font-medium tracking-tighter tabular">{total ? total.total : <Skeleton className="h-14 w-20" />}</div>
      <p className="mt-4 flex items-center gap-1.5 text-sm text-muted"><Star size={14} weight="fill" className="text-accent" aria-hidden="true" />{picked ? `${picked.total} disorot di beranda` : '\u00A0'}</p>
    </Link>
  );
}

/** Pengajuan akun dan permintaan reset sandi yang menunggu admin. Tidak tampil bila tidak ada. */
function PendingNotice() {
  const me = useSession()?.user;
  const { accountRequests: a, passwordResets: r } = usePending();
  if (!isRemote || me?.role !== 'admin' || a + r === 0) return null;
  return (
    <div role="status" className="mt-6 flex flex-col gap-4 rounded-2xl bg-accent/20 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex gap-3 text-sm leading-relaxed"><Bell size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Ada yang menunggu tindakan Anda.</p>
      <div className="flex flex-wrap gap-2">
        {a > 0 && <Button size="sm" variant="outline" to="/admin/pengajuan">{a} pengajuan akun</Button>}
        {r > 0 && <Button size="sm" variant="outline" to="/admin/pengguna">{r} permintaan reset sandi</Button>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-medium">Ringkasan</h2>
      <p className="mt-1 max-w-xl text-muted">Tambah, ubah, atau hapus isi yang tampil di situs publik. Tanda bintang menentukan kartu sorotan di beranda.</p>
      <PendingNotice />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {Object.keys(schemas).map((r) => <Count key={r} resource={r} />)}
      </div>
    </div>
  );
}
