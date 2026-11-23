import PageHeader from '../../components/layout/PageHeader.jsx';
import SpotlightCard from '../../components/ui/SpotlightCard.jsx';
import { Flask, GraduationCap, Handshake, Palette, UsersThree } from '@phosphor-icons/react';
import { programs } from '../../data/content.js';

const ICONS = [Flask, GraduationCap, UsersThree, Handshake, Palette];

export default function ProgramKerja() {
  return (
    <>
      <PageHeader title="Program Kerja" lead="Lima arah kerja yang saling menguatkan, dari penelitian sampai komunitas." crumbs={[{ label: 'Tentang' }, { label: 'Program Kerja' }]} />
      <section className="shell py-16">
        <ul className="grid gap-5 md:grid-cols-2">
          {programs.map((p, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <SpotlightCard as="li" key={p.title} className={`p-7 sm:p-9 ${i === 0 ? 'md:col-span-2' : ''}`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={24} aria-hidden="true" /></span>
                <h2 className="mt-6 text-2xl font-medium leading-snug">{p.title}</h2>
                <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">{p.desc}</p>
                {p.items?.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {p.items.map((it) => <li key={it} className="rounded-full border border-line px-3.5 py-1.5 text-sm">{it}</li>)}
                  </ul>
                )}
              </SpotlightCard>
            );
          })}
        </ul>
      </section>
    </>
  );
}
