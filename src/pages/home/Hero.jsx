import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import Img from '../../components/ui/Img.jsx';
import { useParallax } from '../../hooks/useParallax.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useRepoList } from '../../hooks/useRepo.js';
import { sliderRepo } from '../../services/api.js';
import { cn } from '../../lib/cn.js';

const AUTOPLAY_MS = 5000; // jeda tiap slide sebelum bergeser
const MIN_SLIDES = 3;
const PARAMS = { page: 1, pageSize: 20, sort: 'order_asc' };

// Pengisi bila admin belum menambah cukup slide berfoto (kurang dari 3). Isinya tautan ke bagian situs, bukan data karangan.
const FILLERS = [
  { key: 'fill-riset', title: 'Riset literasi dan seni untuk pendidikan', sub: 'Penelitian kolaboratif dan publikasi ilmiah tim PUI', to: '/publikasi/jurnal', cta: 'Lihat publikasi' },
  { key: 'fill-kegiatan', title: 'Pelatihan, workshop, dan seminar', sub: 'Memperkuat kapasitas pendidik dan mahasiswa', to: '/kegiatan', cta: 'Lihat kegiatan' },
  { key: 'fill-mitra', title: 'Bekerja bersama mitra', sub: 'Jejaring perguruan tinggi dan lembaga di dalam dan luar negeri', to: '/kerjasama/dalam-negeri', cta: 'Lihat mitra' },
];

const toSlide = (it) => ({ key: it.id, title: it.title, sub: it.subtitle, image: it.image, to: it.linkUrl, cta: it.ctaLabel || (it.linkUrl ? 'Selengkapnya' : '') });

/** Tombol slide: tautan dalam situs memakai router, alamat https membuka tab baru. */
function SlideAction({ to, children, tabIndex }) {
  if (!to) return null;
  const cls = 'inline-flex h-11 items-center rounded-lg bg-accent px-6 text-[0.9375rem] font-medium text-deep transition active:scale-[0.97] hover:brightness-105';
  return /^https:\/\//.test(to) ? (
    <a href={to} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className={cls}>{children}</a>
  ) : (
    <Link to={to} tabIndex={tabIndex} className={cls}>{children}</Link>
  );
}

