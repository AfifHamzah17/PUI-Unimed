// Data awal untuk mode lokal. Entri `demo: true` adalah CONTOH dan diberi label "Data contoh" di antarmuka.
// Entri tanpa `demo` bersumber dari dokumen asli (jurnal terbit dan bagian ucapan terima kasihnya).
// Naikkan SEED_VERSION bila struktur seed berubah agar data lokal lama diganti.
export const SEED_VERSION = 3;

export const kegiatanSeed = [
  {
    id: 'keg-1', type: 'workshop', demo: true,
    title: 'Workshop media pembelajaran digital untuk literasi',
    date: '2026-11-14', location: 'Gedung LPPM UNIMED, Medan', mode: 'luring',
    summary: 'Praktik merancang media ajar digital yang memadukan teks, gambar, dan audio bagi guru bahasa.',
  },
  {
    id: 'keg-2', type: 'seminar', demo: true,
    title: 'Seminar hasil riset: keamanan digital dalam belajar bahasa asing',
    date: '2026-11-28', location: 'Zoom Meeting', mode: 'daring',
    summary: 'Pemaparan temuan riset dan diskusi bersama praktisi pendidikan tentang pembelajaran bahasa yang aman.',
  },
  {
    id: 'keg-3', type: 'workshop', demo: true,
    title: 'Pelatihan menulis artikel ilmiah untuk dosen muda',
    date: '2026-12-05', location: 'Aula FBS UNIMED', mode: 'hybrid',
    summary: 'Dari rumusan masalah sampai naskah siap kirim ke jurnal bereputasi.',
  },
  {
    id: 'keg-4', type: 'seminar', demo: true,
    title: 'Seminar seni dan pendidikan karakter',
    date: '2026-09-12', location: 'Auditorium UNIMED', mode: 'luring',
    summary: 'Peran seni pertunjukan dan rupa dalam membentuk karakter peserta didik.',
  },
  {
    id: 'keg-5', type: 'workshop', demo: true,
    title: 'Workshop asesmen literasi berbasis proyek seni',
    date: '2026-08-22', location: 'Ruang Pertemuan LPPM', mode: 'luring',
    summary: 'Menyusun rubrik asesmen yang menilai proses kreatif sekaligus kemampuan literasi.',
  },
];

