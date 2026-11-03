import { Link } from 'react-router-dom';
import { CalendarBlank, MapPin, Presentation, VideoCamera } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ListView from '../components/ui/ListView.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { kegiatanRepo } from '../services/api.js';
import { dayOf, formatDate, formatMonth, isPast } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const META = {
  workshop: { title: 'Workshop', lead: 'Pelatihan praktik untuk pendidik dan mahasiswa: merancang media, menulis, dan menilai literasi.' },
  seminar: { title: 'Seminar', lead: 'Forum untuk memaparkan hasil riset dan mempertemukan gagasan baru tentang literasi dan seni.' },
};
const modeLabel = { luring: 'Tatap muka', daring: 'Daring', hybrid: 'Hybrid' };

function Card({ item }) {
  const past = isPast(item.date);
  return (
    <li>
    <Link to={`/kegiatan/${item.type}/${item.id}`} className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:p-6">
      {item.cover && <img src={item.cover} alt="" width="640" height="360" loading="lazy" decoding="async" className="mb-5 aspect-[16/9] w-full rounded-2xl bg-mist object-cover" />}
      <div className="flex gap-5">
      <div className={cn('grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-2xl text-center leading-none', past ? 'bg-mist text-muted' : 'bg-brand text-on-brand')}>
        <span>
          <span className="block font-mono text-[1.75rem] font-semibold tabular">{dayOf(item.date)}</span>
          <span className="mt-1 block text-xs">{formatMonth(item.date)}</span>
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={past ? 'muted' : 'brand'}>{past ? 'Sudah berlalu' : 'Akan datang'}</Badge>
          <Badge tone="muted">{modeLabel[item.mode] ?? item.mode}</Badge>
          {item.demo && <DemoBadge />}
        </div>
        <h2 className="mt-3 font-display text-xl font-medium leading-snug transition-colors group-hover:text-brand">{item.title}</h2>
        {item.summary && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{item.summary}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5"><CalendarBlank size={16} aria-hidden="true" />{formatDate(item.date)}</span>
          <span className="inline-flex items-center gap-1.5">{item.mode === 'daring' ? <VideoCamera size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}{item.location}</span>
        </p>
      </div>
      </div>
    </Link>
    </li>
  );
}

export default function Kegiatan({ type }) {
  const m = META[type];
  return (
    <>
      <PageHeader title={m.title} lead={m.lead} crumbs={[{ label: 'Kegiatan' }, { label: m.title }]} />
      <section className="shell pb-8 pt-12">
        <ListView
          repo={kegiatanRepo}
          params={{ type }}
          pageSize={6}
          placeholder={`Cari ${m.title.toLowerCase()}`}
          resultNoun="kegiatan"
          wrapperClass="grid gap-5 lg:grid-cols-2"
          renderItem={(it) => <Card key={it.id} item={it} />}
          renderSkeleton={() => (
            <div className="flex gap-5 rounded-3xl border border-line bg-surface p-6">
              <Skeleton className="h-[4.5rem] w-[4.5rem] rounded-2xl" />
              <div className="flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-6 w-4/5" /><Skeleton className="mt-3 h-3 w-full" /></div>
            </div>
          )}
          empty={<EmptyState icon={Presentation} title={`Belum ada ${m.title.toLowerCase()}`}>Jadwal akan tampil di sini setelah ditambahkan.</EmptyState>}
        />
      </section>
    </>
  );
}
