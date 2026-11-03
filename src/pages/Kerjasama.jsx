import { Link } from 'react-router-dom';
import { Handshake } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ListView from '../components/ui/ListView.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import SpotlightCard from '../components/ui/SpotlightCard.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { kerjasamaRepo } from '../services/api.js';

const META = {
  'dalam-negeri': { title: 'Kerjasama Dalam Negeri', lead: 'Perguruan tinggi, asosiasi, dan lembaga di Indonesia yang bekerja bersama kami.', noun: 'mitra' },
  'luar-negeri': { title: 'Kerjasama Luar Negeri', lead: 'Jejaring riset lintas negara untuk literasi dan seni dalam pendidikan.', noun: 'mitra' },
};

const initials = (name) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('') || name.slice(0, 2).toUpperCase();

function Card({ item }) {
  return (
    <SpotlightCard as="li" className="p-0">
      <Link to={`/kerjasama/${item.scope}/${item.id}`} className="group flex h-full flex-col rounded-3xl p-6 sm:p-7">
        {item.cover && <img src={item.cover} alt="" width="640" height="360" loading="lazy" decoding="async" className="mb-5 aspect-[16/9] w-full rounded-2xl bg-mist object-cover" />}
        <div className="flex items-start justify-between gap-3">
          {!item.cover && <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-semibold text-brand" aria-hidden="true">{initials(item.partner)}</span>}
          {item.demo && <DemoBadge />}
        </div>
        <h2 className={`${item.cover ? '' : 'mt-5 '}font-display text-xl font-medium leading-snug transition-colors group-hover:text-brand`}>{item.partner}</h2>
        {item.kind && <div className="mt-2"><Badge tone="brand">{item.kind}</Badge></div>}
        {item.summary && <p className="mt-4 line-clamp-4 text-[0.9375rem] leading-relaxed text-muted">{item.summary}</p>}
      </Link>
    </SpotlightCard>
  );
}

export default function Kerjasama({ scope }) {
  const m = META[scope];
  return (
    <>
      <PageHeader title={m.title} lead={m.lead} crumbs={[{ label: 'Kerjasama' }, { label: m.title }]} />
      <section className="shell pb-8 pt-12">
        <ListView
          repo={kerjasamaRepo}
          params={{ type: scope }}
          pageSize={6}
          placeholder="Cari mitra"
          resultNoun={m.noun}
          wrapperClass="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          renderItem={(it) => <Card key={it.id} item={it} />}
          renderSkeleton={() => (
            <div className="rounded-3xl border border-line bg-surface p-7">
              <Skeleton className="h-14 w-14 rounded-2xl" /><Skeleton className="mt-5 h-6 w-3/4" /><Skeleton className="mt-4 h-3 w-full" /><Skeleton className="mt-2 h-3 w-5/6" />
            </div>
          )}
          empty={
            <EmptyState icon={Handshake} title="Belum ada mitra tercatat" action={<Button to="/keanggotaan/pendaftaran" variant="outline">Ajukan kerja sama</Button>}>
              Kami terbuka untuk kolaborasi riset dan kegiatan. Mitra yang sudah resmi akan tampil di halaman ini.
            </EmptyState>
          }
        />
      </section>
    </>
  );
}
