import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Scramble from '../../components/ui/Scramble.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import FolioStack from '../../components/folio/FolioStack.jsx';
import { useParallax } from '../../hooks/useParallax.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useRepoList } from '../../hooks/useRepo.js';
import { publikasiRepo } from '../../services/api.js';

const LATEST_PARAMS = { type: 'jurnal', page: 1, pageSize: 1 };

function LatestStrip() {
  const { data, loading } = useRepoList(publikasiRepo, LATEST_PARAMS);
  const item = data?.items?.[0];

  if (loading) return <Skeleton className="mt-12 h-16 w-full max-w-lg bg-white/10" />;
  if (!item) return null;
  return (
    <Link
      to={item.pdfUrl ? `/publikasi/baca/${item.id}` : '/publikasi/jurnal'}
      className="group mt-12 flex max-w-lg items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 pr-5 transition hover:border-white/30 hover:bg-white/[0.08]"
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-deep">
        <BookOpenText size={22} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse-dot rounded-full bg-accent" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-white/55">Jurnal terbaru, {item.year}</span>
        <span className="line-clamp-1 block text-sm font-medium text-white">{item.title}</span>
      </span>
      <ArrowRight size={18} className="ml-auto shrink-0 text-white/60 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export default function Hero() {
  const bg = useRef(null);
  const obj = useRef(null);
  const reduce = useReducedMotion();
  useParallax(bg, 0.18, reduce);
  useParallax(obj, 0.06, reduce);

  return (
    <section className="on-deep relative isolate overflow-hidden bg-deep text-white">
      {/* Lapisan latar: garis buku tulis (literasi) dan dua pendar warna lambang UNIMED. */}
      <div
        ref={bg}
        className="pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10"
        style={{
          transform: 'translate3d(0, var(--py, 0px), 0)',
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0 55px, rgb(255 255 255 / 0.05) 55px 56px)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 30%, transparent 95%)',
          maskImage: 'linear-gradient(to bottom, #000 30%, transparent 95%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 82% 28%, rgb(20 116 77 / 0.55), transparent 70%), radial-gradient(40% 40% at 6% 92%, rgb(227 169 26 / 0.14), transparent 70%)',
        }}
      />

      <div className="shell grid min-h-[100dvh] items-center gap-12 pb-20 pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:pt-28">
        <div>
          <Scramble
            text="Pusat Unggulan IPTEK, sejak 2024"
            className="font-mono text-[0.8125rem] text-accent"
            duration={1100}
            delay={250}
            onHover
          />
          <h1 className="mt-6 max-w-[16ch] text-[clamp(2.6rem,5.8vw,4.9rem)] font-medium leading-[1.01] text-white">
            Riset literasi dan seni yang berpihak pada ruang kelas
          </h1>
          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-white/70">
            Kami meneliti, melatih, dan menerbitkan karya agar membaca, menulis, dan berkarya seni menjadi bagian nyata dari pendidikan di Universitas Negeri Medan dan sekitarnya.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button to="/publikasi/jurnal" variant="gold" size="lg">
              Baca jurnal terbaru
              <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
            </Button>
            <Button to="/tentang/sejarah" variant="outline-light" size="lg">Kenali pusat ini</Button>
          </div>
          <LatestStrip />
        </div>

        <div ref={obj} style={{ transform: 'translate3d(0, var(--py, 0px), 0)' }}>
          <FolioStack />
        </div>
      </div>
    </section>
  );
}
