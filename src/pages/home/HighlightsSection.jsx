import { ArrowUpRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import ActivityCard, { ActivityCardSkeleton } from '../../components/ui/ActivityCard.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { useRepoList } from '../../hooks/useRepo.js';
import { kegiatanRepo } from '../../services/api.js';

const PARAMS = { page: 1, pageSize: 4 };

/** Empat kegiatan terbaru dalam tata letak asimetris. Sembunyi bila tidak ada kegiatan atau API gagal. */
export default function HighlightsSection() {
  const { data, loading, error } = useRepoList(kegiatanRepo, PARAMS);
  if (error || (data && data.items.length === 0)) return null;

  return (
    <section className="shell pb-24 sm:pb-32" aria-labelledby="kegiatan-title">
      <SectionHead
        title={<span id="kegiatan-title">Kegiatan terbaru</span>}
        lead="Kunjungan, workshop, dan seminar yang baru dijalankan tim PUI. Klik untuk melihat uraian dan foto."
        action={
          <Link to="/kegiatan" className="group inline-flex items-center gap-2 font-medium text-brand">
            <span className="u-link">Semua kegiatan</span>
            <ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <ul className="mt-14 grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:items-start" aria-busy={loading || undefined}>
        {!data
          ? [0, 1].map((i) => <li key={i} className="contents"><ActivityCardSkeleton index={i} /></li>)
          : data.items.map((it, i) => <ActivityCard key={it.id} item={it} index={i} />)}
      </ul>
    </section>
  );
}
