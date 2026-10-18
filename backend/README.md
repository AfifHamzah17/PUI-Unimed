# API PUI (Cloud Run + Firestore + Cloud Storage)

Node 20+ tanpa framework (`node:http`), dua dependensi: `@google-cloud/firestore` dan `@google-cloud/storage`.
Tanpa Firebase. Autentikasi memakai email + kata sandi (scrypt) dan token sesi bertanda tangan HMAC, semuanya dengan `node:crypto`.

## Peran

| | Admin | Pengguna |
|---|---|---|
| CRUD Kegiatan, Publikasi, Kerjasama, atur sorotan, unggah berkas | ya | ya |
| Ganti kata sandi sendiri (wajib kata sandi lama) | ya | ya |
| Buat, ubah, nonaktifkan, hapus, reset kata sandi akun | ya, hanya akun berperan **Pengguna** | tidak |
| Membuat akun admin | **tidak ada jalurnya** (admin pertama dari `BOOTSTRAP_ADMIN_*`) | tidak |
| Melihat dan menghapus pendaftar anggota (data pribadi) | ya | tidak |
| Menyetujui atau menolak pengajuan akun, melihat dan melayani permintaan reset sandi | ya | tidak |
| Mengajukan akun, meminta reset sandi (tanpa login) | publik | publik |

Aturan penting: reset oleh admin tidak butuh kata sandi lama, tetapi mencabut semua sesi pengguna itu dan memaksanya
mengganti sandi saat masuk berikutnya. Akun baru juga wajib ganti sandi. Akun admin tidak bisa direset, diubah,
dinonaktifkan, atau dihapus lewat API (termasuk oleh admin lain). Menonaktifkan, menghapus, atau mengganti sandi langsung
memutus sesi yang sedang aktif karena versi token dicocokkan ke data pengguna di setiap permintaan.

Untuk mengizinkan Pengguna melihat pendaftar, ganti `auth.requireAdmin` menjadi `auth.requireStaff` pada rute `/pendaftaran` di `src/app.js`.

## Endpoint

