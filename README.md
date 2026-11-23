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
  data/        konten statis (anggota, menu, media sosial), seed, label
  hooks/ lib/
```

## Data dan backend (Cloud Run + Firestore)

Backend ada di `backend/` (lihat `backend/README.md`: endpoint, peran, deploy, batasan).
Frontend selalu memakai API (`src/services/api.js` adalah satu-satunya tempat yang tahu soal backend); tidak ada lagi
mode demo atau data di `localStorage`. `/admin` wajib login (email + kata sandi), ada dua peran (Admin dan Pengguna),
kelola pengguna, ganti kata sandi, dan unggah foto/PDF langsung ke Cloud Storage.

Variabel frontend (Vercel): `VITE_API_URL`, wajib diisi di produksi lalu redeploy (nilainya ikut tertanam saat build).
Saat `npm run dev`, bila kosong otomatis memakai `http://localhost:8080`, jadi cukup menjalankan backend lokal
(`cd backend && npm run dev`). Validasi formulir memakai kode yang sama dengan server (`backend/src/shared/validate.js`).

## Halaman akun

| Alamat | Fungsi |
|---|---|
| `/masuk` | Masuk dengan email dan kata sandi: tombol lihat/sembunyikan, peringatan Caps Lock, ingat email, kembali ke halaman admin yang dituju, penjelasan bila sesi berakhir |
| `/daftar-akun` | Ajukan akun pengelola konten (meter kekuatan sandi, ulangi sandi). Aktif setelah disetujui admin |
| `/lupa-sandi` | Kirim permintaan reset ke admin. Admin mengatur sandi sementara baru di menu Pengguna |
| `/admin/pengajuan` | Khusus admin: setujui atau tolak pengajuan akun. Lencana jumlah muncul di menu dan ringkasan |

`/admin` tanpa sesi otomatis diarahkan ke `/masuk`. Semuanya memakai komponen dan token desain yang sama dengan halaman lain.

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


## Catatan perubahan terbaru

**Tampilan.** Warna diturunkan dari logo CeLAE (biru tinta, abu-biru, emas pucat); judul memakai Bree Serif seperti nama di logo, isi memakai Geist. Hero adalah carousel foto penuh yang mengambil slide dari menu Sorotan di admin (slide pertama tetap). Angka di beranda dan grafik dihitung dari data nyata; bila API tidak terjangkau bagian itu disembunyikan, tidak ada angka karangan.

**Media sosial.** Isi alamat profil di `src/data/content.js` (`social`). Ikon yang alamatnya masih kosong tampil redup dan tidak bisa diklik.

**Foto kegiatan.** Taruh di `assets-src/kegiatan/<slug>/01.jpg, 02.jpg, ...`, jalankan `npm run images`, lalu pakai `/kegiatan/<slug>/01-1600.webp` di admin. Tampilan otomatis memilih ukuran 480, 960, atau 1600 piksel.

**Data tidak boleh kembali ke awal.** Seed hanya mengisi koleksi kosong, sekali. Setelah itu:

```bash
cd backend
npm run seed -- --add-missing --dry-run   # lihat apa yang akan ditambahkan
npm run seed -- --add-missing             # tambah entri seed baru; data yang ada tidak disentuh
npm run seed -- --remove-demo             # hapus entri "Data contoh" lama saja
```

Cek bahwa layanan benar-benar memakai Firestore: buka `https://<alamat-cloud-run>/healthz`, isinya harus `{"ok":true,"store":"firestore"}`. Bila `store` bukan `firestore`, layanan yang berjalan versi lama dan data akan hilang tiap instance daur ulang; deploy ulang dengan `backend/deploy/deploy.sh`.

## Audit sebelum rilis

Jalankan `npm run build && npm run preview`, lalu `npm run audit` (Lighthouse) pada alamat pratinjau. Target: Performance, Accessibility, Best Practices, SEO di atas 90. Dua hal yang perlu Anda isi setelah domain ada: `og:image` di `index.html` harus berupa alamat absolut (https://domain-anda/og-image.png), dan alamat media sosial di `src/data/content.js`.
Foto anggota di `assets-src/foto/` beresolusi kecil (maks. 356 px); ganti dengan foto minimal 600 px lalu jalankan `npm run images` agar foto besar di halaman Anggota tajam.

## Menjalankan di komputer sendiri

```bash
npm install && (cd backend && npm install)
npm run dev:all        # backend (port 8080) dan frontend (port 5173) sekaligus
```

Kalau hanya `npm run dev`, frontend tidak punya server data dan konsol penuh galat `ERR_CONNECTION_REFUSED`; jalankan backend di terminal lain (`cd backend && npm run dev`). Backend lokal memakai berkas `backend/.data/pui.json`; data yang Anda tambah lewat admin tersimpan di situ dan tidak ditimpa. Tiap start, entri contoh lama dibuang dan entri seed baru ditambahkan (data buatan Anda tidak disentuh).

## Carousel beranda

Kelola di `/admin/slider`: judul, keterangan, foto, tombol, urutan, dan sakelar tampil. Jeda antar slide 5 detik. Bila slide berfoto kurang dari 3, sisanya diisi slide pengisi (latar biru dengan tautan ke Publikasi, Kegiatan, Kerjasama) sampai ada 3. Untuk produksi: `cd backend && npm run seed -- --add-missing` menambahkan 4 slide awal.

## Halaman Video

`/video` memutar video berulang (loop, tanpa suara sampai tombol suara ditekan). Pengaturannya di `src/data/content.js` (`videoPage`): `sources` (berkas di `public/video/`, bawaan `pui-vr.mp4`) dicoba lebih dulu, lalu aliran langsung Google Drive dari `driveUrl`, lalu pemutar bawaan Drive (tanpa loop). Pemutar Drive tidak bisa diatur untuk loop, jadi untuk video lain taruh berkas mp4 di `public/video/` dan daftarkan di `sources`. Ada pengaman: bila video berhenti di akhir, otomatis diputar dari awal.
