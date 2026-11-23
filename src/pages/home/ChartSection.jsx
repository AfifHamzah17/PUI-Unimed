import { useMemo } from 'react';
import BarChart from '../../components/charts/BarChart.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useSiteData } from '../../hooks/useSiteData.js';
import { cn } from '../../lib/cn.js';

const SERIES = [
  { key: 'jurnal', label: 'Jurnal', tone: 'brand' },
  { key: 'penelitian', label: 'Penelitian', tone: 'soft' },
  { key: 'pengabdian', label: 'Pengabdian', tone: 'accent' },
];

/** Publikasi per tahun dan jenis, dari tahun paling awal sampai paling akhir (tahun tanpa publikasi tampil 0). */
function byYear(pubs) {
  if (!pubs.length) return [];
  const years = pubs.map((p) => p.year);
  const out = [];
  for (let y = Math.min(...years); y <= Math.max(...years); y += 1) {
    const values = { jurnal: 0, penelitian: 0, pengabdian: 0 };
    pubs.filter((p) => p.year === y).forEach((p) => { values[p.type] += 1; });
    out.push({ label: String(y), values });
  }
  return out;
}

const total = (d) => Object.values(d.values).reduce((a, b) => a + b, 0);

export default function ChartSection() {
  const site = useSiteData();
  const data = useMemo(() => (site ? byYear(site.publikasi) : null), [site]);
  if (site === null) return null; // API gagal: sembunyikan

  const loaded = Boolean(site);
  const empty = loaded && data.length === 0;
  const sum = loaded ? data.reduce((a, d) => a + total(d), 0) : 0;
  const last = loaded && data.length ? data[data.length - 1] : null;
  const prev = loaded && data.length > 1 ? total(data[data.length - 2]) : 0;
  const growth = last && prev ? Math.round(((total(last) - prev) / prev) * 100) : null;

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="chart-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div>
          <SectionHead
            as="h2"
            title={<span id="chart-title">Publikasi menurut jenis</span>}
            lead="Jurnal, penelitian, dan pengabdian dihitung per tahun. Klik legenda untuk menyembunyikan satu jenis."
          />
          <dl className="mt-10 space-y-6">
            <div>
              <dt className="text-sm text-muted">Total pada tampilan ini</dt>
              <dd className="mt-1 font-mono text-5xl font-medium tracking-tighter tabular">{loaded ? sum : <Skeleton className="h-12 w-20" />}</dd>
            </div>
            {last && (
              <div>
                <dt className="text-sm text-muted">Periode terakhir ({last.label})</dt>
                <dd className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-medium tracking-tighter tabular">{total(last)}</span>
                  {growth !== null && (
                    <span className={cn('text-sm font-medium', growth >= 0 ? 'text-brand' : 'text-danger')}>
                      {growth >= 0 ? '+' : ''}{growth}% dari periode sebelumnya
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 sm:p-8">
          {!loaded && <Skeleton className="h-[340px] w-full" />}
          {empty && <p className="grid min-h-[16rem] place-items-center text-center text-muted">Belum ada publikasi tercatat. Tambahkan lewat halaman kelola agar grafik terisi.</p>}
          {loaded && !empty && <BarChart data={data} series={SERIES} label="Publikasi menurut jenis dan tahun" />}
        </div>
      </div>
    </section>
  );
}
