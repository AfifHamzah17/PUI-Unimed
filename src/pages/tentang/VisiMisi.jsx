import PageHeader from '../../components/layout/PageHeader.jsx';
import { missions, vision } from '../../data/content.js';

export default function VisiMisi() {
  return (
    <>
      <PageHeader title="Visi dan Misi" lead="Arah jangka panjang pusat ini dan langkah yang kami ambil untuk mencapainya." crumbs={[{ label: 'Tentang' }, { label: 'Visi dan Misi' }]} />
      <section className="shell py-16">
        <h2 className="text-sm font-medium font-sans text-muted">Visi</h2>
        <blockquote className="mt-6 max-w-4xl font-display text-[clamp(1.75rem,3.4vw,2.9rem)] leading-[1.2] tracking-tight">{vision}</blockquote>

        <h2 className="mt-24 text-sm font-medium font-sans text-muted">Misi</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {missions.map((m) => (
            <li key={m.title} className="grid gap-2 py-7 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-12">
              <h3 className="text-xl font-medium leading-snug">{m.title}</h3>
              <p className="leading-relaxed text-muted">{m.desc}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
