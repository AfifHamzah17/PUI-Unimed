import { cn } from '../../lib/cn.js';

const tones = {
  brand: 'bg-brand/10 text-brand',
  accent: 'bg-accent/20 text-ink',
  muted: 'bg-ink/[0.06] text-muted',
  danger: 'bg-danger/10 text-danger',
  light: 'bg-white/10 text-white/80',
};

export default function Badge({ tone = 'muted', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

/** Penanda untuk entri contoh agar tidak dikira data asli. */
export function DemoBadge() {
  return <Badge tone="accent" title="Entri ini hanya contoh">Data contoh</Badge>;
}
