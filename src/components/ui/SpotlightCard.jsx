import { useSpotlight } from '../../hooks/usePointerVars.js';
import { cn } from '../../lib/cn.js';

/** Kartu dengan sorotan yang mengikuti kursor. Tidak ada state, jadi tidak ada render ulang. */
export default function SpotlightCard({ as: Tag = 'div', className, children, ...rest }) {
  const { ref, onPointerMove } = useSpotlight();
  return (
    <Tag ref={ref} onPointerMove={onPointerMove} className={cn('spot rounded-3xl border border-line bg-surface', className)} {...rest}>
      {children}
    </Tag>
  );
}
