import PageHeader from '../components/layout/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { isKetua, isSekretaris, members } from '../data/content.js';

const rank = (m) => (isKetua(m) ? 0 : isSekretaris(m) ? 1 : 2);
const sorted = [...members].sort((a, b) => rank(a) - rank(b));

export default function Anggota() {
  return (
    <>
      <PageHeader title="Daftar Nama Anggota" lead="Dosen dan peneliti Universitas Negeri Medan yang menjalankan PUI Literasi dan Seni dalam Pendidikan." crumbs={[{ label: 'Keanggotaan' }, { label: 'Daftar Nama Anggota' }]} />
      <section className="shell py-16">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((m, i) => (
            <li key={m.name} className={rank(m) === 0 ? 'col-span-2 md:col-span-1 lg:row-span-1' : ''}>
              <Avatar member={m} size="xl" priority={i < 2} />
              <p className="mt-4 text-sm text-muted">{m.role}</p>
              <h2 className="mt-1 font-sans text-[1.0625rem] font-medium leading-snug">{m.name}</h2>
              {m.institution && <p className="mt-1 text-sm text-muted">{m.institution}{m.expertise ? `, ${m.expertise}` : ''}</p>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
