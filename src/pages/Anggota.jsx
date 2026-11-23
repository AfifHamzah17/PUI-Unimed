import PageHeader from '../components/layout/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { members, rankOf } from '../data/content.js';

const sorted = [...members].sort((a, b) => rankOf(a) - rankOf(b));

export default function Anggota() {
  const [lead, ...rest] = sorted;
  return (
    <>
      <PageHeader title="Daftar Nama Anggota" lead="Dosen dan peneliti Universitas Negeri Medan yang menjalankan PUI Literasi dan Seni dalam Pendidikan." crumbs={[{ label: 'Keanggotaan' }, { label: 'Daftar Nama Anggota' }]} />
      <section className="shell grid gap-14 py-16 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        {/* Ketua tampil besar di kiri; yang lain mengalir di kanan dengan geseran vertikal berselang-seling. */}
        <figure className="lg:sticky lg:top-24 lg:self-start">
          <Avatar member={lead} size="xl" priority className="!rounded-lg" />
          <figcaption className="mt-5">
            <p className="text-sm font-medium text-brand">{lead.role}</p>
            <p className="text-xs italic text-muted">{lead.roleEn}</p>
            <h2 className="mt-2 font-display text-2xl leading-snug">{lead.name}</h2>
            {lead.institution && <p className="mt-1 text-sm text-muted">{lead.institution}{lead.expertise ? `, ${lead.expertise}` : ''}</p>}
          </figcaption>
        </figure>

        <ul className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3">
          {rest.map((m, i) => (
            <li key={m.name} className={i % 2 ? 'sm:mt-12' : ''}>
              <Avatar member={m} size="xl" className="!rounded-lg" />
              <p className="mt-4 text-sm font-medium leading-snug text-brand">{m.role}</p>
              {m.roleEn && <p className="mt-0.5 text-xs italic leading-snug text-muted">{m.roleEn}</p>}
              <h2 className="mt-2 font-sans text-[1rem] font-medium leading-snug">{m.name}</h2>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
