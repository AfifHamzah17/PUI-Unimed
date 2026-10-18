# PUI Literasi dan Seni dalam Pendidikan (UNIMED)

Vite + React 18 + Tailwind CSS 3.4 + react-router-dom 6, PWA, pembaca PDF (react-pdf).

## Menjalankan

```bash
npm install
npm run dev          # pengembangan
npm run build        # produksi (dist/)
npm run preview      # uji hasil build di http://localhost:4173
npm run audit        # Lighthouse desktop -> lighthouse-desktop.html (jalankan preview dulu)
npm run audit:mobile # Lighthouse mobile
npm run images       # kompres ulang foto dan buat ikon PWA dari assets-src/
```

Service worker (PWA) hanya aktif pada build produksi, bukan di `npm run dev`.

## Yang perlu Anda isi atau putuskan

| Hal | Lokasi |
|---|---|
| **Sekretaris**: ubah `role` satu anggota menjadi `'Sekretaris'` | `src/data/content.js` (`members`) |
| Email, telepon, jam layanan | `src/data/content.js` (`org`) |
| Angka kartu stats dan data grafik (masih contoh) | `src/data/stats.js` |
| Menambah kartu stats ke-4 | tambah satu objek di `stats`, tata letak menyesuaikan sendiri |
| Data awal kegiatan, publikasi, kerjasama | `src/data/seed.js` (entri `demo: true` diberi label "Data contoh") |

## Struktur

```
src/
  components/  layout/ (Navbar, MobileMenu, Footer, SpeedDial, Breadcrumbs)
               ui/ (Button, Modal, Field, Skeleton, Odometer, Scramble, Marquee, Carousel, ...)
               charts/ folio/ (3D CSS) pdf/ pwa/
  pages/       Home + home/*, tentang/*, admin/*, Publikasi, Kegiatan, Kerjasama, BacaPublikasi, ...
  services/api.js   satu-satunya tempat yang tahu soal backend
  data/        konten statis, seed, stats
  hooks/ lib/
```

## Data dan backend (Cloud Run + Firestore)

Backend ada di `backend/` (lihat `backend/README.md`: endpoint, peran, deploy, batasan).
`src/services/api.js` punya dua mode:

- `VITE_API_URL` kosong: data di `localStorage` (mode demo: tanpa login, akun, dan unggah berkas).
- `VITE_API_URL=https://...run.app`: memakai API. `/admin` wajib login (email + kata sandi), ada dua peran
  (Admin dan Pengguna), kelola pengguna, ganti kata sandi, dan unggah foto/PDF langsung ke Cloud Storage.

Mode demo memakai kode yang sama dengan backend (`backend/src/shared`) untuk validasi, filter, urutan, dan sorotan,
sehingga perilakunya sinkron. Variabel frontend (Vercel): `VITE_API_URL`. Contoh di `.env.example`.

## Halaman akun

| Alamat | Fungsi |
|---|---|
| `/masuk` | Masuk dengan email dan kata sandi: tombol lihat/sembunyikan, peringatan Caps Lock, ingat email, kembali ke halaman admin yang dituju, penjelasan bila sesi berakhir |
| `/daftar-akun` | Ajukan akun pengelola konten (meter kekuatan sandi, ulangi sandi). Aktif setelah disetujui admin |
| `/lupa-sandi` | Kirim permintaan reset ke admin. Admin mengatur sandi sementara baru di menu Pengguna |
| `/admin/pengajuan` | Khusus admin: setujui atau tolak pengajuan akun. Lencana jumlah muncul di menu dan ringkasan |

`/admin` tanpa sesi otomatis diarahkan ke `/masuk`. Tanpa `VITE_API_URL` (mode demo) ketiga halaman akun hanya menampilkan
penjelasan karena mode demo tidak memakai akun. Semuanya memakai komponen dan token desain yang sama dengan halaman lain.

## Fitur admin

- Daftar Kegiatan/Publikasi/Kerjasama: pencarian, filter (jenis, format, waktu, sorotan), rentang tanggal atau tahun,
  urutan, paginasi dengan pilihan jumlah per halaman.
- Foto sampul dan galeri (unggah atau tempel alamat), editor teks kaya (Tiptap) dengan sisip gambar dan tautan.
- Tombol bintang untuk menyorot entri di beranda; halaman Sorotan beranda mengatur pilihan. Tanpa pilihan, beranda
  menampilkan 6 entri terakhir ditambahkan.
- Pengguna: tambah, nonaktifkan, hapus, reset sandi; akun yang meminta reset naik ke atas dengan lencana.
- Pengajuan akun: setujui atau tolak (lihat *Halaman akun*).
- Halaman detail publik untuk Kegiatan (`/kegiatan/:jenis/:id`) dan Kerjasama (`/kerjasama/:cakupan/:id`) dengan galeri
  dan lightbox; semua kartu publikasi juga bisa dibuka.

## Performa yang sudah diterapkan

- Foto anggota WebP 160/240 px (±2-5 KB, dari 10-22 KB), PDF jurnal 3,9 MB menjadi 2,9 MB, logo WebP.
- `loading="lazy"` dan `decoding="async"` pada gambar; bagian beranda di bawah layar dimuat saat didekati (`LazySection`).
- Code splitting: tiap halaman satu chunk, react/pdf/ikon dipisah (`vite.config.js`). react-pdf dan worker hanya diunduh di halaman baca.
- Grafik SVG buatan sendiri, tanpa pustaka grafik. 3D memakai CSS, tanpa three.js. Tanpa framer-motion. Satu pustaka ikon.
- `memo` pada grafik, ref dan CSS variable untuk efek kursor/parallax (tanpa render ulang), `useSyncExternalStore` untuk tema.
- Debounce pada pencarian (300 ms) dan slider PDF (140 ms), paginasi di semua daftar.
- Skeleton di semua keadaan loading, cache TTL 60 dtk di klien API, hasil agregasi grafik di-memoize.
- Font dimuat tanpa memblokir render; script tema inline sangat kecil untuk mencegah kedip mode gelap.
- `vercel.json`: cache immutable untuk `/assets`, cache panjang untuk gambar, rewrite SPA, header keamanan.
- PWA: worker pdf.js ikut di-precache, PDF yang pernah dibuka di-cache untuk dibaca offline.

## Deploy

Frontend: impor repo ke Vercel (preset Vite). `vercel.json` sudah menangani fallback SPA.
