import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowsIn, ArrowsOut, CaretLeft, CaretRight, DownloadSimple, WarningCircle } from '@phosphor-icons/react';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Skeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';

// Worker pdf.js ikut di-bundle Vite dari node_modules (self-hosted, versi selalu cocok dengan react-pdf)
// dan di-precache service worker, sehingga pembaca tetap jalan offline.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

// Objek opsi harus stabil agar <Document> tidak memuat ulang berkas tiap render.
const OPTIONS = {};
const SWIPE_PX = 60;

export default function PdfReader({ src, title }) {
  const reader = useRef(null);
  const viewport = useRef(null);
  const swipe = useRef(null);
  const width = useElementWidth(viewport);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [rendering, setRendering] = useState(true);
  const [ratio, setRatio] = useState(1.294); // tinggi/lebar, diperbarui dari halaman asli
  const [full, setFull] = useState(false);

  // Slider boleh bergerak bebas; halaman baru dirender setelah jeda singkat (debounce).
  const shown = useDebouncedValue(page, 140);
  const pageWidth = Math.min(Math.max(width - 24, 240), 920);
  const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);

  const go = useCallback((n) => setPage((p) => Math.min(Math.max(typeof n === 'function' ? n(p) : n, 1), Math.max(numPages, 1))), [numPages]);

  useEffect(() => {
    setRendering(true);
  }, [shown]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === reader.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else reader.current?.requestFullscreen?.();
  };

  const onKeyDown = (e) => {
    if (e.target.tagName === 'INPUT') return; // biarkan slider memakai tombol panahnya sendiri
    const map = { ArrowRight: () => go((p) => p + 1), PageDown: () => go((p) => p + 1), ArrowLeft: () => go((p) => p - 1), PageUp: () => go((p) => p - 1), Home: () => go(1), End: () => go(numPages) };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };

  // Geser kiri/kanan di layar sentuh untuk pindah halaman.
  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go((p) => p + (dx < 0 ? 1 : -1));
  };

  const pct = numPages > 1 ? ((page - 1) / (numPages - 1)) * 100 : 0;
  const btn = 'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-35';

  return (
    <div
      ref={reader}
      onKeyDown={onKeyDown}
      className={cn('flex flex-col rounded-3xl border border-line bg-surface', full && 'h-full rounded-none border-0 bg-paper')}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <p className="min-w-0 truncate text-sm text-muted">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <a href={src} download className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-ink transition hover:bg-ink/5">
            <DownloadSimple size={17} aria-hidden="true" /> <span className="hidden sm:inline">Unduh</span>
          </a>
          <button type="button" onClick={toggleFull} className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-ink/5" aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'}>
            {full ? <ArrowsIn size={18} aria-hidden="true" /> : <ArrowsOut size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        ref={viewport}
        tabIndex={0}
        aria-label={`Dokumen ${title}. Gunakan panah kiri dan kanan untuk berpindah halaman.`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={cn('relative flex-1 touch-pan-y overflow-auto bg-mist p-3 sm:p-6', full && 'min-h-0')}
      >
        <div className={cn('absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-brand transition-opacity', rendering && status === 'ready' ? 'animate-pulse opacity-100' : 'opacity-0')} />

        {status === 'error' ? (
          <div className="mx-auto flex max-w-sm flex-col items-center py-20 text-center">
            <WarningCircle size={36} className="text-danger" aria-hidden="true" />
            <p className="mt-4 font-medium">Dokumen belum bisa dimuat</p>
            <p className="mt-1 text-sm text-muted">Periksa koneksi Anda. Dokumen yang pernah dibuka bisa dibaca lagi tanpa internet.</p>
          </div>
        ) : (
          <Document
            file={src}
            options={OPTIONS}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setStatus('ready');
            }}
            onLoadError={() => setStatus('error')}
            loading={<Skeleton className="mx-auto w-full max-w-[920px]" style={{ height: 520 }} />}
            error={null}
            className="mx-auto"
          >
            {status === 'ready' && width > 0 && (
              <div className="mx-auto overflow-hidden rounded-md bg-white shadow-lift" style={{ width: pageWidth, minHeight: pageWidth * ratio }}>
                <Page
                  pageNumber={shown}
                  width={pageWidth}
                  devicePixelRatio={dpr}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={(p) => setRatio(p.originalHeight / p.originalWidth)}
                  onRenderSuccess={() => setRendering(false)}
                  loading={<Skeleton className="rounded-none" style={{ width: pageWidth, height: pageWidth * ratio }} />}
                />
              </div>
            )}
          </Document>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-3 py-3 sm:gap-4 sm:px-5">
        <button type="button" className={btn} onClick={() => go((p) => p - 1)} disabled={status !== 'ready' || page <= 1} aria-label="Halaman sebelumnya">
          <CaretLeft size={18} aria-hidden="true" />
        </button>
        <input
          type="range"
          className="pdf-range min-w-0 flex-1"
          min={1}
          max={Math.max(numPages, 1)}
          value={page}
          disabled={status !== 'ready'}
          onChange={(e) => go(Number(e.target.value))}
          style={{ '--p': `${pct}%` }}
          aria-label="Pilih halaman"
          aria-valuetext={`Halaman ${page} dari ${numPages}`}
        />
        <button type="button" className={btn} onClick={() => go((p) => p + 1)} disabled={status !== 'ready' || page >= numPages} aria-label="Halaman berikutnya">
          <CaretRight size={18} aria-hidden="true" />
        </button>
        <p className="w-[4.75rem] shrink-0 text-right font-mono text-sm tabular" aria-live="polite">
          <span className="font-semibold text-ink">{status === 'ready' ? page : '–'}</span>
          <span className="text-muted"> / {status === 'ready' ? numPages : '–'}</span>
        </p>
      </div>
    </div>
  );
}
