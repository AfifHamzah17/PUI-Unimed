import Odometer from '../../components/ui/Odometer.jsx';
import Sparkline from '../../components/ui/Sparkline.jsx';
import SpotlightCard from '../../components/ui/SpotlightCard.jsx';
import SectionHead from '../../components/ui/SectionHead.jsx';
import { stats } from '../../data/stats.js';

/**
 * Kartu pertama (featured) besar di kiri, sisanya bertumpuk di kanan.
 * Menambah objek keempat di data/stats.js otomatis menambah satu kartu di kolom kanan.
 */
export default function StatsSection() {
  const [featured, ...rest] = stats;
  return (
    <section className="shell py-24 sm:py-32" aria-labelledby="stats-title">
      <SectionHead
        title={<span id="stats-title">Tahun ini dalam angka</span>}
        lead="Ringkasan produksi ilmiah dan kegiatan pusat. Angka di bagian ini masih contoh sampai API tersambung."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <SpotlightCard className="flex flex-col justify-between p-8 sm:p-10">
          <p className="max-w-[22ch] text-lg text-muted">{featured.label}</p>
          <div className="my-10 font-mono text-[clamp(4.5rem,11vw,9rem)] font-medium leading-none tracking-tighter text-ink">
            <Odometer value={featured.value} />
          </div>
          <div className="flex items-end justify-between gap-6">
            <p className="max-w-[24ch] text-sm text-muted">{featured.note}</p>
            <div className="w-40 shrink-0 sm:w-56"><Sparkline values={featured.trend} /></div>
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
              <div className="hidden w-28 shrink-0 sm:block"><Sparkline values={s.trend} /></div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
