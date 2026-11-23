import { Link } from 'react-router-dom';
import { DeviceMobile, EnvelopeSimple, FacebookLogo, InstagramLogo, MapPin, Phone, TiktokLogo } from '@phosphor-icons/react';
import { nav, org, social } from '../../data/content.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { cn } from '../../lib/cn.js';
import Weave from '../ui/Weave.jsx';
import Scramble from '../ui/Scramble.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const ICONS = { facebook: FacebookLogo, instagram: InstagramLogo, tiktok: TiktokLogo };

function SocialLinks() {
  return (
    <ul className="flex items-center gap-2" aria-label="Media sosial">
      {social.map(({ key, label, href }) => {
        const Icon = ICONS[key];
        const cls = 'grid h-11 w-11 place-items-center rounded-lg border border-white/20 transition';
        return (
          <li key={key}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} PUI Literasi dan Seni`} className={cn(cls, 'text-white/85 hover:border-accent hover:bg-accent hover:text-deep')}>
                <Icon size={22} weight="fill" aria-hidden="true" />
              </a>
            ) : (
              <span role="img" aria-label={`${label}, belum tersedia`} title={`${label}: segera hadir`} className={cn(cls, 'cursor-not-allowed text-white/30')}>
                <Icon size={22} weight="fill" aria-hidden="true" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Footer() {
  const { canInstall, install } = usePwaInstall();
  const groups = nav.filter((n) => n.children);

  return (
    <footer className="on-deep relative mt-28 overflow-hidden bg-deep text-white">
      <Weave height={10} />
      <div className="shell relative pt-16 pb-10">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <img src="/celae-lockup-640.webp" width="640" height="195" alt="Centre of Excellence for Literacy and Art in Education, PUI Literasi dan Seni dalam Pendidikan" loading="lazy" decoding="async" className="h-auto w-64 brightness-0 invert" />
            <ul className="mt-8 space-y-3 text-sm text-white/75">
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{org.address}</li>
              {org.email && <li className="flex gap-3"><EnvelopeSimple size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /><a className="u-link" href={`mailto:${org.email}`}>{org.email}</a></li>}
              {org.phone && <li className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{org.phone}</li>}
            </ul>
            <div className="mt-8"><SocialLinks /></div>
            <div className="mt-10 flex items-center gap-3 text-[0.8125rem] leading-snug text-white/55">
              <img src="/logo-96.webp" width="40" height="40" alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-full bg-white/95 p-0.5" />
              <span>Dibina oleh {org.parent}, {org.university}.</span>
            </div>
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

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <Scramble text={`© ${new Date().getFullYear()} ${org.short}`} onHover duration={700} className="font-mono text-[0.8125rem]" />
          </p>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button type="button" onClick={install} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/50 hover:text-white">
                <DeviceMobile size={16} aria-hidden="true" /> Pasang aplikasi
              </button>
            )}
            <Link to="/admin" className="rounded-lg px-4 py-2 transition hover:text-white">Kelola konten</Link>
            <ThemeToggle tone="light" className="border border-white/15" />
          </div>
        </div>
      </div>
    </footer>
  );
}
