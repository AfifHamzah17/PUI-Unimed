import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SpeedDial from './SpeedDial.jsx';
import InstallPrompt from '../pwa/InstallPrompt.jsx';
import UpdatePrompt from '../pwa/UpdatePrompt.jsx';
import { RouteSkeleton } from '../ui/Skeleton.jsx';

export default function Layout() {
  const { pathname, hash } = useLocation();
  const main = useRef(null);
  const first = useRef(true);

  // Pindah halaman: kembali ke atas dan pindahkan fokus ke konten (membantu pembaca layar dan keyboard).
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return (
    <>
      <a href="#konten" className="sr-only z-[90] rounded-full bg-accent px-5 py-3 font-medium text-deep focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Lompat ke konten
      </a>
      <Navbar />
      <main id="konten" ref={main} tabIndex={-1}>
        <Suspense fallback={<RouteSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <SpeedDial />
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
