import { NavLink } from 'react-router-dom';
import { Presentation } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ListView from '../components/ui/ListView.jsx';
import ActivityCard, { ActivityCardSkeleton } from '../components/ui/ActivityCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { kegiatanRepo } from '../services/api.js';
import { KEGIATAN_META } from '../data/labels.js';
import { cn } from '../lib/cn.js';

const TABS = [
  ['semua', '/kegiatan'],
  ['workshop', '/kegiatan/workshop'],
  ['seminar', '/kegiatan/seminar'],
  ['kunjungan', '/kegiatan/kunjungan'],
];

export default function Kegiatan({ type = 'semua' }) {
  const m = KEGIATAN_META[type];
  const params = type === 'semua' ? {} : { type };
  return (
    <>
      <PageHeader title={m.title} lead={m.lead} crumbs={[{ label: 'Kegiatan', to: type === 'semua' ? undefined : '/kegiatan' }, ...(type === 'semua' ? [] : [{ label: m.title }])]} />
      <section className="shell pb-8 pt-10">
        <nav aria-label="Jenis kegiatan" className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {TABS.map(([key, to]) => (
            <NavLink
              key={key}
              to={to}
              end
              className={({ isActive }) =>
                cn('shrink-0 rounded-lg border px-4 py-2 text-sm transition', isActive ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:border-ink/40 hover:text-ink')
              }
            >
              {KEGIATAN_META[key].title}
            </NavLink>
          ))}
        </nav>

        <ListView
          repo={kegiatanRepo}
          params={params}
          pageSize={6}
          placeholder={`Cari ${m.noun}`}
          resultNoun="kegiatan"
          wrapperClass="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:items-start"
          renderItem={(it, i) => <ActivityCard key={it.id} item={it} index={i} headingAs="h2" />}
          renderSkeleton={(i) => <ActivityCardSkeleton index={i} />}
          empty={<EmptyState icon={Presentation} title={`Belum ada ${m.noun}`}>Kegiatan akan tampil di sini setelah ditambahkan lewat halaman kelola.</EmptyState>}
        />
      </section>
    </>
  );
}
