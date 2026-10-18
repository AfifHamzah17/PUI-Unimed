import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, DeviceMobile, Moon, Plus, Sun, UserPlus } from '@phosphor-icons/react';
import { useScrolled } from '../../hooks/useScrolled.js';
import { useTheme } from '../../hooks/useTheme.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { cn } from '../../lib/cn.js';

/** FAB dengan aksi yang mekar ke atas (speed dial). Menutup saat klik di luar atau tekan Esc. */
export default function SpeedDial() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const scrolled = useScrolled(500);
  const { dark, toggle } = useTheme();
  const { canInstall, install } = usePwaInstall();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const actions = [
    scrolled && { key: 'top', label: 'Ke atas', icon: ArrowUp, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { key: 'theme', label: dark ? 'Tema terang' : 'Tema gelap', icon: dark ? Sun : Moon, onClick: toggle },
    canInstall && { key: 'install', label: 'Pasang aplikasi', icon: DeviceMobile, onClick: install },
    { key: 'join', label: 'Bergabung', icon: UserPlus, to: '/keanggotaan/pendaftaran' },
  ].filter(Boolean);

  const item = 'grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-soft ring-1 ring-line transition hover:bg-brand hover:text-on-brand';

  return (
    <div ref={root} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3" style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
      <ul id="speed-dial-actions" className="flex flex-col items-end gap-3" aria-label="Aksi cepat">
        {actions.map((a, i) => {
          const Icon = a.icon;
          const inner = (
            <>
              <span className="rounded-full bg-deep px-3 py-1.5 text-xs font-medium text-white shadow-soft">{a.label}</span>
              <span className={item}><Icon size={20} aria-hidden="true" /></span>
            </>
          );
          const cls = 'flex items-center gap-3';
          return (
            <li
              key={a.key}
              className={cn('transition duration-300 ease-out', open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}
              style={{ transitionDelay: open ? `${(actions.length - 1 - i) * 40}ms` : '0ms' }}
            >
              {a.to ? (
                <Link to={a.to} className={cls} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{inner}</Link>
              ) : (
                <button type="button" className={cls} tabIndex={open ? 0 : -1} onClick={() => { a.onClick(); if (a.key !== 'theme') setOpen(false); }}>{inner}</button>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="speed-dial-actions"
        aria-label={open ? 'Tutup aksi cepat' : 'Buka aksi cepat'}
        className="grid h-14 w-14 place-items-center rounded-full bg-accent text-deep shadow-lift transition active:scale-95 hover:brightness-105"
      >
        <Plus size={26} weight="bold" aria-hidden="true" className={cn('transition-transform duration-300 ease-out', open && 'rotate-[135deg]')} />
      </button>
    </div>
  );
}
