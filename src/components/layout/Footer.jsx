import { Link } from 'react-router-dom';
import { MapPin, EnvelopeSimple, Phone, DeviceMobile } from '@phosphor-icons/react';
import { nav, org } from '../../data/content.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import Weave from '../ui/Weave.jsx';
import Scramble from '../ui/Scramble.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Footer() {
  const { canInstall, install } = usePwaInstall();
  const groups = nav.filter((n) => n.children);

  return (
    <footer className="on-deep relative mt-32 overflow-hidden bg-deep text-white">
      <Weave height={10} />
      <div className="shell relative pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-4">
              <img src="/logo-96.webp" width="56" height="56" alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-full bg-white/95 p-1" />
              <div>
                <p className="text-sm text-white/60">{org.university}</p>
                <p className="font-display text-xl font-semibold">PUI Literasi dan Seni</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-white/65">
              Pusat unggulan yang meneliti bagaimana literasi dan seni membentuk cara belajar, dibina oleh {org.parent}.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{org.address}</li>
              {org.email && <li className="flex gap-3"><EnvelopeSimple size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /><a className="u-link" href={`mailto:${org.email}`}>{org.email}</a></li>}
              {org.phone && <li className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{org.phone}</li>}
            </ul>
          </div>

          <nav aria-label="Peta situs" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="text-sm font-medium text-white">{g.label}</p>
                <ul className="mt-4 space-y-2.5">
                  {g.children.map((c) => (
                    <li key={c.path}>
                      <Link to={c.path} className="u-link text-[0.875rem] leading-snug text-white/60 transition hover:text-white">{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="pointer-events-none mt-16 select-none font-display text-[clamp(3rem,13vw,11rem)] font-medium leading-[0.85] tracking-tight text-white/[0.06]" aria-hidden="true">
          Literasi dan Seni
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <Scramble text={`© ${new Date().getFullYear()} ${org.short}`} onHover duration={700} className="font-mono text-[0.8125rem]" />
          </p>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button type="button" onClick={install} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/50 hover:text-white">
                <DeviceMobile size={16} aria-hidden="true" /> Pasang aplikasi
              </button>
            )}
            <Link to="/admin" className="rounded-full px-4 py-2 transition hover:text-white">Kelola konten</Link>
            <ThemeToggle className="border border-white/15" />
          </div>
        </div>
      </div>
    </footer>
  );
}
