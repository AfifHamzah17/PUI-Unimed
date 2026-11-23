import { Link } from 'react-router-dom';
import { Handshake } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ListView from '../components/ui/ListView.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Img from '../components/ui/Img.jsx';
import { DemoBadge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { kerjasamaRepo } from '../services/api.js';

const META = {
  'dalam-negeri': { title: 'Kerjasama Dalam Negeri', band: 'Dalam negeri', lead: 'Perguruan tinggi, asosiasi, dan lembaga di Indonesia yang bekerja bersama kami.', other: ['/kerjasama/luar-negeri', 'Lihat mitra luar negeri'] },
  'luar-negeri': { title: 'Kerjasama Luar Negeri', band: 'Luar negeri', lead: 'Jejaring riset lintas negara untuk literasi dan seni dalam pendidikan.', other: ['/kerjasama/dalam-negeri', 'Lihat mitra dalam negeri'] },
};

const initials = (name) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 3).map((w) => w[0]).join('') || name.slice(0, 2).toUpperCase();

/** Ubin mitra: logo di atas kotak putih; tanpa logo, singkatan nama. Nama selalu tertulis di bawahnya. */
function Tile({ item }) {
  return (
    <li>
      <Link to={`/kerjasama/${item.scope}/${item.id}`} className="group block">
        <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-line bg-white p-5 shadow-soft transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
          {item.cover ? (
            <Img src={item.cover} alt="" width="320" height="320" sizes="(min-width:1024px) 14rem, 40vw" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-brand" aria-hidden="true">{initials(item.partner)}</span>
          )}
        </div>
        <p className="mt-3 text-[0.9375rem] leading-snug text-ink transition-colors group-hover:text-brand">{item.partner}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted">{item.kind}{item.demo && <DemoBadge />}</p>
      </Link>
    </li>
  );
}

export default function Kerjasama({ scope }) {
  const m = META[scope];
  return (
    <>
      <PageHeader title={m.title} lead={m.lead} crumbs={[{ label: 'Kerjasama' }, { label: m.title }]} />
      <section className="shell pb-8 pt-12">
        <div className="mb-10 flex items-center gap-5" role="presentation">
          <span className="h-px flex-1 bg-accent/70" aria-hidden="true" />
          <h2 className="font-sans text-base font-semibold">{m.band}</h2>
          <span className="h-px flex-1 bg-accent/70" aria-hidden="true" />
        </div>
        <ListView
          repo={kerjasamaRepo}
          params={{ type: scope }}
          pageSize={15}
          placeholder="Cari mitra"
          resultNoun="mitra"
          wrapperClass="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5"
          renderItem={(it) => <Tile key={it.id} item={it} />}
          skeletonCount={5}
          renderSkeleton={() => (
            <div><Skeleton className="aspect-square w-full rounded-xl" /><Skeleton className="mt-3 h-4 w-3/4" /></div>
          )}
          empty={
            <EmptyState icon={Handshake} title="Belum ada mitra tercatat" action={<Button to="/keanggotaan/pendaftaran" variant="outline">Ajukan kerja sama</Button>}>
              Kami terbuka untuk kolaborasi riset dan kegiatan. Mitra yang sudah resmi akan tampil di halaman ini.
            </EmptyState>
          }
        />
        <p className="mt-14 text-sm text-muted"><Link to={m.other[0]} className="u-link text-brand">{m.other[1]}</Link></p>
      </section>
    </>
  );
}
