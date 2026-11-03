import { Suspense, useRef } from 'react';
import { useInView } from '../../hooks/useInView.js';

/**
 * Menunda render (dan unduhan kode/data) bagian di bawah layar sampai pengguna mendekatinya.
 * `fallback` mengisi ruang sementara agar tata letak tidak melompat.
 */
export default function LazySection({ children, fallback, rootMargin = '600px 0px' }) {
  const ref = useRef(null);
  const near = useInView(ref, { rootMargin, threshold: 0 });
  return (
    <div ref={ref}>
      {near ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
