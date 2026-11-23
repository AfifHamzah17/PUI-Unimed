import { responsive } from '../../lib/img.js';

/** <img> dengan srcset otomatis, lazy-load, dan decoding async. Beri `priority` hanya untuk gambar di layar pertama. */
export default function Img({ src, alt = '', sizes = '100vw', priority = false, className, ...rest }) {
  const attrs = responsive(src);
  return (
    <img
      {...attrs}
      sizes={attrs.srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      {...rest}
    />
  );
}
