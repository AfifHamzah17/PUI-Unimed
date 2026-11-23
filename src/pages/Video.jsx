import { useEffect, useRef, useState } from 'react';
import { ArrowsIn, ArrowsOut, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { videoPage } from '../data/content.js';
import { cn } from '../lib/cn.js';
import { driveId, drivePreview, driveStream } from '../lib/drive.js';

const LOAD_TIMEOUT_MS = 12000;

export default function Video() {
  const id = driveId(videoPage.driveUrl);
  // Urutan percobaan: berkas sendiri, lalu aliran langsung Drive. Setiap kegagalan pindah ke sumber berikutnya.
  const candidates = [...(videoPage.sources ?? []), ...(id ? [driveStream(id)] : [])];
  const ref = useRef(null);
  const box = useRef(null);
  const [full, setFull] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const src = candidates[attempt];
  const mode = src ? 'video' : id ? 'embed' : 'none'; // 'embed' = pemutar Drive, tidak bisa loop
  const next = () => { setReady(false); setAttempt((a) => a + 1); };

  // Sumber yang tak kunjung siap (mis. Drive menahan berkas besar) dilewati setelah 12 detik.
  useEffect(() => {
    if (mode !== 'video' || ready) return undefined;
    const t = setTimeout(next, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [mode, ready, attempt]);

  // Jaring pengaman loop: bila peramban tetap berhenti di akhir video, mulai lagi dari awal.
  const restart = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === box.current || Boolean(document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // Layar penuh pada pembungkus (tombol tetap terlihat). iPhone tak mendukung elemen biasa, jadi memakai layar penuh bawaan video.
  const toggleFull = () => {
    const el = box.current;
    const v = ref.current;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el?.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <>
      <PageHeader title={videoPage.title} lead={videoPage.lead} crumbs={[{ label: 'Video' }]} />
      <section className="shell pb-8 pt-10" aria-label="Pemutar video">
        {mode === 'none' ? (
          <p className="rounded-xl border border-line bg-surface p-8 text-muted">Alamat video belum valid. Isi <code className="font-mono text-sm">videoPage.sources</code> atau <code className="font-mono text-sm">videoPage.driveUrl</code> di <code className="font-mono text-sm">src/data/content.js</code>.</p>
        ) : mode === 'video' ? (
          <div ref={box} className={cn('relative mx-auto overflow-hidden bg-deep', full ? 'h-full w-full' : 'aspect-video max-w-5xl rounded-xl')}>
            <video
              ref={ref}
              key={src}
              src={src}
              poster={videoPage.poster}
              className="h-full w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setReady(true)}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onError={next}
              onEnded={restart}
              aria-label={videoPage.title}
            />
            {!ready && <div className="skel absolute inset-0 !rounded-none !bg-white/10" role="status" aria-label="Memuat video" />}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button type="button" onClick={togglePlay} aria-label={paused ? 'Putar video' : 'Jeda video'} className="grid h-11 w-11 place-items-center rounded-lg bg-deep/70 text-white backdrop-blur transition hover:bg-deep">
                {paused ? <Play size={20} weight="fill" aria-hidden="true" /> : <span className="flex gap-1" aria-hidden="true"><span className="h-4 w-1 rounded-sm bg-white" /><span className="h-4 w-1 rounded-sm bg-white" /></span>}
              </button>
              <button type="button" onClick={toggleFull} aria-label={full ? 'Keluar dari layar penuh' : 'Layar penuh'} className="grid h-11 w-11 place-items-center rounded-lg bg-deep/70 text-white backdrop-blur transition hover:bg-deep">
                {full ? <ArrowsIn size={20} aria-hidden="true" /> : <ArrowsOut size={20} aria-hidden="true" />}
              </button>
              <button type="button" onClick={toggleSound} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} className="grid h-11 w-11 place-items-center rounded-lg bg-deep/70 text-white backdrop-blur transition hover:bg-deep">
                {muted ? <SpeakerSlash size={20} aria-hidden="true" /> : <SpeakerHigh size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="aspect-video overflow-hidden rounded-xl bg-deep">
              <iframe src={drivePreview(id)} title={videoPage.title} allow="autoplay; fullscreen" allowFullScreen loading="lazy" className="h-full w-full border-0" />
            </div>
            <p className="mt-4 text-sm text-muted">
              Video diputar lewat pemutar Google Drive, yang tidak mendukung putar ulang otomatis. Untuk putar ulang otomatis, simpan berkas video di folder <code className="font-mono">public/video</code> dan ubah <code className="font-mono">driveUrl</code> menjadi <code className="font-mono">/video/nama-berkas.mp4</code>.
            </p>
          </div>
        )}
      </section>
    </>
  );
}