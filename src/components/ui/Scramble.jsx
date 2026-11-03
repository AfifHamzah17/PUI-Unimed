import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/+=<>*';

/**
 * Teks yang "terurai" dari huruf acak menjadi kalimat asli. Pakai font mono agar lebar tidak bergeser.
 * Teks asli selalu ada di aria-label dan di DOM awal, jadi pembaca layar dan crawler tetap aman.
 */
export default function Scramble({ text, className, duration = 900, delay = 0, onHover = false, as: Tag = 'span' }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const reduce = useReducedMotion();

  const run = useCallback(() => {
    const el = ref.current;
    if (!el || reduce) return;
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const chars = [...text];
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = chars
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          // Huruf ke-i terkunci pada waktu berbeda, dari kiri ke kanan.
          return t >= 0.15 + (i / chars.length) * 0.85 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        })
        .join('');
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    raf.current = requestAnimationFrame(tick);
  }, [text, duration, reduce]);

  // Acak sebelum cat pertama supaya teks asli tidak sempat berkedip.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !reduce) el.textContent = [...text].map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
  }, [text, reduce]);

  useEffect(() => {
    if (reduce) return undefined;
    const t = setTimeout(run, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf.current);
    };
  }, [run, delay, reduce]);

  return (
    <Tag ref={ref} className={className} aria-label={text} onMouseEnter={onHover ? run : undefined}>
      {text}
    </Tag>
  );
}
