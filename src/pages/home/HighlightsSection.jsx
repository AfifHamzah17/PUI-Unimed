import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, CalendarBlank, Handshake, MapPin } from '@phosphor-icons/react';
import Carousel from '../../components/ui/Carousel.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import Button from '../../components/ui/Button.jsx';
import { DemoBadge } from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { sorotanApi } from '../../services/api.js';
import { formatDate } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

const SLIDE = 'snap-start shrink-0 basis-[84%] sm:basis-[24rem]';
const LABEL = { workshop: 'Workshop', seminar: 'Seminar', jurnal: 'Jurnal', penelitian: 'Penelitian', pengabdian: 'Pengabdian', 'dalam-negeri': 'Kerjasama dalam negeri', 'luar-negeri': 'Kerjasama luar negeri' };

// Satu kartu untuk tiga jenis konten. `resource` (bukan `kind`) menandai asal kartu.
const describe = {
  kegiatan: (it) => ({ to: `/kegiatan/${it.type}/${it.id}`, label: LABEL[it.type], title: it.title, meta: `${formatDate(it.date)}, ${it.location}`, icon: CalendarBlank, metaIcon: MapPin, cta: 'Lihat kegiatan' }),
  publikasi: (it) => ({ to: `/publikasi/baca/${it.id}`, label: `${LABEL[it.type]}, ${it.year}`, title: it.title, meta: it.authors.join(', '), icon: BookOpenText, cta: it.pdfUrl ? 'Baca di sini' : 'Lihat publikasi' }),
  kerjasama: (it) => ({ to: `/kerjasama/${it.scope}/${it.id}`, label: LABEL[it.scope], title: it.partner, meta: it.kind || it.summary || '', icon: Handshake, cta: 'Lihat kerja sama' }),
};

function Slide({ item }) {
  const d = describe[item.resource](item);
  const Icon = d.icon;
  return (
    <li className={SLIDE}>
      <Link to={d.to} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        {item.cover ? (
          <img src={item.cover} alt="" width="640" height="400" loading="lazy" decoding="async" className="aspect-[16/10] w-full bg-mist object-cover" />
        ) : (
          <div className="on-deep grid aspect-[16/10] w-full place-items-center bg-deep-2 text-accent" aria-hidden="true"><Icon size={40} weight="light" /></div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{d.label}</span>
            {item.demo && <DemoBadge />}
          </div>
          <h3 className="mt-4 line-clamp-3 text-xl font-medium leading-snug">{d.title}</h3>
          {d.meta && <p className="mt-2 line-clamp-2 text-sm text-muted">{d.meta}</p>}
          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-brand">
            {d.cta} <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </li>
  );
}

/** Kartu sorotan: pilihan admin, atau entri terakhir ditambahkan bila belum ada yang dipilih (diputuskan oleh API). */
export default function HighlightsSection() {
  const [state, setState] = useState({ data: null, error: false });

  useEffect(() => {
    let alive = true;
    sorotanApi.get().then((data) => alive && setState({ data, error: false })).catch(() => alive && setState({ data: null, error: true }));
    return () => { alive = false; };
  }, []);

  const { data, error } = state;
  if (error || (data && data.items.length === 0)) return null; // tidak menampilkan bagian kosong

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="sorotan-title">
      <SectionHead
        title={<span id="sorotan-title">Sorotan terbaru</span>}
        lead={data?.mode === 'pilihan' ? 'Pilihan tim PUI: kegiatan, publikasi, dan kerja sama yang sedang kami angkat.' : 'Kegiatan, publikasi, dan kerja sama yang paling baru ditambahkan. Geser untuk melihat lainnya.'}
        action={<Button to="/kegiatan/workshop" variant="outline" size="sm">Semua kegiatan</Button>}
      />
      <div className="mt-12">
        <Carousel label="Sorotan kegiatan, publikasi, dan kerja sama">
          {!data
            ? [0, 1, 2].map((i) => (
                <div key={i} className={cn(SLIDE, 'overflow-hidden rounded-3xl border border-line bg-surface')} aria-hidden="true">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-6"><Skeleton className="h-5 w-24" /><Skeleton className="mt-4 h-6 w-full" /><Skeleton className="mt-2 h-6 w-2/3" /></div>
                </div>
              ))
            : <ul className="contents">{data.items.map((it) => <Slide key={`${it.resource}-${it.id}`} item={it} />)}</ul>}
        </Carousel>
      </div>
    </section>
  );
}
