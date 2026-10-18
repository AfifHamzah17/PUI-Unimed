import { useEffect, useState } from 'react';
import { DeviceMobile, ShareNetwork, X } from '@phosphor-icons/react';
import { pwa } from '../../lib/pwa.js';
import { safeStorage } from '../../lib/safeStorage.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import Button from '../ui/Button.jsx';

const KEY = 'pui:install-dismissed';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const DELAY_MS = 8000;

/** Ajakan memasang PWA. Muncul sekali setelah jeda, bisa ditunda 14 hari. iOS mendapat petunjuk manual. */
export default function InstallPrompt() {
  const { canInstall, install } = usePwaInstall();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ios = pwa.isIos();

  useEffect(() => {
    const last = Number(safeStorage.get(KEY, 0));
    if (last && Date.now() - last < SNOOZE_MS) return undefined;
    if (pwa.isStandalone()) return undefined;
    const t = setTimeout(() => setReady(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    safeStorage.set(KEY, String(Date.now()));
    setHidden(true);
  };

  const show = ready && !hidden && (canInstall || ios);
  if (!show) return null;

  return (
    <section
      aria-label="Pasang aplikasi"
      className="fixed inset-x-4 bottom-24 z-[70] animate-rise rounded-3xl border border-line bg-surface p-5 shadow-lift sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[24rem]"
    >
      <button type="button" onClick={dismiss} aria-label="Tutup" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5">
        <X size={16} aria-hidden="true" />
      </button>
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand">
          <DeviceMobile size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-sans text-base font-semibold">Pasang di perangkat Anda</h2>
          {canInstall ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">Buka lebih cepat dari layar utama dan baca jurnal yang sudah dibuka tanpa internet.</p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Ketuk <ShareNetwork size={14} className="inline -translate-y-px" aria-label="tombol Bagikan" /> lalu pilih "Tambah ke Layar Utama".
            </p>
          )}
        </div>
      </div>
      {canInstall && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={async () => { await install(); setHidden(true); }}>Pasang</Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>Nanti saja</Button>
        </div>
      )}
    </section>
  );
}
