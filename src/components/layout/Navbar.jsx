import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CaretDown } from '@phosphor-icons/react';
import { nav, org } from '../../data/content.js';
import { useScrolled } from '../../hooks/useScrolled.js';
import { cn } from '../../lib/cn.js';
import Button from '../ui/Button.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import MobileMenu from './MobileMenu.jsx';

const baseOf = (item) => item.children?.[0]?.path.split('/')[1];

export default function Navbar() {
  const { pathname } = useLocation();
  const [openIdx, setOpenIdx] = useState(null);
  const [menu, setMenu] = useState(false);
  const scrolled = useScrolled(8);
  const timer = useRef(0);

  useEffect(() => {
    setOpenIdx(null);
    setMenu(false);
  }, [pathname]);

  const hover = (i) => {
    clearTimeout(timer.current);
    setOpenIdx(i);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenIdx(null), 140);
  };

  const link = 'relative rounded-md px-3 py-2 text-[0.9375rem] transition-colors';
  const mark = "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent after:content-['']";

  return (
    <header
      className={cn('sticky top-0 z-40 border-b bg-paper/90 backdrop-blur-md transition-colors duration-300', scrolled ? 'border-line' : 'border-transparent')}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      onKeyDown={(e) => e.key === 'Escape' && setOpenIdx(null)}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-shell items-center justify-between gap-4 px-5 md:px-8">
        <Link to="/" className="flex shrink-0 items-center rounded-md" aria-label={`${org.short}, ke beranda`}>
          <img src="/celae-mark-96.webp" width="96" height="61" alt="" className="h-9 w-auto dark:brightness-0 dark:invert sm:hidden" />
          <img src="/celae-lockup-320.webp" width="320" height="98" alt="" className="hidden h-11 w-auto dark:brightness-0 dark:invert sm:block" />
        </Link>

        <nav aria-label="Menu utama" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((item, i) => {
              const groupActive = item.children && pathname.startsWith(`/${baseOf(item)}`);
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <NavLink to={item.path} end className={({ isActive }) => cn(link, isActive ? `text-ink ${mark}` : 'text-muted hover:text-ink')}>
                      {item.label}
                    </NavLink>
                  </li>
                );
              }
              const open = openIdx === i;
              return (
                <li key={item.label} className="relative" onMouseEnter={() => hover(i)} onMouseLeave={leave}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className={cn(link, 'flex items-center gap-1', groupActive ? `text-ink ${mark}` : open ? 'text-ink' : 'text-muted hover:text-ink')}
                  >
                    {item.label}
                    <CaretDown size={12} weight="bold" aria-hidden="true" className={cn('transition-transform duration-300', open && 'rotate-180')} />
                  </button>
                  <div
                    className={cn(
                      'absolute left-1/2 top-full w-[21rem] -translate-x-1/2 pt-2 transition duration-200 ease-out',
                      open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-1 opacity-0'
                    )}
                  >
                    <ul className="rounded-xl border border-line bg-surface p-1.5 shadow-lift">
                      {item.children.map((c) => (
                        <li key={c.path}>
                          <NavLink
                            to={c.path}
                            end
                            tabIndex={open ? 0 : -1}
                            className={({ isActive }) => cn('block rounded-lg px-3.5 py-2.5 transition hover:bg-mist', isActive && 'bg-mist')}
                          >
                            <span className="block text-sm font-medium text-ink">{c.label}</span>
                            <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{c.desc}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:grid" />
          <Button to="/keanggotaan/pendaftaran" size="sm" className="hidden rounded-lg sm:inline-flex">
            Bergabung
          </Button>
          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Buka menu"
            aria-expanded={menu}
            className="grid h-10 w-10 place-items-center rounded-lg transition hover:bg-mist lg:hidden"
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className="absolute left-0 top-0 h-0.5 w-5 rounded bg-ink" />
              <span className="absolute left-0 top-[5px] h-0.5 w-3.5 rounded bg-ink" />
              <span className="absolute left-0 top-[10px] h-0.5 w-5 rounded bg-ink" />
            </span>
          </button>
        </div>
      </div>

      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </header>
  );
}
