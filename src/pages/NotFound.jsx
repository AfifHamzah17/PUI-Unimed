import Button from '../components/ui/Button.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFound({ title = 'Halaman tidak ditemukan' }) {
  useDocumentTitle(title);
  return (
    <section className="shell flex min-h-[80dvh] flex-col justify-center pb-16 pt-40">
      <p className="font-mono text-[clamp(5rem,16vw,12rem)] font-medium leading-none tracking-tighter text-ink/10">404</p>
      <h1 className="-mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-tight">{title}</h1>
      <p className="mt-4 max-w-md text-lg text-muted">Alamat yang Anda tuju mungkin salah ketik, atau halamannya sudah dipindahkan.</p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Kembali ke beranda</Button>
        <Button to="/publikasi/jurnal" variant="outline">Lihat jurnal</Button>
      </div>
    </section>
  );
}
