import { Link } from 'react-router-dom';
import { ArrowUpRight, Flask, GraduationCap, Handshake, Palette, UsersThree } from '@phosphor-icons/react';
import { programs } from '../../data/content.js';
import SectionHead from '../../components/ui/SectionHead.jsx';

const ICONS = [Flask, GraduationCap, UsersThree, Handshake, Palette];

export default function ProgramsSection() {
  return (
    <section className="border-t border-line bg-mist/40 py-24 sm:py-32" aria-labelledby="program-title">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHead
            title={<span id="program-title">Lima arah kerja kami</span>}
            lead="Dari penelitian sampai komunitas, setiap program saling menguatkan."
          />
          <Link to="/tentang/program-kerja" className="group mt-8 inline-flex items-center gap-2 font-medium text-brand">
            <span className="u-link">Lihat program kerja</span>
            <ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {programs.map((p, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={p.title} className="group flex gap-5 py-7 transition-colors duration-300 sm:gap-7 sm:py-8">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand transition duration-300 group-hover:-rotate-6 group-hover:bg-brand group-hover:text-on-brand">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[1.375rem] font-medium leading-snug">{p.title}</h3>
                  <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-relaxed text-muted">{p.desc}</p>
                  {p.items?.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {p.items.map((it) => (
                        <li key={it} className="rounded-full border border-line px-3 py-1 text-[0.8125rem] text-muted">{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
