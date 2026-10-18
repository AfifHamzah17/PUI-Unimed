import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CaretDown } from '@phosphor-icons/react';
import { nav, org } from '../../data/content.js';
import { cn } from '../../lib/cn.js';
import Button from '../ui/Button.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import MobileMenu from './MobileMenu.jsx';

const baseOf = (item) => item.children?.[0]?.path.split('/')[1];

export default function Navbar() {
  const { pathname } = useLocation();
  const [openIdx, setOpenIdx] = useState(null);
  const [menu, setMenu] = useState(false);
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

  return (
    <header
      className="on-deep fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      onKeyDown={(e) => e.key === 'Escape' && setOpenIdx(null)}
    >
      <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-3 rounded-full border border-white/10 bg-deep/85 pl-2.5 pr-2 text-white shadow-lift backdrop-blur-xl">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-full pr-2" aria-label={`${org.short}, ke beranda`}>
          <img src="/logo-96.webp" width="38" height="38" alt="" className="h-[38px] w-[38px] shrink-0 rounded-full bg-white/95 p-0.5" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.6875rem] text-white/60">Universitas Negeri Medan</span>
            <span className="block truncate font-display text-[0.9375rem] font-semibold sm:text-base">PUI Literasi dan Seni</span>
          </span>
        </Link>

        <nav aria-label="Menu utama" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((item, i) => {
              const groupActive = item.children && pathname.startsWith(`/${baseOf(item)}`);
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        cn('rounded-full px-3.5 py-2 text-sm transition', isActive ? 'bg-white/12 text-white' : 'text-white/75 hover:text-white')
                      }
                    >
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
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition',
                      groupActive || open ? 'bg-white/12 text-white' : 'text-white/75 hover:text-white'
                    )}
                  >
                    {item.label}
                    <CaretDown size={12} weight="bold" aria-hidden="true" className={cn('transition-transform duration-300', open && 'rotate-180')} />
                  </button>
                  <div
                    className={cn(
                      'absolute left-1/2 top-full w-[22rem] -translate-x-1/2 pt-4 transition duration-300 ease-out',
                      open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'
                    )}
                  >
                    <ul className="rounded-3xl border border-white/10 bg-deep-2 p-2 shadow-lift">
                      {item.children.map((c, ci) => (
                        <li key={c.path}>
                          <NavLink
                            to={c.path}
                            tabIndex={open ? 0 : -1}
                            className={({ isActive }) =>
                              cn('block rounded-2xl px-4 py-3 transition hover:bg-white/8', isActive && 'bg-white/8')
                            }
                            style={open ? { animation: `rise .5s cubic-bezier(.16,1,.3,1) ${ci * 45}ms both` } : undefined}
                          >
                            <span className="block text-sm font-medium text-white">{c.label}</span>
                            <span className="mt-0.5 block text-[0.8125rem] leading-snug text-white/55">{c.desc}</span>
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
          <Button to="/keanggotaan/pendaftaran" variant="gold" size="sm" className="hidden sm:inline-flex">
            Bergabung
          </Button>
          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Buka menu"
            aria-expanded={menu}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10 lg:hidden"
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className="absolute left-0 top-0 h-0.5 w-5 rounded bg-white" />
              <span className="absolute left-0 top-[5px] h-0.5 w-3.5 rounded bg-white" />
              <span className="absolute left-0 top-[10px] h-0.5 w-5 rounded bg-white" />
            </span>
          </button>
        </div>
      </div>

      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </header>
  );
}
