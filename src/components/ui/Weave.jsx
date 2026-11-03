import { useId } from 'react';
import { cn } from '../../lib/cn.js';

/** Pita tenun geometris (motif belah ketupat) sebagai penanda khas, ringan karena murni SVG. */
export default function Weave({ className, height = 10, tone = 'accent' }) {
  const id = useId().replace(/:/g, '');
  const fill = tone === 'accent' ? 'rgb(var(--accent))' : 'rgb(var(--brand))';
  return (
    <svg className={cn('block w-full', className)} height={height} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width={height * 2} height={height} patternUnits="userSpaceOnUse">
          <path d={`M${height} 0 L${height * 2} ${height / 2} L${height} ${height} L0 ${height / 2}Z`} fill={fill} />
          <path d={`M${height} ${height * 0.28} L${height * 1.45} ${height / 2} L${height} ${height * 0.72} L${height * 0.55} ${height / 2}Z`} fill="rgb(var(--deep))" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

Weave.Diamond = function Diamond({ className }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" focusable="false">
      <path d="M6 0 L12 6 L6 12 L0 6Z" fill="currentColor" />
    </svg>
  );
};