| Metode | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/healthz` | publik | cek kesehatan |
| GET | `/sorotan` | publik | kartu sorotan beranda: pilihan admin (maks 8, terbaru ditandai di depan) atau 6 entri terakhir ditambahkan |
| GET | `/{kegiatan\|publikasi\|kerjasama}` | publik | daftar, parameter di bawah |
| GET | `/{resource}/{id}` | publik | detail lengkap, termasuk `content` teks kaya |
| POST / PUT / PATCH / DELETE | `/{resource}`, `/{resource}/{id}` | login | PATCH `{ featured }` hanya mengubah status sorotan |
| POST | `/auth/login` | publik | `{ email, password }` -> `{ token, expiresAt, user }`; 8 kegagalan per 15 menit mengunci IP |
| GET | `/auth/me` | login | pengguna saat ini |
| POST | `/auth/change-password` | login | `{ oldPassword, newPassword }` -> sesi baru, sesi lama dicabut |
| GET / POST | `/users` | admin | daftar (`q`, `page`, `pageSize`), buat `{ name, email, password }` |
| PUT / DELETE | `/users/{id}` | admin | ubah `{ name, active }`, hapus |
| POST | `/users/{id}/reset-password` | admin | `{ newPassword }`, tanpa kata sandi lama |
| POST | `/auth/register-request` | publik | `{ name, email, password }` -> 202 `{ ok }`; 5 per jam per IP, kolom `website` adalah jebakan bot. Selalu 202 walau email sudah terdaftar atau sudah diajukan |
| POST | `/auth/forgot-password` | publik | `{ email }` -> 202 `{ ok }` selalu (tidak membocorkan akun); 5 per jam per IP |
| GET | `/admin/pending` | admin | `{ accountRequests, passwordResets }` untuk lencana menu |
| GET | `/account-requests` | admin | daftar pengajuan (`q`, `page`, `pageSize`); tanpa hash kata sandi |
| POST | `/account-requests/{id}/approve` | admin | buat akun `user` aktif dengan kata sandi pilihan pemohon; body `{}` |
| DELETE | `/account-requests/{id}` | admin | tolak (hapus) pengajuan |
| DELETE | `/password-resets/{id}` | admin | abaikan permintaan reset (id = id pengguna) |
| POST | `/pendaftaran` | publik | 5 per jam per IP, kolom `website` adalah jebakan bot |
| GET / DELETE | `/pendaftaran`, `/pendaftaran/{id}` | admin | daftar (`q`, `page`, `pageSize`), hapus |
| POST | `/uploads/sign` | login | `{ filename, contentType, size }` -> URL PUT bertanda tangan ke Cloud Storage |

**Parameter daftar:** `q`, `type` (kerjasama: cakupan), `mode` (kegiatan), `status=upcoming|past` (kegiatan, zona WIB),
`from` dan `to` (`TTTT-BB-HH` atau `TTTT`; kegiatan memakai tanggal, publikasi memakai tahun, kerjasama memakai tanggal mulai
atau tanggal dibuat), `featured=true|false`, `sort` (`date_desc|date_asc|created_desc|created_asc|title_asc|title_desc`),
`page`, `pageSize` (maks 50). Respons `{ items, total }`; `items` tidak membawa `content` melainkan `hasContent`.
Parameter tidak valid dijawab 400 yang jelas.

GET publik memakai `ETag` dan `Cache-Control: public, max-age=0, s-maxage=60`. Jangan menambah `stale-while-revalidate`:
Chrome akan menampilkan daftar lama setelah admin menyimpan.

## Pengajuan akun dan reset sandi (tanpa email)

Backend tidak mengirim email, jadi kedua alur ini lewat admin:

- **Pengajuan akun.** Pemohon mengisi nama, email, dan kata sandi pilihannya di `/daftar-akun`. Yang disimpan di koleksi
  `accountRequests` hanya nama, email, dan *hash* kata sandi. Akun baru dibuat ketika admin menyetujui (peran selalu `user`,
  langsung aktif, tidak dipaksa ganti sandi karena sandinya dipilih sendiri). Peran dari klien diabaikan.
- **Lupa kata sandi.** `/lupa-sandi` mencatat permintaan di koleksi `resetRequests` hanya untuk akun `user` yang aktif. Di menu
  Pengguna admin melihat lencana "Minta reset sandi", mengatur sandi sementara baru lewat Reset sandi (permintaan otomatis
  hilang, semua sesi dicabut, pengguna wajib menggantinya), atau mengabaikan permintaan.
- **Tidak membocorkan akun.** Kedua endpoint publik selalu menjawab sama, terlepas dari email sudah terdaftar atau belum.
- **Email pemohon tidak diverifikasi.** Siapa pun bisa mengajukan akun atas nama email orang lain. Karena itu admin harus
  menyetujui hanya orang yang dikenal atau sudah dipastikan lewat jalur lain. Akun `user` tidak dapat melihat data pendaftar
  anggota maupun mengelola akun.
- Antrean pengajuan dibatasi 200 entri; pembatas laju per instance (seperti login). Pemohon tidak diberi tahu otomatis saat
  disetujui, jadi admin perlu mengabarinya.
- Akun admin tetap tidak bisa direset lewat API; pemulihannya lewat konsol Firestore (lihat bagian *Admin lupa kata sandi*).

## Kode bersama dengan frontend

`src/shared/` (validasi, sanitasi teks kaya, filter, urutan, sorotan) diimpor juga oleh frontend untuk mode demo
tanpa backend dan untuk validasi formulir. Karena itu aturan dan pesan galatnya tidak bisa berbeda antara keduanya.
Modul ini hanya boleh berisi JavaScript murni tanpa API Node.

## Teks kaya

Disimpan sebagai JSON Tiptap/ProseMirror, bukan HTML. Server membangun ulang pohon dari daftar putih (paragraf, judul 2-4,
daftar, kutipan, blok kode, garis, gambar, dan gaya tebal/miring/coret/kode/tautan). Tautan `javascript:` dan sejenisnya dibuang,
gambar hanya `https://` atau relatif, elemen terlarang menolak seluruh isian. Frontend merender JSON menjadi elemen React
tanpa `dangerouslySetInnerHTML`.

