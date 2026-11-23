import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { org, vision } from '../../data/content.js';

export default function VisionSection() {
  return (
    <section className="shell grid gap-14 pb-24 sm:pb-32 lg:grid-cols-[1.5fr_1fr] lg:gap-20" aria-labelledby="visi-title">
      <div>
        <h2 id="visi-title" className="text-sm font-medium font-sans text-muted">Visi kami</h2>
        <blockquote className="mt-6 font-display text-[clamp(1.6rem,3.1vw,2.6rem)] font-normal leading-[1.22] tracking-tight text-ink">
          {vision}
        </blockquote>
        <Link to="/tentang/visi-misi" className="group mt-10 inline-flex items-center gap-2 font-medium text-brand">
          <span className="u-link">Baca visi dan misi lengkap</span>
          <ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <dl className="self-end divide-y divide-line border-y border-line">
        {[
          ['Berdiri', String(org.founded)],
          ['Berada di bawah', 'LPPM Universitas Negeri Medan'],
          ['Bidang', 'Literasi, seni, dan pendidikan'],
          ['Bentuk kerja', 'Riset, pelatihan, komunitas, kolaborasi'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-6 py-4">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="text-right text-[0.9375rem] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
