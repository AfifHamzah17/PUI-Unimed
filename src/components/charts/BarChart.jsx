import { memo, useMemo, useRef, useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { useInView } from '../../hooks/useInView.js';
import { cn } from '../../lib/cn.js';

const TONES = {
  brand: 'rgb(var(--brand))',
  soft: 'rgb(var(--brand) / 0.38)',
  accent: 'rgb(var(--accent))',
};
const M = { t: 14, r: 8, b: 30, l: 34 };
const TICKS = 4;

// Batas atas sumbu Y yang "bulat" agar garis kisi jatuh di angka rapi.
function niceMax(max) {
  const raw = Math.max(max, 1) / TICKS;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) * mag;
  return step * TICKS;
}

/**
 * Grafik batang bertumpuk berbasis SVG. Tanpa pustaka grafik, jadi tidak menambah bundel.
 * Lebar diukur dengan ResizeObserver supaya teks sumbu selalu berukuran tetap di layar kecil.
 */
function BarChart({ data, series, height = 300, label }) {
  const wrap = useRef(null);
  const width = useElementWidth(wrap);
  const inView = useInView(wrap, { threshold: 0.3 });
  const [hidden, setHidden] = useState(() => new Set());
  const [hover, setHover] = useState(null);

  const active = useMemo(() => series.filter((s) => !hidden.has(s.key)), [series, hidden]);
  const totals = useMemo(() => data.map((d) => active.reduce((a, s) => a + (d.values[s.key] || 0), 0)), [data, active]);
  const maxY = useMemo(() => niceMax(Math.max(...totals, 1)), [totals]);

  const innerW = Math.max(0, width - M.l - M.r);
  const innerH = height - M.t - M.b;
  const band = data.length ? innerW / data.length : 0;
  const barW = Math.min(64, band * 0.58);
  const y = (v) => innerH - (v / maxY) * innerH;

  const toggle = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < series.length - 1) next.add(key); // minimal satu seri tetap tampil
      return next;
    });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Pilih seri data">
        {series.map((s) => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition',
                off ? 'border-line text-muted' : 'border-ink/25 text-ink'
              )}
            >
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: TONES[s.tone], opacity: off ? 0.3 : 1 }} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div ref={wrap} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={label} className="overflow-visible">
            <g transform={`translate(${M.l},${M.t})`}>
              {Array.from({ length: TICKS + 1 }, (_, i) => {
                const v = (maxY / TICKS) * i;
                return (
                  <g key={i}>
                    <line x1="0" x2={innerW} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" strokeDasharray={i ? '3 5' : undefined} />
                    <text x="-10" y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted font-mono" fontSize="11">{v}</text>
                  </g>
                );
              })}

              {data.map((d, i) => {
                const cx = band * i + band / 2;
                let acc = 0;
                return (
                  <g key={d.label} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: 'opacity .2s' }}>
                    {active.map((s) => {
                      const v = d.values[s.key] || 0;
                      const h = Math.max(0, (v / maxY) * innerH - (v ? 2 : 0));
                      const top = y(acc + v);
                      acc += v;
                      if (!v) return null;
                      return (
                        <rect
                          key={s.key}
                          x={cx - barW / 2}
                          y={top + 2}
                          width={barW}
                          height={h}
                          rx="4"
                          fill={TONES[s.tone]}
                          style={{
                            transformBox: 'fill-box',
                            transformOrigin: 'bottom',
                            transform: inView ? 'scaleY(1)' : 'scaleY(0)',
                            transition: `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                          }}
                        />
                      );
                    })}
                    <text x={cx} y={innerH + 20} textAnchor="middle" className="fill-muted font-mono" fontSize="11">{d.label}</text>
                    <rect
                      x={cx - band / 2}
                      y="0"
                      width={band}
                      height={innerH}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${d.label}: ${active.map((s) => `${s.label} ${d.values[s.key] || 0}`).join(', ')}`}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="outline-none"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 min-w-36 rounded-xl bg-deep px-3.5 py-2.5 text-xs text-white shadow-lift"
            style={{
              left: Math.min(Math.max(M.l + band * hover + band / 2, 80), width - 80),
              top: Math.max(M.t + y(totals[hover]) - 10, 0),
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="mb-1.5 font-mono text-white/60">{data[hover].label}</p>
            {active.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px]" style={{ background: TONES[s.tone] }} />{s.label}</span>
                <span className="font-mono tabular">{data[hover].values[s.key] || 0}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Tabel untuk pembaca layar */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr><th scope="col">Periode</th>{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><th scope="row">{d.label}</th>{series.map((s) => <td key={s.key}>{d.values[s.key] || 0}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(BarChart);
