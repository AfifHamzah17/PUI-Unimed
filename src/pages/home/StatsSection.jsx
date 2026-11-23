import Odometer from '../../components/ui/Odometer.jsx';
import Sparkline from '../../components/ui/Sparkline.jsx';
import SpotlightCard from '../../components/ui/SpotlightCard.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { perYear, useSiteData } from '../../hooks/useSiteData.js';

const yearOfDate = (k) => Number(String(k.date).slice(0, 4));
const EMPTY = 'Belum ada data. Tambahkan lewat halaman kelola.';

/** Tiga angka dihitung dari data yang ada di basis data. Tidak ada angka bawaan; data kosong tampil 0. */
function buildStats(d, year) {
  const pubs = d.publikasi;
  const keg = d.kegiatan;
  const mitra = d.kerjasama;

  const pubNow = pubs.filter((p) => p.year === year).length;
  const pubPrev = pubs.filter((p) => p.year === year - 1).length;
  const pubFrom = pubs.length ? Math.min(...pubs.map((p) => p.year)) : year;
  const kegNow = keg.filter((k) => yearOfDate(k) === year).length;
  const kegYears = keg.length ? Math.min(...keg.map(yearOfDate)) : year;
  const dn = mitra.filter((m) => m.scope === 'dalam-negeri').length;
  const ln = mitra.length - dn;

  return [
    {
      id: 'publikasi',
      label: `Publikasi terdata pada ${year}`,
      value: pubNow,
      note: !pubs.length ? EMPTY : pubPrev ? `${pubPrev} publikasi pada ${year - 1}` : `${pubs.length} publikasi seluruhnya`,
      trend: perYear(pubs, (p) => p.year, pubFrom, year).map((x) => x.n),
    },
    {
      id: 'kegiatan',
      label: `Kegiatan terdokumentasi pada ${year}`,
      value: kegNow,
      note: !keg.length ? EMPTY : `dari ${keg.length} kegiatan seluruhnya`,
      trend: perYear(keg, yearOfDate, kegYears, year).map((x) => x.n),
    },
    {
      id: 'mitra',
      label: 'Mitra kerja sama',
      value: mitra.length,
      note: !mitra.length ? EMPTY : [dn && `${dn} dalam negeri`, ln && `${ln} luar negeri`].filter(Boolean).join(', '),
      trend: null,
    },
  ];
}

export default function StatsSection() {
  const data = useSiteData();
  if (data === null) return null; // API gagal: sembunyikan, jangan tampilkan angka palsu

  const stats = data && buildStats(data, new Date().getFullYear());
  const [featured, ...rest] = stats ?? [];

  return (
    <section className="shell py-24 sm:py-32" aria-labelledby="stats-title">
      <SectionHead
        title={<span id="stats-title">Tahun ini dalam angka</span>}
        lead="Ringkasan produksi ilmiah, kegiatan, dan kerja sama pusat. Angka dihitung dari data yang tercatat di situs ini."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]" aria-busy={!stats || undefined}>
        {!stats ? (
          <>
            <Skeleton className="h-[22rem] rounded-xl" />
            <div className="grid gap-5"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
          </>
        ) : (
          <>
            <SpotlightCard className="flex flex-col justify-between p-8 sm:p-10">
              <p className="max-w-[22ch] text-lg text-muted">{featured.label}</p>
              <div className="my-10 font-mono text-[clamp(4.5rem,11vw,9rem)] font-medium leading-none tracking-tighter text-ink">
                <Odometer value={featured.value} />
              </div>
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-[24ch] text-sm text-muted">{featured.note}</p>
                {featured.trend?.length > 1 && <div className="w-40 shrink-0 sm:w-56"><Sparkline values={featured.trend} /></div>}
              </div>
            </SpotlightCard>

            <div className="grid gap-5">
              {rest.map((s) => (
                <SpotlightCard key={s.id} className="flex items-center justify-between gap-6 p-7">
                  <div>
                    <p className="text-[0.9375rem] text-muted">{s.label}</p>
                    <div className="mt-4 font-mono text-[clamp(2.75rem,5vw,4rem)] font-medium leading-none tracking-tighter text-ink">
                      <Odometer value={s.value} />
                    </div>
                    <p className="mt-4 text-sm text-muted">{s.note}</p>
                  </div>
                  {s.trend?.length > 1 && <div className="hidden w-28 shrink-0 sm:block"><Sparkline values={s.trend} /></div>}
                </SpotlightCard>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
