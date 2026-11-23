import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpenText, FilePdf } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ListView from '../components/ui/ListView.jsx';
import { DemoBadge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { publikasiRepo } from '../services/api.js';

const META = {
  penelitian: { title: 'Penelitian', lead: 'Hasil riset yang dikerjakan tim PUI, dari laporan sampai artikel.', noun: 'penelitian' },
  pengabdian: { title: 'Pengabdian kepada Masyarakat', lead: 'Karya yang langsung menyentuh sekolah, guru, dan komunitas.', noun: 'karya pengabdian' },
  jurnal: { title: 'Jurnal', lead: 'Artikel yang sudah terbit. Yang berkas PDF-nya tersedia bisa dibaca langsung di halaman ini, bahkan tanpa internet.', noun: 'artikel' },
};
const crumb = { label: 'Publikasi Ilmiah' };

function Row({ item }) {
  const readable = Boolean(item.pdfUrl);
  const to = `/publikasi/baca/${item.id}`; // semua entri punya halaman detail; PDF hanya jika tersedia
  const body = (
    <>
      <span className="font-mono text-sm text-muted tabular sm:w-14 sm:pt-1.5">{item.year}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {item.demo && <DemoBadge />}
          {readable && <span className="inline-flex items-center gap-1 text-xs font-medium text-brand"><FilePdf size={14} aria-hidden="true" /> PDF tersedia</span>}
        </span>
        <span className="mt-1.5 block font-display text-[1.375rem] font-medium leading-snug text-ink transition-colors group-hover:text-brand">{item.title}</span>
        <span className="mt-2 block text-sm text-muted">{item.authors.join(', ')}</span>
        {item.venue && <span className="mt-0.5 block text-sm text-muted">{item.venue}{item.volume ? `, ${item.volume}` : ''}</span>}
      </span>
      {(
        <span className="mt-2 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand sm:mt-1.5">
          {readable ? 'Baca' : 'Lihat'} <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );
  const cls = 'group flex flex-col gap-2 py-7 sm:flex-row sm:gap-6';
  return (
    <li key={item.id}>
      <Link to={to} className={cls}>{body}</Link>
    </li>
  );
}

export default function Publikasi({ type }) {
  const m = META[type];
  return (
    <>
      <PageHeader title={m.title} lead={m.lead} crumbs={[crumb, { label: m.title }]} />
      <section className="shell pb-8 pt-12">
        <ListView
          repo={publikasiRepo}
          params={{ type }}
          pageSize={6}
          placeholder={`Cari ${m.noun}, penulis, atau kata kunci`}
          resultNoun={m.noun}
          wrapperClass="divide-y divide-line border-y border-line"
          renderItem={(it) => <Row key={it.id} item={it} />}
          renderSkeleton={() => (
            <div className="flex gap-6 py-7">
              <Skeleton className="h-4 w-12" />
              <div className="flex-1"><Skeleton className="h-6 w-4/5" /><Skeleton className="mt-3 h-3 w-2/5" /></div>
            </div>
          )}
          empty={<EmptyState icon={BookOpenText} title={`Belum ada ${m.noun}`}>Entri akan muncul di sini setelah ditambahkan lewat halaman kelola konten.</EmptyState>}
        />
      </section>
    </>
  );
}
