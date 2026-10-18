import { useRef } from 'react';
import { useInView } from '../../hooks/useInView.js';
import { formatNumber } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Angka bergulir ala odometer. Tiap digit adalah kolom 0-9 yang digeser dengan transform,
 * dipicu saat elemen terlihat. Digit paling kanan bergulir lebih dulu.
 */
export default function Odometer({ value, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.4 });
  const text = formatNumber(value);
  const chars = [...text];
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  let seen = 0;

  return (
    <span ref={ref} className={cn('odo', className)} role="img" aria-label={text}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return <span key={i} className="odo__sep" aria-hidden="true">{ch}</span>;
        }
        const fromRight = digitCount - 1 - seen;
        seen += 1;
        return (
          <span key={i} className="odo__col" aria-hidden="true">
            <span className="odo__strip" style={{ '--d': inView ? Number(ch) : 0, transitionDelay: `${fromRight * 110}ms` }}>
              {DIGITS.map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
