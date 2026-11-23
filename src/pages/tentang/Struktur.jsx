import { UserPlus } from '@phosphor-icons/react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { groupMembers } from '../../data/content.js';

function PersonCard({ member, emphasis }) {
  return (
    <div className="flex h-full w-full items-center gap-4 rounded-lg border border-line bg-surface p-4 text-left">
      <Avatar member={member} size={emphasis ? 'md' : 'sm'} className="!rounded-md" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand">{member.role}</p>
        {member.roleEn && <p className="text-xs italic text-muted">{member.roleEn}</p>}
        <p className="mt-1.5 text-[0.9375rem] leading-snug">{member.name}</p>
        {member.institution && <p className="mt-0.5 text-xs text-muted">{member.institution}</p>}
      </div>
    </div>
  );
}

function Vacant({ role }) {
  return (
    <div className="flex h-full w-full items-center gap-4 rounded-lg border border-dashed border-ink/25 p-4 text-left">
      <span className="grid h-[3.75rem] w-12 shrink-0 place-items-center rounded-md bg-mist text-muted"><UserPlus size={22} aria-hidden="true" /></span>
      <div><p className="text-sm text-muted">{role}</p><p className="mt-0.5 text-[0.9375rem] font-medium">Nama menyusul</p></div>
    </div>
  );
}

const Stem = ({ className = 'h-10' }) => <div className={`mx-auto w-px bg-ink/25 ${className}`} aria-hidden="true" />;

export default function Struktur() {
  const { ketua, wakil, sekretaris, koordinator } = groupMembers();
  const n = Math.max(koordinator.length, 1);

  return (
    <>
      <PageHeader
        title="Struktur Organisasi"
        lead="Ketua memimpin arah pusat, wakil ketua dan sekretaris menjaga koordinasi dan administrasi, tiga koordinator memimpin bidang kerjanya."
        crumbs={[{ label: 'Tentang' }, { label: 'Struktur Organisasi' }]}
      />
      <section className="shell py-16">
        <div className="mx-auto max-w-sm">{ketua ? <PersonCard member={ketua} emphasis /> : <Vacant role="Ketua" />}</div>
        <Stem />
        <div className="relative mx-auto max-w-3xl sm:pt-10">
          <div className="absolute left-1/4 right-1/4 top-0 hidden h-px bg-ink/25 sm:block" aria-hidden="true" />
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {[[wakil, 'Wakil Ketua'], [sekretaris, 'Sekretaris']].map(([m, role]) => (
              <li key={role} className="relative sm:before:absolute sm:before:-top-10 sm:before:left-1/2 sm:before:h-10 sm:before:w-px sm:before:bg-ink/25 sm:before:content-['']">
                {m ? <PersonCard member={m} /> : <Vacant role={role} />}
              </li>
            ))}
          </ul>
        </div>
        <Stem />

        <p className="mb-6 text-center text-sm font-medium text-muted">Koordinator bidang</p>
        <div className="relative lg:pt-10">
          <div className="absolute top-0 hidden h-px bg-ink/25 lg:block" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} aria-hidden="true" />
          <ul className="grid gap-3 md:grid-cols-2 lg:gap-4 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ '--n': n }}>
            {koordinator.map((m) => (
              <li key={m.name} className="relative lg:before:absolute lg:before:-top-10 lg:before:left-1/2 lg:before:h-10 lg:before:w-px lg:before:bg-ink/25 lg:before:content-['']">
                <PersonCard member={m} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
