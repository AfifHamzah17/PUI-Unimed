import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

/**
 * Carousel berbasis scroll-snap native: mulus di sentuh, bisa di-drag dengan mouse,
 * tanpa pustaka. Posisi dilaporkan lewat rAF dan hanya memicu render saat nilai berubah berarti.
 */
export default function Carousel({ label, children, className }) {
  const track = useRef(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const raf = useRef(0);
  const [pos, setPos] = useState({ start: true, end: false, fill: 0 });

  const measure = useCallback(() => {
    raf.current = 0;
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = {
      start: el.scrollLeft <= 2,
      end: max <= 2 || el.scrollLeft >= max - 2,
      fill: Math.round(((el.scrollLeft + el.clientWidth) / Math.max(el.scrollWidth, 1)) * 100),
    };
    setPos((p) => (p.start === next.start && p.end === next.end && p.fill === next.fill ? p : next));
  }, []);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    measure();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [measure, schedule]);

  const go = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { active: true, moved: false, x: e.clientX, left: track.current.scrollLeft };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      track.current.classList.add('snap-none', 'cursor-grabbing');
    }
    if (d.moved) track.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    track.current?.classList.remove('snap-none', 'cursor-grabbing');
  };
  // Seret yang berakhir di atas tautan jangan dianggap klik.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const arrow = 'grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30';

  return (
    <section className={className} aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        onScroll={schedule}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8 lg:cursor-grab"
        tabIndex={0}
      >
        {children}
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div className="h-px flex-1 bg-line" role="presentation">
          <div className="h-px bg-ink transition-[width] duration-300" style={{ width: `${pos.fill}%` }} />
        </div>
        <div className="flex gap-2">
          <button type="button" className={arrow} onClick={() => go(-1)} disabled={pos.start} aria-label="Geser ke kiri">
            <CaretLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className={arrow} onClick={() => go(1)} disabled={pos.end} aria-label="Geser ke kanan">
            <CaretRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export const slideClass = cn('snap-start shrink-0 basis-[82%] sm:basis-[26rem]');
