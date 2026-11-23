import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import Modal from './Modal.jsx';
import Img from './Img.jsx';
import { fullSize } from '../../lib/img.js';

/** Galeri foto: kisi gambar lazy-load, klik membuka lightbox dengan navigasi panah/keyboard. */
export default function Gallery({ images, label = 'Galeri foto' }) {
  const [open, setOpen] = useState(null);
  const n = images.length;

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % n);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, n]);

  if (!n) return null;
  const nav = 'grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20';

  return (
    <section aria-label={label}>
      {/* Susunan kolom (masonry): foto tegak dan mendatar saling mengisi tanpa dipotong paksa ke satu rasio. */}
      <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-3">
        {images.map((src, i) => (
          <li key={`${src}-${i}`} className="break-inside-avoid">
            <button type="button" onClick={() => setOpen(i)} aria-label={`Perbesar foto ${i + 1} dari ${n}`} className="group block w-full overflow-hidden rounded-lg bg-mist">
              <Img src={src} alt={`Foto ${i + 1}`} sizes="(min-width:640px) 33vw, 50vw" className="block h-auto w-full transition duration-500 ease-out group-hover:scale-[1.03]" />
            </button>
          </li>
        ))}
      </ul>

      <Modal open={open !== null} onClose={() => setOpen(null)} variant="menu" bare title={label}>
        {open !== null && (
          <div className="on-deep flex h-full w-full flex-col bg-deep/95 text-white" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
            <div className="flex items-center justify-between px-5 py-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <p className="font-mono text-sm tabular" aria-live="polite">{open + 1} / {n}</p>
              <button type="button" onClick={() => setOpen(null)} aria-label="Tutup galeri" className={nav}><X size={22} aria-hidden="true" /></button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
              {n > 1 && <button type="button" onClick={() => setOpen((open - 1 + n) % n)} aria-label="Foto sebelumnya" className={`${nav} absolute left-3 z-10 sm:left-6`}><CaretLeft size={22} aria-hidden="true" /></button>}
              <img src={fullSize(images[open])} alt={`Foto ${open + 1}`} decoding="async" className="max-h-full max-w-full rounded-lg object-contain" />
              {n > 1 && <button type="button" onClick={() => setOpen((open + 1) % n)} aria-label="Foto berikutnya" className={`${nav} absolute right-3 z-10 sm:right-6`}><CaretRight size={22} aria-hidden="true" /></button>}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
