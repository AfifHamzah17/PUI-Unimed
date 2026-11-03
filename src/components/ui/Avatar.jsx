import { useState } from 'react';
import { cn } from '../../lib/cn.js';

const sizes = {
  sm: 'h-[3.75rem] w-12 rounded-xl text-sm',
  md: 'h-[6.25rem] w-20 rounded-2xl text-lg',
  lg: 'h-[11.25rem] w-36 rounded-3xl text-2xl',
  xl: 'aspect-[4/5] w-full rounded-3xl text-4xl',
};
const widths = { sm: 48, md: 80, lg: 144, xl: 320 };

/** Foto anggota. Memakai srcset WebP 160/240 px dan jatuh ke inisial bila foto gagal dimuat. */
export default function Avatar({ member, size = 'md', className, priority = false }) {
  const [failed, setFailed] = useState(false);
  const box = cn('shrink-0 overflow-hidden bg-brand-soft', sizes[size], className);

  if (member.photo && !failed) {
    return (
      <img
        className={cn(box, 'object-cover object-top')}
        src={`/foto/${member.photo}-160.webp`}
        srcSet={`/foto/${member.photo}-160.webp 160w, /foto/${member.photo}-240.webp 240w`}
        sizes={`${widths[size]}px`}
        width="160"
        height="200"
        alt={member.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={cn(box, 'grid place-items-center font-display font-semibold text-brand')} role="img" aria-label={member.name}>
      {member.initials}
    </span>
  );
}