export const publikasiSeed = [
  {
    id: 'pub-gendered-digital-2026', type: 'jurnal',
    title: 'Gendered Digital Vulnerabilities: Empirical Challenges Faced by Islamic Female High School Students in Foreign Language Learning in Medan, Indonesia',
    authors: ['Rita Suswati', 'Tengku Ratna Soraya', 'Hesti Fibriasari', 'Wahyu Triatmodjo', 'Trisnawati Hutagalung', 'Oksari Sihaloho'],
    year: 2026,
    venue: 'International Journal of Special Education',
    volume: '41(8s), 76-89',
    abstract:
      'Studi kualitatif terhadap 186 siswi SMA Islam negeri dan swasta di Medan tentang tantangan mereka saat belajar bahasa asing secara daring. Analisis tematik menghasilkan enam tema, antara lain pelecehan digital, stereotip terhadap Islam, kecemasan berbahasa, dan kesenjangan akses. Temuannya menunjukkan bahwa belajar bahasa di ruang digital dipengaruhi oleh gender, identitas keagamaan, dan kualitas infrastruktur, bukan hanya kemampuan bahasa.',
    keywords: ['kerentanan digital', 'siswi muslim', 'pembelajaran bahasa asing', 'kesenjangan digital'],
    pdfUrl: '/docs/jurnal-gendered-digital-vulnerabilities.pdf',
    cover: '/docs/jurnal-gendered-digital-vulnerabilities-cover.webp',
  },
  {
    id: 'pub-2', type: 'jurnal', demo: true,
    title: 'Literasi visual dalam pembelajaran bahasa Indonesia di sekolah menengah',
    authors: ['Nama Penulis A', 'Nama Penulis B'], year: 2025, venue: 'Jurnal Pendidikan Bahasa', volume: '12(2), 101-118',
    abstract: 'Contoh entri jurnal untuk menguji daftar, pencarian, dan halaman baca.', keywords: ['literasi visual'],
  },
  {
    id: 'pub-3', type: 'jurnal', demo: true,
    title: 'Integrasi seni pertunjukan dalam penguatan keterampilan berbicara',
    authors: ['Nama Penulis C'], year: 2025, venue: 'Jurnal Seni dan Pendidikan', volume: '7(1), 22-39',
    abstract: 'Contoh entri jurnal.', keywords: ['seni pertunjukan'],
  },
  {
    id: 'pub-4', type: 'penelitian', demo: true,
    title: 'Model asesmen literasi berbasis proyek seni untuk jenjang SMP',
    authors: ['Nama Peneliti A', 'Nama Peneliti B'], year: 2026, venue: 'Laporan penelitian LPPM UNIMED', volume: '',
    abstract: 'Contoh entri penelitian.', keywords: ['asesmen'],
  },
  {
    id: 'pub-5', type: 'penelitian', demo: true,
    title: 'Pemetaan budaya baca siswa di sekolah pinggiran Kota Medan',
    authors: ['Nama Peneliti C'], year: 2025, venue: 'Laporan penelitian LPPM UNIMED', volume: '',
    abstract: 'Contoh entri penelitian.', keywords: ['budaya baca'],
  },
  {
    id: 'pub-6', type: 'pengabdian', demo: true,
    title: 'Pelatihan pustakawan sekolah dalam mengelola sudut baca kreatif',
    authors: ['Nama Pengabdi A'], year: 2026, venue: 'Program pengabdian kepada masyarakat', volume: '',
    abstract: 'Contoh entri pengabdian.', keywords: ['sudut baca'],
  },
  {
    id: 'pub-7', type: 'pengabdian', demo: true,
    title: 'Pendampingan komunitas menulis remaja berbasis seni tutur',
    authors: ['Nama Pengabdi B', 'Nama Pengabdi C'], year: 2025, venue: 'Program pengabdian kepada masyarakat', volume: '',
    abstract: 'Contoh entri pengabdian.', keywords: ['komunitas menulis'],
  },
  {
    id: 'pub-8', type: 'jurnal', demo: true,
    title: 'Kecemasan berbahasa asing pada pembelajar daring: tinjauan literatur',
    authors: ['Nama Penulis D'], year: 2024, venue: 'Jurnal Linguistik Terapan', volume: '3(1), 5-20',
    abstract: 'Contoh entri jurnal.', keywords: ['kecemasan berbahasa'],
  },
];

export const kerjasamaSeed = [
  {
    id: 'ker-1', scope: 'dalam-negeri', partner: 'Universitas Negeri Malang', kind: 'Kolaborasi riset',
    summary: 'Mitra kolaborasi riset yang disebut dalam ucapan terima kasih jurnal "Gendered Digital Vulnerabilities" (2026).',
  },
  {
    id: 'ker-2', scope: 'dalam-negeri', partner: 'Universitas Pendidikan Indonesia', kind: 'Kolaborasi riset',
    summary: 'Mitra kolaborasi riset yang disebut dalam ucapan terima kasih jurnal yang sama.',
  },
  {
    id: 'ker-3', scope: 'dalam-negeri', partner: 'ALPTKNI melalui skema RKLI', kind: 'Skema pendanaan',
    summary: 'Skema Collaborative Research of Indonesian Teacher Training Institutes (RKLI) di bawah Asosiasi Lembaga Penelitian dan Pengabdian kepada Masyarakat Perguruan Tinggi Kependidikan Negeri Indonesia (ALPTKNI), dengan supervisi LPPM UNIMED. Mendanai riset jurnal "Gendered Digital Vulnerabilities".',
  },
];
