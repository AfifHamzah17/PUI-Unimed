import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CaretDown, X } from '@phosphor-icons/react';
import { nav, org } from '../../data/content.js';
import { cn } from '../../lib/cn.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Weave from '../ui/Weave.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/** Menu layar penuh untuk layar sempit. Isinya hanya dirender saat terbuka. */
export default function MobileMenu({ open, onClose }) {
  const [group, setGroup] = useState(null);

  return (
    <Modal open={open} onClose={onClose} variant="menu" bare title="Menu navigasi">
      <div className="on-deep flex h-full flex-col bg-deep text-white">
        <div className="flex items-center justify-between px-5 pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/" onClick={onClose} className="flex items-center gap-3">
            <img src="/logo-96.webp" width="38" height="38" alt="" className="h-[38px] w-[38px] rounded-full bg-white/95 p-0.5" />
            <span className="font-display text-base font-semibold">PUI Literasi dan Seni</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Tutup menu" className="grid h-11 w-11 place-items-center rounded-full border border-white/20">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu utama" className="min-h-0 flex-1 overflow-y-auto px-5 pt-8">
          <ul>
            {nav.map((item, i) => (
              <li key={item.label} className="border-b border-white/10" style={{ animation: `rise .6s cubic-bezier(.16,1,.3,1) ${i * 60}ms both` }}>
                {item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setGroup(group === i ? null : i)}
                      aria-expanded={group === i}
                      className="flex w-full items-center justify-between py-4 text-left font-display text-[1.75rem] leading-none"
                    >
                      {item.label}
                      <CaretDown size={20} aria-hidden="true" className={cn('transition-transform duration-300', group === i && 'rotate-180')} />
                    </button>
                    <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', group === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                      <ul className="overflow-hidden">
                        {item.children.map((c) => (
                          <li key={c.path}>
                            <NavLink
                              to={c.path}
                              onClick={onClose}
                              tabIndex={group === i ? 0 : -1}
                              className={({ isActive }) => cn('block py-2.5 pl-4 text-base', isActive ? 'text-accent' : 'text-white/75')}
                            >
                              {c.label}
                            </NavLink>
                          </li>
                        ))}
                        <li className="h-3" aria-hidden="true" />
                      </ul>
                    </div>
                  </>
                ) : (
                  <NavLink to={item.path} end onClick={onClose} className="block py-4 font-display text-[1.75rem] leading-none">
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-5 pb-safe pt-5">
          <Weave height={8} className="mb-5 opacity-80" />
          <div className="flex items-center justify-between gap-3">
            <Button to="/keanggotaan/pendaftaran" variant="gold" onClick={onClose}>Bergabung sebagai anggota</Button>
            <ThemeToggle className="border border-white/20" />
          </div>
          <p className="mt-4 text-xs text-white/45">{org.parent}</p>
        </div>
      </div>
    </Modal>
  );
}
