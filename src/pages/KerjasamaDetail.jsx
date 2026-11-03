import { useParams } from 'react-router-dom';
import { ArrowLeft, Globe } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import NotFound from './NotFound.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import Gallery from '../components/ui/Gallery.jsx';
import RichText from '../components/ui/RichText.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useRepoItem } from '../hooks/useRepo.js';
import { kerjasamaRepo } from '../services/api.js';
import { formatDate } from '../lib/format.js';

const SCOPE = { 'dalam-negeri': 'Kerjasama Dalam Negeri', 'luar-negeri': 'Kerjasama Luar Negeri' };

export default function KerjasamaDetail() {
  const { id } = useParams();
  const { item, loading, error } = useRepoItem(kerjasamaRepo, id);

  if (loading) {
    return (
      <div className="shell pb-24 pt-40" role="status" aria-label="Memuat kerja sama">
        <Skeleton className="h-3 w-48" /><Skeleton className="mt-8 h-12 w-2/3" /><Skeleton className="mt-12 aspect-[16/9] w-full max-w-3xl rounded-3xl" />
      </div>
    );
  }
  if (error || !item) return <NotFound title="Kerja sama tidak ditemukan" />;

  const list = `/kerjasama/${item.scope}`;
  return (
    <>
      <PageHeader
        title={item.partner}
        titleForDocument={`${item.partner} | Kerjasama`}
        lead={item.summary}
        crumbs={[{ label: 'Kerjasama' }, { label: SCOPE[item.scope], to: list }, { label: item.partner }]}
      />
      <article className="shell grid gap-12 pb-8 pt-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div className="min-w-0">
          {item.cover && <img src={item.cover} alt={`Foto atau logo ${item.partner}`} width="1280" height="720" decoding="async" className="aspect-[16/9] w-full rounded-3xl bg-mist object-cover" />}
          {item.content ? <RichText doc={item.content} className={item.cover ? 'mt-10' : ''} /> : !item.gallery?.length && !item.cover && <p className="text-muted">Uraian lengkap belum ditambahkan.</p>}
          {item.gallery?.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-2xl font-medium">Dokumentasi</h2>
              <Gallery images={item.gallery} label={`Dokumentasi kerja sama dengan ${item.partner}`} />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Informasi kerja sama">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{SCOPE[item.scope]}</Badge>
            {item.kind && <Badge tone="muted">{item.kind}</Badge>}
            {item.demo && <DemoBadge />}
          </div>
          <dl className="mt-6 space-y-5 text-[0.9375rem]">
            <div><dt className="text-sm text-muted">Mitra</dt><dd className="mt-1 font-medium">{item.partner}</dd></div>
            {item.since && <div><dt className="text-sm text-muted">Mulai kerja sama</dt><dd className="mt-1 font-medium">{formatDate(item.since)}</dd></div>}
            {item.website && <div><dt className="text-sm text-muted">Situs mitra</dt><dd className="mt-1"><a className="u-link inline-flex items-center gap-2 font-medium text-brand" href={item.website} target="_blank" rel="noopener noreferrer"><Globe size={16} aria-hidden="true" /> Kunjungi situs</a></dd></div>}
          </dl>
          <Button to={list} variant="outline" size="sm" className="mt-8"><ArrowLeft size={16} aria-hidden="true" /> Semua mitra</Button>
        </aside>
      </article>
    </>
  );
}
