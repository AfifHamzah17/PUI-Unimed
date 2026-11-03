import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

// Jendela halaman: 1 ... 4 5 6 ... 12
function windowed(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;
  const btn = 'grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium transition';
  return (
    <nav aria-label="Halaman" className={cn('flex items-center justify-center gap-1', className)}>
      <button type="button" className={cn(btn, 'text-ink hover:bg-ink/5 disabled:opacity-40')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Halaman sebelumnya">
        <CaretLeft size={16} aria-hidden="true" />
      </button>
      {windowed(page, totalPages).map((n, i) =>
        n === 'gap' ? (
          <span key={`g${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cn(btn, 'tabular', n === page ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5')}
          >
            {n}
          </button>
        )
      )}
      <button type="button" className={cn(btn, 'text-ink hover:bg-ink/5 disabled:opacity-40')} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Halaman berikutnya">
        <CaretRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
