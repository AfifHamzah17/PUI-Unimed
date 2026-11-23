import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import Avatar from '../../components/ui/Avatar.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { members, rankOf } from '../../data/content.js';

const sorted = [...members].sort((a, b) => rankOf(a) - rankOf(b));

export default function TeamSection() {
  const [ketua, ...others] = sorted;

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="tim-title">
      <SectionHead title={<span id="tim-title">Tim di balik pusat ini</span>} lead="Dosen dan peneliti UNIMED yang menjalankan riset, pelatihan, dan kolaborasi." />

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,19rem)_1fr] lg:gap-16">
        {ketua && (
          <figure>
            <Avatar member={ketua} size="xl" priority={false} className="!rounded-lg" />
            <figcaption className="mt-5">
              <p className="text-sm font-medium text-brand">{ketua.role}</p>
              <p className="mt-1 font-display text-xl leading-snug">{ketua.name}</p>
              {ketua.institution && <p className="mt-1 text-sm text-muted">{ketua.institution}, {ketua.expertise}</p>}
            </figcaption>
          </figure>
        )}

        <div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {others.map((m, i) => (
              <li key={m.name} className={i % 2 ? 'sm:mt-10' : ''}>
                <Avatar member={m} size="lg" className="!h-auto !w-full aspect-[4/5] !rounded-lg" />
                <p className="mt-4 text-sm font-medium leading-snug text-brand">{m.role}</p>
                <p className="mt-1 text-[0.9375rem] leading-snug">{m.name}</p>
              </li>
            ))}
          </ul>
          <Link to="/tentang/struktur-organisasi" className="group mt-12 inline-flex items-center gap-2 font-medium text-brand">
            <span className="u-link">Lihat struktur organisasi</span>
            <ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
