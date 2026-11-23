import { useParams } from 'react-router-dom';
import { ArrowLeft, CalendarBlank, MapPin, VideoCamera } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import NotFound from './NotFound.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import Gallery from '../components/ui/Gallery.jsx';
import Img from '../components/ui/Img.jsx';
import ActivityCard from '../components/ui/ActivityCard.jsx';
import RichText from '../components/ui/RichText.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useRepoItem, useRepoList } from '../hooks/useRepo.js';
import { kegiatanRepo } from '../services/api.js';
import { KEGIATAN_TYPE, MODE } from '../data/labels.js';
import { formatDate, isPast } from '../lib/format.js';

const RELATED = { page: 1, pageSize: 3 };

/** Dua kegiatan lain, memakai bentuk asimetris yang sama dengan daftar. */
function Related({ currentId }) {
  const { data } = useRepoList(kegiatanRepo, RELATED);
  const others = (data?.items ?? []).filter((it) => it.id !== currentId).slice(0, 2);
  if (!others.length) return null;
  return (
    <section className="shell mt-24" aria-labelledby="lain-title">
      <h2 id="lain-title" className="text-[clamp(1.5rem,2.6vw,2.125rem)]">Kegiatan lainnya</h2>
      <ul className="mt-8 grid gap-x-8 gap-y-12 lg:grid-cols-12 lg:items-start">
        {others.map((it, i) => <ActivityCard key={it.id} item={it} index={i} />)}
      </ul>
    </section>
  );
}

export default function KegiatanDetail() {
  const { id } = useParams();
  const { item, loading, error } = useRepoItem(kegiatanRepo, id);

  if (loading) {
    return (
      <div className="shell pb-24 pt-20" role="status" aria-label="Memuat kegiatan">
        <Skeleton className="h-3 w-48" /><Skeleton className="mt-8 h-12 w-3/4" /><Skeleton className="mt-12 aspect-[16/9] w-full max-w-4xl rounded-lg" />
      </div>
    );
  }
  if (error || !item) return <NotFound title="Kegiatan tidak ditemukan" />;

  const upcoming = !isPast(item.date);
  const list = `/kegiatan/${item.type}`;
  const isLink = /^https:\/\//.test(item.location);
  const Place = item.mode === 'daring' ? VideoCamera : MapPin;

  return (
    <>
      <PageHeader
        title={item.title}
        titleForDocument={item.title.slice(0, 70)}
        lead={item.summary}
        crumbs={[{ label: 'Kegiatan', to: '/kegiatan' }, { label: KEGIATAN_TYPE[item.type], to: list }, { label: 'Detail' }]}
      />

      {item.cover && (
        <figure className="shell mt-10">
          <Img src={item.cover} alt="" width="1600" height="900" priority sizes="(min-width:1280px) 1216px, 100vw" className="aspect-[4/3] w-full rounded-lg bg-mist object-cover sm:aspect-[16/9] lg:aspect-[2/1]" />
        </figure>
      )}

      <article className="shell grid gap-12 pb-4 pt-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20">
        <div className="min-w-0 lg:max-w-[46rem]">
          {item.content ? (
            <RichText doc={item.content} />
          ) : (
            !item.gallery?.length && <p className="text-muted">Uraian lengkap belum ditambahkan.</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Informasi kegiatan">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{KEGIATAN_TYPE[item.type]}</Badge>
            {upcoming && <Badge tone="accent">Akan datang</Badge>}
            {item.demo && <DemoBadge />}
          </div>
          <dl className="mt-6 divide-y divide-line border-y border-line text-[0.9375rem]">
            <div className="py-4"><dt className="flex items-center gap-2 text-sm text-muted"><CalendarBlank size={16} aria-hidden="true" /> Tanggal</dt><dd className="mt-1 font-medium">{formatDate(item.date)}</dd></div>
            <div className="py-4"><dt className="flex items-center gap-2 text-sm text-muted"><Place size={16} aria-hidden="true" /> Lokasi</dt><dd className="mt-1 font-medium">{isLink ? <a className="u-link text-brand" href={item.location} target="_blank" rel="noopener noreferrer">Buka tautan kegiatan</a> : item.location}</dd></div>
            <div className="py-4"><dt className="text-sm text-muted">Format</dt><dd className="mt-1 font-medium">{MODE[item.mode]}</dd></div>
          </dl>
          <Button to={list} variant="outline" size="sm" className="mt-8 rounded-lg"><ArrowLeft size={16} aria-hidden="true" /> Semua {KEGIATAN_TYPE[item.type].toLowerCase()}</Button>
        </aside>
      </article>

      {item.gallery?.length > 0 && (
        <section className="shell mt-12" aria-labelledby="galeri-title">
          <h2 id="galeri-title" className="text-[clamp(1.5rem,2.6vw,2.125rem)]">Galeri foto</h2>
          <div className="mt-8"><Gallery images={item.gallery} label={`Galeri foto ${item.title}`} /></div>
        </section>
      )}

      <Related currentId={item.id} />
    </>
  );
}
