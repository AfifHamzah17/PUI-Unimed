import { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import NotFound from './NotFound.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { DemoBadge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useRepoItem } from '../hooks/useRepo.js';
import { publikasiRepo } from '../services/api.js';

// react-pdf dan worker pdf.js hanya diunduh saat halaman baca dibuka.
const PdfReader = lazy(() => import('../components/pdf/PdfReader.jsx'));

const typeLabel = { jurnal: 'Jurnal', penelitian: 'Penelitian', pengabdian: 'Pengabdian kepada Masyarakat' };

export default function BacaPublikasi() {
  const { id } = useParams();
  const { item, loading } = useRepoItem(publikasiRepo, id);

  if (loading) {
    return (
      <div className="shell pt-40 pb-24" role="status" aria-label="Memuat publikasi">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-8 h-12 w-3/4" />
        <Skeleton className="mt-12 h-[560px] w-full rounded-3xl" />
      </div>
    );
  }
  if (!item) return <NotFound title="Publikasi tidak ditemukan" />;

  const listPath = `/publikasi/${item.type}`;
  return (
    <>
      <PageHeader
        title={item.title}
        titleForDocument={item.title.slice(0, 70)}
        crumbs={[{ label: 'Publikasi Ilmiah' }, { label: typeLabel[item.type], to: listPath }, { label: 'Baca' }]}
      />
      <section className="shell grid gap-10 pb-8 pt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0">
          {item.pdfUrl ? (
            <Suspense fallback={<Skeleton className="h-[640px] w-full rounded-3xl" />}>
              <PdfReader src={item.pdfUrl} title={`${item.venue}, ${item.volume}`} />
            </Suspense>
          ) : (
            <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
              <p className="font-medium">Berkas PDF belum tersedia</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Ringkasan dan data publikasi ada di samping. Berkas akan ditautkan setelah diunggah.</p>
              <Button to={listPath} variant="outline" className="mt-6">Kembali ke daftar</Button>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Informasi publikasi">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{typeLabel[item.type]}</Badge>
            <Badge tone="muted">{item.year}</Badge>
            {item.demo && <DemoBadge />}
          </div>
          <dl className="mt-6 space-y-5 text-[0.9375rem]">
            <div><dt className="text-sm text-muted">Penulis</dt><dd className="mt-1 leading-relaxed">{item.authors.join(', ')}</dd></div>
            {item.venue && <div><dt className="text-sm text-muted">Terbit di</dt><dd className="mt-1">{item.venue}{item.volume ? `, ${item.volume}` : ''}</dd></div>}
            {item.abstract && <div><dt className="text-sm text-muted">Ringkasan</dt><dd className="mt-1 leading-relaxed">{item.abstract}</dd></div>}
            {item.keywords?.length > 0 && (
              <div>
                <dt className="text-sm text-muted">Kata kunci</dt>
                <dd className="mt-2 flex flex-wrap gap-2">{item.keywords.map((k) => <span key={k} className="rounded-full border border-line px-3 py-1 text-[0.8125rem] text-muted">{k}</span>)}</dd>
              </div>
            )}
          </dl>
          <Button to={listPath} variant="outline" size="sm" className="mt-8">Semua {typeLabel[item.type].toLowerCase()}</Button>
        </aside>
      </section>
    </>
  );
}
