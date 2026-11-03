import { useEffect, useState } from 'react';

/** True setelah elemen masuk layar. Dengan once=true, observer dilepas setelah terpicu. */
export function useInView(ref, { once = true, rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
