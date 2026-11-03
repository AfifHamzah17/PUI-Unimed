import { useParams } from 'react-router-dom';
import { ArrowLeft, CalendarBlank, MapPin, VideoCamera } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import NotFound from './NotFound.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import Gallery from '../components/ui/Gallery.jsx';
import RichText from '../components/ui/RichText.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useRepoItem } from '../hooks/useRepo.js';
import { kegiatanRepo } from '../services/api.js';
import { formatDate, isPast } from '../lib/format.js';

const TYPE = { workshop: 'Workshop', seminar: 'Seminar' };
const MODE = { luring: 'Tatap muka', daring: 'Daring', hybrid: 'Hybrid' };

export default function KegiatanDetail() {
  const { id } = useParams();
  const { item, loading, error } = useRepoItem(kegiatanRepo, id);

  if (loading) {
    return (
      <div className="shell pb-24 pt-40" role="status" aria-label="Memuat kegiatan">
        <Skeleton className="h-3 w-48" /><Skeleton className="mt-8 h-12 w-3/4" /><Skeleton className="mt-12 aspect-[16/9] w-full max-w-3xl rounded-3xl" />
      </div>
    );
  }
  if (error || !item) return <NotFound title="Kegiatan tidak ditemukan" />;

  const past = isPast(item.date);
  const list = `/kegiatan/${item.type}`;
  const isLink = /^https:\/\//.test(item.location);

  return (
    <>
      <PageHeader
        title={item.title}
        titleForDocument={item.title.slice(0, 70)}
        lead={item.summary}
        crumbs={[{ label: 'Kegiatan' }, { label: TYPE[item.type], to: list }, { label: 'Detail' }]}
      />
      <article className="shell grid gap-12 pb-8 pt-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div className="min-w-0">
          {item.cover && <img src={item.cover} alt="" width="1280" height="720" decoding="async" className="aspect-[16/9] w-full rounded-3xl bg-mist object-cover" />}
          {item.content ? (
            <RichText doc={item.content} className={item.cover ? 'mt-10' : ''} />
          ) : (
            !item.gallery?.length && !item.cover && <p className="text-muted">Uraian lengkap belum ditambahkan.</p>
          )}
          {item.gallery?.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-2xl font-medium">Galeri foto</h2>
              <Gallery images={item.gallery} label={`Galeri foto ${item.title}`} />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Informasi kegiatan">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{TYPE[item.type]}</Badge>
            <Badge tone={past ? 'muted' : 'accent'}>{past ? 'Sudah berlalu' : 'Akan datang'}</Badge>
            {item.demo && <DemoBadge />}
          </div>
          <dl className="mt-6 space-y-5 text-[0.9375rem]">
            <div><dt className="flex items-center gap-2 text-sm text-muted"><CalendarBlank size={16} aria-hidden="true" /> Tanggal</dt><dd className="mt-1 font-medium">{formatDate(item.date)}</dd></div>
            <div><dt className="flex items-center gap-2 text-sm text-muted">{item.mode === 'daring' ? <VideoCamera size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />} Lokasi</dt><dd className="mt-1 font-medium">{isLink ? <a className="u-link text-brand" href={item.location} target="_blank" rel="noopener noreferrer">Buka tautan kegiatan</a> : item.location}</dd></div>
            <div><dt className="text-sm text-muted">Format</dt><dd className="mt-1 font-medium">{MODE[item.mode]}</dd></div>
          </dl>
          <Button to={list} variant="outline" size="sm" className="mt-8"><ArrowLeft size={16} aria-hidden="true" /> Semua {TYPE[item.type].toLowerCase()}</Button>
        </aside>
      </article>
    </>
  );
}
