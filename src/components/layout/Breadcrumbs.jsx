import { Link } from 'react-router-dom';
import { CaretRight, House } from '@phosphor-icons/react';

/** items: [{ label, to? }]. Item terakhir adalah halaman sekarang. */
export default function Breadcrumbs({ items }) {
  const all = [{ label: 'Beranda', to: '/', home: true }, ...items];
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {all.map((it, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="font-medium text-ink">{it.label}</span>
              ) : !it.to ? (
                <span>{it.label}</span>
              ) : (
                <Link to={it.to} className="inline-flex items-center gap-1.5 rounded-md transition hover:text-ink">
                  {it.home && <House size={15} aria-hidden="true" />}
                  <span className={it.home ? 'sr-only sm:not-sr-only' : undefined}>{it.label}</span>
                </Link>
              )}
              {!last && <CaretRight size={12} aria-hidden="true" className="text-muted/60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
