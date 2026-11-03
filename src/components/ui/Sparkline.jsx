import { useRef } from 'react';
import { useInView } from '../../hooks/useInView.js';
import { cn } from '../../lib/cn.js';

const W = 160;
const H = 44;

/** Garis tren mini. Digambar ulang (stroke-dashoffset) saat terlihat. */
export default function Sparkline({ values, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.4 });
  if (!values?.length) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - pad - ((v - min) / span) * (H - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={cn('h-auto w-full overflow-visible', className)} aria-hidden="true" focusable="false">
      <path d={area} fill="rgb(var(--brand) / 0.10)" opacity={inView ? 1 : 0} style={{ transition: 'opacity 1.2s ease 0.6s' }} />
      <path
        d={line}
        pathLength="1"
        fill="none"
        stroke="rgb(var(--brand))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('stroke-draw', inView && 'is-on')}
        style={{ '--len': 1 }}
      />
      <circle cx={lx} cy={ly} r="3.5" fill="rgb(var(--accent))" opacity={inView ? 1 : 0} style={{ transition: 'opacity .4s ease 1.4s' }} />
    </svg>
  );
}
