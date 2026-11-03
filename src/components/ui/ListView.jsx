import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, WarningCircle, X } from '@phosphor-icons/react';
import { useRepoList } from '../../hooks/useRepo.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import Pagination from './Pagination.jsx';
import EmptyState from './EmptyState.jsx';
import Button from './Button.jsx';

/**
 * Daftar publik: pencarian (debounce 300 ms), paginasi, skeleton, keadaan kosong dan galat.
 * Dipakai oleh halaman Publikasi, Kegiatan, dan Kerjasama.
 */
export default function ListView({
  repo, params = {}, pageSize = 6, placeholder = 'Cari', renderItem, renderSkeleton, skeletonCount = 3,
  wrapper = 'ul', wrapperClass, empty, searchable = true, resultNoun = 'entri',
}) {
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const top = useRef(null);
  const paramKey = JSON.stringify(params);

  useEffect(() => setPage(1), [dq, paramKey]);

  const { data, loading, error, reload } = useRepoList(repo, { ...params, q: dq, page, pageSize });

  const changePage = (n) => {
    setPage(n);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const Wrapper = wrapper;
  const isEmpty = data && data.items.length === 0;

  return (
    <div ref={top} className="scroll-mt-28">
      {searchable && (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="cari" className="sr-only">{placeholder}</label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="cari"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-11 text-[0.9375rem] placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {data ? `${data.total} ${resultNoun}${dq ? ` untuk "${dq}"` : ''}` : '\u00A0'}
          </p>
        </div>
      )}

      {error ? (
        <EmptyState icon={WarningCircle} title="Data belum bisa dimuat" action={<Button variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error.message}
        </EmptyState>
      ) : !data ? (
        <Wrapper className={wrapperClass} aria-busy="true">
          {Array.from({ length: skeletonCount }, (_, i) => <li key={i} className="contents">{renderSkeleton(i)}</li>)}
        </Wrapper>
      ) : isEmpty ? (
        dq ? (
          <EmptyState icon={MagnifyingGlass} title="Tidak ada hasil" action={<Button variant="outline" onClick={() => setQ('')}>Hapus pencarian</Button>}>
            Tidak ada {resultNoun} yang cocok dengan "{dq}". Coba kata kunci lain.
          </EmptyState>
        ) : (
          empty
        )
      ) : (
        <>
          <Wrapper className={wrapperClass} aria-busy={loading || undefined} style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
            {data.items.map((it) => renderItem(it))}
          </Wrapper>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} className="mt-12" />
        </>
      )}
    </div>
  );
}