export default function Hero() {
  const { data, loading, error } = useRepoList(sliderRepo, PARAMS);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const reduce = useReducedMotion();
  const layer = useRef(null);
  const swipe = useRef(null);
  useParallax(layer, 0.12, reduce);

  // Slide dari admin (yang aktif, urut menurut `order`), lalu diisi pengisi sampai minimal tiga. Selama memuat
  // belum ada slide, supaya tidak berganti isi mendadak begitu data tiba.
  const fromAdmin = (data?.items ?? []).filter((x) => x.active).map(toSlide);
  const ready = Boolean(data) || Boolean(error);
  const slides = !ready ? [] : [...fromAdmin, ...FILLERS.slice(0, Math.max(0, MIN_SLIDES - fromAdmin.filter((x) => x.image).length))];
  const n = slides.length;
  const cur = n ? Math.min(index, n - 1) : 0; // daftar slide bisa menyusut setelah admin mengubahnya
  const go = useCallback((i) => setIndex(n ? ((i % n) + n) % n : 0), [n]);

  // Putar otomatis: berhenti saat kursor di atas, tombol jeda ditekan, tab tersembunyi, atau gerak dikurangi.
  const auto = playing && !hovering && !reduce && n > 1;
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % n);
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [auto, cur, n]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
  };
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    swipe.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) > 48) go(cur + (dx < 0 ? 1 : -1));
  };

  const arrow = 'absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:h-12 sm:w-12';

  return (
    <section
      className="on-deep relative isolate h-[min(80dvh,46rem)] min-h-[32rem] touch-pan-y overflow-hidden bg-deep text-white"
      aria-roledescription="carousel"
      aria-label="Sorotan PUI"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Lapisan foto bergeser pelan saat halaman di-scroll (parallax lewat CSS variable, tanpa render ulang). */}
      <div ref={layer} className="absolute inset-x-0 -top-10 bottom-0 -z-10" style={{ transform: 'translate3d(0, var(--py, 0px), 0)' }}>
        {slides.map((s, i) => {
          const on = i === cur;
          const cls = cn('absolute inset-0 h-full w-full transition-[opacity,transform] duration-[900ms] ease-out', on ? 'scale-100 opacity-100' : 'scale-[1.06] opacity-0');
          // Slide tanpa foto: latar biru tua dengan tanda CeLAE samar.
          return s.image ? (
            <Img key={s.key} src={s.image} alt="" priority={i === 0} sizes="100vw" aria-hidden="true" className={cn(cls, 'object-cover')} />
          ) : (
            <div key={s.key} aria-hidden="true" className={cn(cls, 'grid place-items-center bg-gradient-to-br from-deep-2 to-deep')}>
              <img src="/celae-mark-192.webp" width="192" height="123" alt="" className="w-[min(60vw,28rem)] opacity-[0.07] brightness-0 invert" />
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/45 to-deep/30" />
      </div>

      <div className="shell relative flex h-full flex-col items-center justify-center pb-20 pt-10 text-center" aria-live={auto ? 'off' : 'polite'}>
        {n === 0 && (
          <div className="w-full max-w-3xl" role="status" aria-label="Memuat sorotan">
            <div className="skel mx-auto h-10 w-4/5 !bg-white/15" />
            <div className="skel mx-auto mt-4 h-10 w-3/5 !bg-white/15" />
            <div className="skel mx-auto mt-8 h-5 w-2/5 !bg-white/15" />
          </div>
        )}
        {slides.map((s, i) => {
          const active = i === cur;
          const Heading = i === 0 ? 'h1' : 'h2';
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${n}`}
              aria-hidden={!active}
              className={cn('absolute inset-x-5 top-1/2 mx-auto max-w-5xl -translate-y-1/2 transition-[opacity,transform] duration-700 ease-out md:inset-x-8', active ? 'translate-y-[-50%] opacity-100' : 'pointer-events-none translate-y-[-44%] opacity-0')}
            >
              <Heading className="line-clamp-4 font-sans text-[clamp(1.75rem,4.6vw,3.5rem)] font-bold uppercase leading-[1.08] tracking-tight text-white [text-shadow:0_2px_18px_rgb(8_11_24/0.55)]">
                {s.title}
              </Heading>
              {s.sub && <p className="mx-auto mt-5 inline-block max-w-[46ch] border-b-2 border-accent pb-2 text-[clamp(1rem,1.9vw,1.375rem)] text-white [text-shadow:0_1px_10px_rgb(8_11_24/0.6)]">
                {s.sub}
              </p>}
              {s.to && s.cta && (
                <div className="mt-8">
                  <SlideAction to={s.to} tabIndex={active ? 0 : -1}>{s.cta}</SlideAction>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(cur - 1)} aria-label="Slide sebelumnya" className={cn(arrow, 'left-4 md:left-6')}>
            <CaretLeft size={20} weight="bold" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(cur + 1)} aria-label="Slide berikutnya" className={cn(arrow, 'right-4 md:right-6')}>
            <CaretRight size={20} weight="bold" aria-hidden="true" />
          </button>
        </>
      )}

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3">
        {n > 1 && (
          <ul className="flex items-center gap-2" aria-label="Pilih slide">
            {slides.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === cur}
                  className="grid h-6 place-items-center px-0.5"
                >
                  <span className={cn('block h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out', i === cur ? 'w-8 bg-accent' : 'w-2.5 bg-white/90')} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {n > 1 && !reduce && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Jeda putar otomatis' : 'Putar otomatis'}
            className="absolute right-4 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 md:right-8"
          >
            {playing ? <Pause size={16} weight="fill" aria-hidden="true" /> : <Play size={16} weight="fill" aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