## Menjalankan lokal

```bash
cd backend
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev            # memori + data contoh, di http://localhost:8080
npm test               # semua tes
```

Login pertama: email dan kata sandi dari `BOOTSTRAP_ADMIN_*` di `.env`; sistem langsung meminta kata sandi baru.
Frontend: `VITE_API_URL=http://localhost:8080` di `.env.local`, lalu `npm run dev` di akar repo dan buka `/admin`.

## Deploy

Lihat `deploy/deploy.sh` (Firestore, service account berhak minimum, bucket + CORS, Secret Manager, Cloud Run).
Skrip itu belum pernah dijalankan oleh penulisnya, jadi jalankan bertahap dan baca tiap langkah. Setelah deploy:

1. `npm run seed` untuk mengisi data awal (butuh `gcloud auth application-default login`).
2. Isi `VITE_API_URL` di Vercel, lalu redeploy.
3. Login dengan admin pertama, ganti kata sandi, lalu hapus `BOOTSTRAP_*` dari Cloud Run (perintahnya dicetak skrip).
4. `ALLOWED_ORIGINS` harus persis sama dengan origin frontend. URL pratinjau Vercel berbeda tiap deploy.

**Admin lupa kata sandi:** tidak ada reset lewat email. Hapus dokumen admin di koleksi `users` lewat konsol Firestore,
lalu deploy ulang dengan `BOOTSTRAP_ADMIN_*` sementara (admin baru dibuat hanya bila belum ada admin).

## Model data (Firestore, Native mode)

Koleksi `kegiatan`, `publikasi`, `kerjasama`, `pendaftaran`, `users`, `accountRequests`, `resetRequests`
(dua yang terakhir dibuat otomatis saat pertama dipakai; `accountRequests` memuat hash kata sandi, jadi pertahankan aturan
keamanan Firestore default yang menolak semua akses klien). Akses langsung klien ke Firestore tidak dipakai;
biarkan aturan keamanan default (tolak semua) karena API memakai kredensial service account. Dokumen lama tanpa field
baru (foto, sorotan, isi) tetap terbaca karena diberi nilai bawaan saat dibaca.

## Batasan yang perlu Anda tahu

- Pencarian, filter, dan paginasi dikerjakan di memori setelah koleksi dibaca (di-cache 30 dtk per instance). Cocok sampai
  sekitar ribuan dokumen per koleksi (batas pengaman 2000). Lebih besar dari itu perlu kueri berindeks atau mesin pencari.
- Cache per instance: setelah admin menyimpan, instance lain bisa menampilkan data lama hingga 30 dtk.
- Pembatas laju (login, pendaftaran) per instance, bukan global. Cukup untuk spam dan tebak-tebakan sederhana.
- Sesi berlaku 12 jam tanpa refresh; setelah itu login ulang. Belum ada: reset kata sandi lewat email, 2FA, audit log
  perubahan, pencadangan terjadwal (aktifkan Firestore PITR/ekspor), pemantauan dan alert.
- Adapter Firestore diuji dengan tiruan permukaan API, belum dengan SDK dan Firestore sungguhan.
- Signed URL memakai IAM `signBlob`; service account harus punya `roles/iam.serviceAccountTokenCreator` pada dirinya sendiri.
- Bucket dibuat publik-baca untuk dokumen jurnal. Jika kebijakan organisasi melarang `allUsers`, sajikan lewat Cloud CDN
  atau load balancer dan isi `PUBLIC_FILES_BASE_URL`.
