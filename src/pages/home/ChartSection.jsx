import { useMemo, useState } from 'react';
import BarChart from '../../components/charts/BarChart.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { chartSeries, chartViews } from '../../data/stats.js';
import { memoize } from '../../lib/memo.js';
import { cn } from '../../lib/cn.js';

// Hasil agregasi dihitung sekali per tampilan lalu di-cache.
const summarize = memoize(
  (viewKey) => {
    const data = chartViews[viewKey].data;
    const total = (d) => Object.values(d.values).reduce((a, b) => a + b, 0);
    const sum = data.reduce((a, d) => a + total(d), 0);
    const last = total(data[data.length - 1]);
    const prev = data.length > 1 ? total(data[data.length - 2]) : 0;
    const growth = prev ? Math.round(((last - prev) / prev) * 100) : null;
    return { sum, last, growth, lastLabel: data[data.length - 1].label };
  },
  (k) => k
);

export default function ChartSection() {
  const [view, setView] = useState('tahun');
  const s = summarize(view);
  const current = chartViews[view];
  const data = useMemo(() => current.data, [current]);

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="chart-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div>
          <SectionHead
            as="h2"
            title={<span id="chart-title">Publikasi menurut jenis</span>}
            lead="Jurnal, penelitian, dan pengabdian dihitung per periode. Klik legenda untuk menyembunyikan satu jenis. Data contoh."
          />
          <dl className="mt-10 space-y-6">
            <div>
              <dt className="text-sm text-muted">Total pada tampilan ini</dt>
              <dd className="mt-1 font-mono text-5xl font-medium tracking-tighter tabular">{s.sum}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Periode terakhir ({s.lastLabel})</dt>
              <dd className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-3xl font-medium tracking-tighter tabular">{s.last}</span>
                {s.growth !== null && (
                  <span className={cn('text-sm font-medium', s.growth >= 0 ? 'text-brand' : 'text-danger')}>
                    {s.growth >= 0 ? '+' : ''}{s.growth}% dari periode sebelumnya
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <div className="mb-8 inline-flex rounded-full bg-mist p-1" role="tablist" aria-label="Rentang waktu">
            {Object.entries(chartViews).map(([key, v]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={cn('rounded-full px-4 py-2 text-sm font-medium transition', view === key ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}
              >
                {v.label}
              </button>
            ))}
          </div>
          <BarChart key={view} data={data} series={chartSeries} label={`Publikasi menurut jenis, ${current.label}`} />
        </div>
      </div>
    </section>
  );
}
