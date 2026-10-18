import { useCallback, useRef } from 'react';

/**
 * Pelacak kursor untuk efek sorotan kartu. Menulis --mx/--my langsung ke elemen
 * sehingga tidak ada render ulang React sama sekali.
 */
export function useSpotlight() {
  const ref = useRef(null);
  const onPointerMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
  return { ref, onPointerMove };
}
