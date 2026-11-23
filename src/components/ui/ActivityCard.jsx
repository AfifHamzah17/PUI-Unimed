import { Link } from 'react-router-dom';
import { Buildings, CalendarBlank, MapPin, VideoCamera } from '@phosphor-icons/react';
import Img from './Img.jsx';
import { DemoBadge } from './Badge.jsx';
import { KEGIATAN_TYPE, MODE } from '../../data/labels.js';
import { formatDate, isPast } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

// Tata letak asimetris: lebar kolom, rasio foto, dan geseran vertikal berganti per posisi.
// Di bawah lg semuanya satu kolom, jadi tidak ada geser horizontal di ponsel.
const SHAPES = [
  { col: 'lg:col-span-7', ratio: 'aspect-[4/3]', sizes: '(min-width:1024px) 58vw, 100vw' },
  { col: 'lg:col-span-5 lg:mt-20', ratio: 'aspect-[4/5]', sizes: '(min-width:1024px) 42vw, 100vw' },
  { col: 'lg:col-span-5', ratio: 'aspect-[5/4]', sizes: '(min-width:1024px) 42vw, 100vw' },
  { col: 'lg:col-span-7 lg:mt-12', ratio: 'aspect-[16/9]', sizes: '(min-width:1024px) 58vw, 100vw' },
];
export const shapeOf = (i) => SHAPES[i % SHAPES.length];

/** Kartu kegiatan. `index` menentukan bentuknya di grid 12 kolom; tanpa `index` kartu mengisi selebar kolomnya. */
export default function ActivityCard({ item, index = 0, flat = false, headingAs: Heading = 'h3' }) {
  const shape = shapeOf(index);
  const upcoming = !isPast(item.date);
  const Place = item.mode === 'daring' ? VideoCamera : MapPin;
  return (
    <li className={cn(!flat && shape.col)}>
      <Link to={`/kegiatan/${item.type}/${item.id}`} className="group block">
        <div className={cn('relative overflow-hidden rounded-lg bg-mist', shape.ratio)}>
          {item.cover ? (
            <Img src={item.cover} alt="" width="960" height="720" sizes={shape.sizes} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-brand-soft text-brand" aria-hidden="true"><Buildings size={44} weight="light" /></div>
          )}
          <span className="absolute left-3 top-3 rounded bg-paper px-2.5 py-1 font-mono text-xs tabular text-ink">{formatDate(item.date)}</span>
          {upcoming && <span className="absolute right-3 top-3 rounded bg-accent px-2.5 py-1 text-xs font-medium text-deep">Akan datang</span>}
        </div>
        <div className="mt-4 max-w-[52ch]">
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>{KEGIATAN_TYPE[item.type] ?? item.type}</span>
            <span className="inline-flex items-center gap-1.5"><Place size={15} aria-hidden="true" />{MODE[item.mode] ?? item.mode}</span>
            {item.demo && <DemoBadge />}
          </p>
          <Heading className="mt-2 text-[1.375rem] leading-snug transition-colors group-hover:text-brand">
            <span className="u-link">{item.title}</span>
          </Heading>
          {item.summary && <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">{item.summary}</p>}
          <p className="mt-3 inline-flex items-start gap-1.5 text-sm text-muted"><CalendarBlank size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="line-clamp-1">{item.location}</span></p>
        </div>
      </Link>
    </li>
  );
}

export function ActivityCardSkeleton({ index = 0 }) {
  const shape = shapeOf(index);
  return (
    <div className={cn(shape.col)} aria-hidden="true">
      <div className={cn('skel w-full rounded-lg', shape.ratio)} />
      <div className="skel mt-4 h-4 w-32" />
      <div className="skel mt-3 h-6 w-4/5" />
      <div className="skel mt-3 h-3 w-full" />
    </div>
  );
}
