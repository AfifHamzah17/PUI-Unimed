import PageHeader from '../../components/layout/PageHeader.jsx';
import { history, org } from '../../data/content.js';

export default function Sejarah() {
  return (
    <>
      <PageHeader title="Sejarah" lead="Dari komitmen institusi menjadi pusat unggulan yang bekerja untuk literasi dan seni." crumbs={[{ label: 'Tentang' }, { label: 'Sejarah' }]} />
      <section className="shell grid gap-10 py-16 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start" aria-hidden="true">
          <p className="outline-text font-mono text-[clamp(5rem,12vw,9rem)] font-medium leading-none tracking-tighter">{org.founded}</p>
          <p className="mt-4 max-w-[18ch] text-sm text-muted">Tahun berdirinya PUI di bawah LPPM UNIMED.</p>
        </div>
        <div className="max-w-prose space-y-6 text-[1.0625rem] leading-[1.8]">
          {history.map((p, i) => (
            <p key={i} className={i === 0 ? 'font-display text-[1.5rem] leading-[1.45] text-ink' : 'text-ink/85'}>{p}</p>
          ))}
        </div>
      </section>
    </>
  );
}
