import { ArrowRight, DownloadSimple } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useRepoList } from '../../hooks/useRepo.js';
import { publikasiRepo } from '../../services/api.js';

const PARAMS = { type: 'jurnal', page: 1, pageSize: 1 };

export default function JournalSection() {
  const { data, loading } = useRepoList(publikasiRepo, PARAMS);
  const item = data?.items?.[0];

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="jurnal-title">
      <div className="grid items-center gap-12 rounded-[2rem] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16 lg:p-14">
        <div className="relative mx-auto w-full max-w-[20rem] lg:mx-0">
          {loading || !item?.cover ? (
            <Skeleton className="aspect-[420/544] w-full rounded-md" />
          ) : (
            <>
              <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-md bg-brand/15" aria-hidden="true" />
              <div className="absolute inset-0 -translate-x-2 translate-y-1.5 -rotate-1.5 rounded-md bg-accent/30" aria-hidden="true" />
              <img
                src={item.cover}
                width="420"
                height="544"
                alt={`Halaman pertama artikel: ${item.title}`}
                loading="lazy"
                decoding="async"
                className="relative w-full rounded-md bg-white shadow-lift"
              />
            </>
          )}
        </div>

        <div>
          <h2 id="jurnal-title" className="text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.1]">Baca jurnal langsung di browser</h2>
          {loading || !item ? (
            <div className="mt-6 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
          ) : (
            <>
              <p className="mt-6 font-display text-xl leading-snug text-ink">{item.title}</p>
              <p className="mt-3 text-sm text-muted">{item.authors.join(', ')}</p>
              <p className="mt-1 text-sm text-muted">{item.venue}, {item.volume} ({item.year})</p>
              <p className="mt-6 line-clamp-4 max-w-[60ch] leading-relaxed text-muted">{item.abstract}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to={`/publikasi/baca/${item.id}`}>
                  Buka pembaca <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </Button>
                {item.pdfUrl && (
                  <Button href={item.pdfUrl} download variant="outline"><DownloadSimple size={18} aria-hidden="true" /> Unduh PDF</Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
