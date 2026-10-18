import { useEffect } from 'react';

/**
 * Geser elemen pelan saat halaman di-scroll. Hanya menulis CSS variable --py lewat rAF,
 * tidak memicu render React, dan berhenti saat elemen di luar layar.
 */
export function useParallax(ref, speed = 0.12, disabled = false) {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;
    let raf = 0;
    let visible = true;

    const update = () => {
      raf = 0;
      el.style.setProperty('--py', `${(window.scrollY * speed).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, speed, disabled]);
}
