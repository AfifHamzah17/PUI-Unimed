import { useEffect } from 'react';

/** Halaman akun dan admin tidak untuk mesin pencari. */
export function useNoIndex() {
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex';
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
}
