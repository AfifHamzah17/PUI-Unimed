import { cn } from '../../lib/cn.js';
import Weave from './Weave.jsx';

/** Pita kata bergerak. Salinan kedua disembunyikan dari pembaca layar. Berhenti saat di-hover. */
export default function Marquee({ items, className }) {
  const row = (hidden) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <li key={`${it}-${i}`} className="flex items-center">
          <span
            className={cn(
              'px-8 font-display text-[clamp(2.25rem,5vw,4.25rem)] leading-none tracking-tight',
              i % 2 ? 'outline-text' : 'text-ink'
            )}
          >
            {it}
          </span>
          <Weave.Diamond className="h-3 w-3 text-accent" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn('marquee-mask overflow-hidden', className)}>
      <div className="marquee-track flex w-max animate-marquee will-change-transform">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
