import { UserPlus } from '@phosphor-icons/react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { groupMembers } from '../../data/content.js';

function PersonCard({ member, emphasis, stacked }) {
  return (
    <div className={`flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left shadow-soft ${stacked ? 'lg:h-full lg:flex-col lg:items-start' : ''}`}>
      <Avatar member={member} size={emphasis ? 'md' : 'sm'} />
      <div className="min-w-0">
        <p className="text-xs text-muted">{member.role}</p>
        <p className="mt-0.5 text-[0.9375rem] font-medium leading-snug">{member.name}</p>
        {member.institution && <p className="mt-0.5 text-xs text-muted">{member.institution}</p>}
      </div>
    </div>
  );
}

function Vacant({ role }) {
  return (
    <div className="flex w-full items-center gap-4 rounded-3xl border border-dashed border-ink/25 p-4 text-left">
      <span className="grid h-[3.75rem] w-12 shrink-0 place-items-center rounded-xl bg-mist text-muted"><UserPlus size={22} aria-hidden="true" /></span>
      <div>
        <p className="text-xs text-muted">{role}</p>
        <p className="mt-0.5 text-[0.9375rem] font-medium">Nama menyusul</p>
      </div>
    </div>
  );
}

// Garis penghubung vertikal antar tingkat.
const Stem = () => <div className="mx-auto h-10 w-px bg-ink/25" aria-hidden="true" />;

export default function Struktur() {
  const { ketua, sekretaris, tim } = groupMembers();
  const n = Math.max(tim.length, 1);

  return (
    <>
      <PageHeader title="Struktur Organisasi" lead="Ketua memimpin arah pusat, sekretaris menjaga administrasi dan koordinasi, tim pelaksana menjalankan program." crumbs={[{ label: 'Tentang' }, { label: 'Struktur Organisasi' }]} />
      <section className="shell py-16">
        <div className="mx-auto max-w-sm">
          {ketua && <PersonCard member={ketua} emphasis />}
          <Stem />
          {sekretaris ? <PersonCard member={sekretaris} /> : <Vacant role="Sekretaris" />}
          <Stem />
        </div>

        <p className="mb-6 text-center text-sm font-medium text-muted">Tim pelaksana</p>

        {/* Desktop: satu baris dengan garis bus horizontal. Layar sempit: daftar bertumpuk. */}
        <div className="relative lg:pt-10">
          <div className="absolute top-0 hidden h-px bg-ink/25 lg:block" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} aria-hidden="true" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ '--n': n }}>
            {tim.map((m) => (
              <li key={m.name} className="relative lg:before:absolute lg:before:-top-10 lg:before:left-1/2 lg:before:h-10 lg:before:w-px lg:before:bg-ink/25 lg:before:content-['']">
                <PersonCard member={m} stacked />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
