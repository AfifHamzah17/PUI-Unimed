import Pagination from '../ui/Pagination.jsx';

/** Ringkasan rentang, paginasi, dan pilihan jumlah per halaman untuk daftar admin. */
export default function ListFooter({ data, onPage, onPageSize, sizes = [10, 20, 50] }) {
  if (!data || data.total === 0) return null;
  const from = (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.total, data.page * data.pageSize);
  return (
    <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted tabular" aria-live="polite">Menampilkan {from}-{to} dari {data.total}</p>
      <Pagination page={data.page} totalPages={data.totalPages} onChange={onPage} />
      {onPageSize && (
        <label className="flex items-center gap-2 text-sm text-muted">
          Per halaman
          <select value={data.pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-9 rounded-full border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none">
            {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
