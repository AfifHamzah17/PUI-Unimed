import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowsClockwise, CheckCircle } from '@phosphor-icons/react';
import Button from '../ui/Button.jsx';

/** Memberi tahu saat versi baru siap atau saat aplikasi sudah bisa dipakai offline. */
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Cek versi baru tiap jam selama tab terbuka.
      if (reg) setInterval(() => reg.update(), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!offlineReady) return undefined;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div role="status" className="fixed bottom-24 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-rise items-center gap-4 rounded-2xl bg-deep px-5 py-4 text-sm text-white shadow-lift sm:bottom-6">
      {needRefresh ? <ArrowsClockwise size={22} className="shrink-0 text-accent" aria-hidden="true" /> : <CheckCircle size={22} className="shrink-0 text-accent" aria-hidden="true" />}
      <p className="flex-1">{needRefresh ? 'Versi baru tersedia.' : 'Siap dipakai offline, termasuk pembaca PDF.'}</p>
      {needRefresh && (
        <>
          <Button size="sm" variant="gold" onClick={() => updateServiceWorker(true)}>Muat ulang</Button>
          <button type="button" className="text-white/60 hover:text-white" onClick={() => setNeedRefresh(false)}>Nanti</button>
        </>
      )}
    </div>
  );
}
