import Button from '../../components/ui/Button.jsx';
import Weave from '../../components/ui/Weave.jsx';

export default function JoinCta() {
  return (
    <section className="shell" aria-labelledby="gabung-title">
      <div className="on-deep relative overflow-hidden rounded-[2rem] bg-deep px-7 py-14 text-white sm:px-14 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/40 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <h2 id="gabung-title" className="text-[clamp(2rem,4.2vw,3.5rem)] font-medium leading-[1.05] text-white">
            Punya gagasan riset tentang literasi atau seni?
          </h2>
          <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-white/70">
            Bergabunglah sebagai anggota atau mitra. Kami membuka ruang untuk dosen, mahasiswa, guru, dan pegiat seni.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/keanggotaan/pendaftaran" variant="gold" size="lg">Daftar sebagai anggota</Button>
            <Button to="/kerjasama/dalam-negeri" variant="outline-light" size="lg">Lihat mitra kami</Button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 opacity-70"><Weave height={8} /></div>
      </div>
    </section>
  );
}
