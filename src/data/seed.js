// Data awal yang dimuat ke backend (npm run dev di backend/, atau `npm run seed` untuk Firestore).
// Semua entri bersumber dari dokumen asli PUI (Isi_Web_PUI.pdf dan foto kegiatan). Tidak ada lagi entri contoh.
// Entri dengan `demo: true` (bila ada) diberi label "Data contoh" di antarmuka.

const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const doc = (...nodes) => ({ type: 'doc', content: nodes });
const img = (slug, n) => `/kegiatan/${slug}/${String(n).padStart(2, '0')}-1600.webp`;

const FIB = 'benchmarking-fib-ui';
const FSRD = 'kunjungan-fsrd-itb';
const SD1 = 'uji-coba-vr-sdtp-muhammadiyah-36';
const SD2 = 'uji-coba-vr-sd-kedua';

export const kegiatanSeed = [
  {
    id: 'keg-benchmarking-fib-ui',
    type: 'kunjungan',
    title: 'Benchmarking pusat riset ke Fakultas Ilmu Budaya Universitas Indonesia',
    date: '2025-12-15',
    location: 'Gedung Dekanat Fakultas Ilmu Budaya Universitas Indonesia',
    mode: 'luring',
    summary: 'Tim PUI belajar tata kelola pusat riset dari FIB UI dan menjajaki pengabdian bersama, riset kolaboratif, serta kuliah umum.',
    cover: img(FIB, 1),
    gallery: [1, 2, 3, 4, 5, 6, 7].map((n) => img(FIB, n)),
    content: doc(
      p('Pusat Unggulan Iptek (PUI) Literasi dan Seni dalam Pendidikan Universitas Negeri Medan melaksanakan benchmarking ke Fakultas Ilmu Budaya Universitas Indonesia pada Senin, 15 Desember 2025. Kegiatan berlangsung di Gedung Dekanat dan bertujuan memperkuat pengelolaan serta pengembangan pusat riset, khususnya di bidang literasi dan seni dalam pendidikan.'),
      p('Rombongan dipimpin Ketua PUI, Dr. Tengku Ratna Soraya, M.Pd., bersama Dr. Wahyu Tri Atmojo, M.Hum., Dr. Rita Suswati, Trisnawati Hutagalung, S.Pd., M.Pd., dan Oksari Anastasya Sihaloho, M.Pd. Perwakilan LPPM UNIMED, Asran Siregar, S.E., ikut mendampingi.'),
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Paparan tata kelola pusat riset' }] },
      p('Dr. Junaidi, SS., M.A., Partnership and Business Venture Manager FIB UI, menyambut tim dan memaparkan tata kelola pusat riset di UI, termasuk strategi mengembangkan riset yang berorientasi pada literasi dan seni sebagai bidang kajian unggulan. Paparan itu menjadi acuan bagi PUI UNIMED dalam menguatkan kelembagaan, program riset, dan jejaring kemitraan.'),
      p('Diskusi berjalan interaktif. Tim PUI menyampaikan maksud kunjungan dan menggali praktik baik tentang manajemen pusat riset, kolaborasi lintas institusi, serta penyatuan riset dengan pengabdian kepada masyarakat dan kegiatan akademik.'),
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tindak lanjut' }] },
      p('Kedua pihak sepakat menjajaki kerja sama yang lebih erat, terutama pengabdian masyarakat bersama, kolaborasi riset, dan penyelenggaraan kuliah umum. Dr. Junaidi mendorong rencana itu segera diwujudkan dalam kegiatan konkret pada tahun mendatang.')
    ),
  },
  {
    id: 'keg-kunjungan-fsrd-itb',
    type: 'kunjungan',
    // TANGGAL BELUM DIKETAHUI dari dokumen. Nilai di bawah hanya penampung; ubah lewat /admin/kegiatan.
    title: 'Kunjungan ke Faculty of Art and Design (FSRD) ITB',
    date: '2025-12-16',
    location: 'Faculty of Art and Design (FSRD) ITB',
    mode: 'luring',
    summary: 'Tim PUI bertemu pengelola FSRD ITB di ruang pertemuan fakultas, lalu berfoto bersama di depan gedung.',
    cover: img(FSRD, 1),
    gallery: [1, 2, 3, 4, 5, 6, 7].map((n) => img(FSRD, n)),
    content: doc(
      p('Tim PUI Literasi dan Seni dalam Pendidikan UNIMED berkunjung ke Faculty of Art and Design (FSRD) ITB. Pertemuan berlangsung di ruang pertemuan fakultas, dilanjutkan sesi foto bersama di lobi dan di depan gedung.'),
      p('Uraian lengkap tentang topik pembahasan dan tindak lanjut kunjungan ini akan ditambahkan oleh tim.')
    ),
  },
  {
    id: 'keg-vr-sdtp-muhammadiyah-36',
    type: 'kunjungan',
    // TANGGAL BELUM DIKETAHUI dari berkas foto (nama berkas hanya memuat tanggal pengiriman). Ubah lewat /admin/kegiatan.
    title: 'Siswa mencoba perangkat Virtual Reality di SD Terpadu Muhammadiyah 36 Medan',
    date: '2026-11-21',
    location: 'SD Terpadu Muhammadiyah 36 Medan',
    mode: 'luring',
    summary: 'Siswa kelas mencoba perangkat VR bersama pendamping, lalu tim berfoto bersama guru di kelas dan di halaman sekolah.',
    cover: img(SD1, 1),
    gallery: [1, 2, 3, 4, 5, 6, 7].map((n) => img(SD1, n)),
    content: doc(
      p('Dokumentasi kegiatan di SD Terpadu Muhammadiyah 36 Medan: siswa bergantian mencoba perangkat Virtual Reality di dalam kelas dengan didampingi guru dan tim, dilanjutkan foto bersama di kelas dan di halaman sekolah.'),
      p('Uraian lengkap tentang tujuan, peserta, dan hasil kegiatan akan ditambahkan oleh tim.')
    ),
  },
  {
    id: 'keg-vr-sd-kedua',
    type: 'kunjungan',
    // TANGGAL DAN NAMA SEKOLAH BELUM DIKETAHUI dari berkas foto. Ubah lewat /admin/kegiatan.
    title: 'Siswa mencoba perangkat Virtual Reality di sekolah dasar kedua',
    date: '2026-11-21',
    location: 'Sekolah dasar di Kota Medan (nama sekolah menyusul)',
    mode: 'luring',
    summary: 'Sesi serupa di sekolah dasar lain: siswa memakai perangkat VR sambil didampingi guru dan tim.',
    cover: img(SD2, 1),
    gallery: [1, 2, 3, 4, 5, 6, 7].map((n) => img(SD2, n)),
    content: doc(
      p('Dokumentasi sesi Virtual Reality di sekolah dasar kedua. Siswa mencoba perangkat secara bergantian di dalam kelas dengan pendampingan guru dan tim, kemudian berfoto bersama.'),
      p('Nama sekolah, tanggal, dan uraian lengkap kegiatan akan ditambahkan oleh tim.')
    ),
  },
];

const A = {
  tr: 'Tengku Ratna Soraya', hf: 'Hesti Fibriasari', wt: 'Wahyu Tri Atmojo',
  th: 'Trisnawati Hutagalung', os: 'Oksari A. Sihaloho', rs: 'Rita Suswati',
};

export const publikasiSeed = [
  {
    id: 'pub-gendered-digital-2026', type: 'jurnal',
    title: 'Gendered Digital Vulnerabilities: Empirical Challenges Faced by Islamic Female High School Students in Foreign Language Learning in Medan, Indonesia',
    authors: [A.rs, A.tr, A.hf, 'Wahyu Triatmodjo', A.th, 'Oksari Sihaloho'],
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
    id: 'pub-digital-literacy-gender-2025', type: 'jurnal',
    title: 'Digital Literacy of Language Learning in Higher Education: The Gender Perspective',
    authors: [A.tr, A.hf, A.wt, A.th, A.os, A.rs],
    year: 2025, venue: 'E-Learning Innovations Journal', volume: '3(2), 172-196',
  },
  {
    id: 'pub-barthes-kolita-2026', type: 'jurnal',
    title: 'Barthes Semiotic Analysis of Beauty Product Advertising in Marie Claire',
    authors: [A.tr, A.hf, A.rs],
    year: 2026, venue: 'Prosiding Konferensi Linguistik Tahunan Atma Jaya (KOLITA)', volume: '24(24), 608-613',
    abstract: 'DOI: https://doi.org/10.25170/kolita.v24i24.8582',
  },
  {
    id: 'pub-needs-analysis-iciesc-2026', type: 'jurnal',
    title: 'Needs Analysis for Gender-Based Digital Literacy Development in Senior High Schools in Medan City',
    authors: [A.tr, A.rs, 'Nurenzia Yannuar'],
    year: 2026, venue: 'ICIESC', volume: '7(1), 1-12',
  },
  {
    id: 'pub-literacy-collaboration-2025', type: 'pengabdian',
    title: 'Literacy Collaboration: Increasing the Competence of Teachers and Junior High School Students in Building a Literacy Culture at SMP N 23 Medan',
    authors: [A.tr, A.hf, A.wt, A.th, A.os, A.rs],
    year: 2025, venue: 'Dilektika: Jurnal Bahasa, Sastra, dan Budaya', volume: '12(1)',
    abstract: 'Terbit 31 Juli 2025. DOI: https://doi.org/10.33541/dia.v12i1.6896',
  },
  {
    id: 'pub-literasi-digital-gender-sma-2026', type: 'penelitian',
    title: 'Pengembangan Literasi Digital Berbasis Kesetaraan Gender di SMA Kota Medan',
    authors: [A.tr, A.rs], year: 2026, venue: 'Penelitian PUI Literasi dan Seni dalam Pendidikan', volume: '',
  },
  {
    id: 'pub-lanskap-linguistik-rkli-2026', type: 'penelitian',
    title: 'Penelitian RKLI UM dan UNIMED: Peran Bahasa dalam Merepresentasikan Gender di Ruang Publik, Studi Lanskap Linguistik di Wilayah Perkotaan',
    authors: ['Nurenzia Yannuar'], year: 2026, venue: 'Skema RKLI, kolaborasi UM dan UNIMED', volume: '',
  },
  {
    id: 'pub-hedging-prabowo-2026', type: 'penelitian',
    title: 'Penelitian Kolaborasi UNIMED dan UI: Strategi Hedging pada Pidato Presiden Prabowo dalam Penanganan Bencana Banjir di Sumatera',
    authors: [A.rs, A.hf, A.tr, A.wt, 'Nazarudin', 'Dien Rovita'], year: 2026, venue: 'Kolaborasi tim UNIMED dan tim UI', volume: '',
  },
  {
    id: 'pub-bahan-ajar-vr-sd-2026', type: 'penelitian',
    title: 'Pengembangan Bahan Ajar Literasi Bahasa Indonesia dan Seni Budaya Berbantuan Virtual Reality untuk Meningkatkan Kompetensi Literasi Siswa SD di Kota Medan',
    authors: [A.tr, A.hf, A.wt, A.th, A.os, A.rs], year: 2026, venue: 'Penelitian PUI Literasi dan Seni dalam Pendidikan', volume: '',
  },
];

export const kerjasamaSeed = [
  {
    id: 'ker-1', scope: 'dalam-negeri', partner: 'Universitas Negeri Malang', kind: 'Kolaborasi riset',
    summary: 'Mitra kolaborasi riset skema RKLI. Disebut dalam ucapan terima kasih jurnal "Gendered Digital Vulnerabilities" (2026).',
  },
  {
    id: 'ker-2', scope: 'dalam-negeri', partner: 'Universitas Pendidikan Indonesia', kind: 'Kolaborasi riset',
    summary: 'Mitra kolaborasi riset yang disebut dalam ucapan terima kasih jurnal yang sama.',
  },
  {
    id: 'ker-3', scope: 'dalam-negeri', partner: 'ALPTKNI melalui skema RKLI', kind: 'Skema pendanaan',
    summary: 'Skema Collaborative Research of Indonesian Teacher Training Institutes (RKLI) di bawah Asosiasi Lembaga Penelitian dan Pengabdian kepada Masyarakat Perguruan Tinggi Kependidikan Negeri Indonesia (ALPTKNI), dengan supervisi LPPM UNIMED. Mendanai riset jurnal "Gendered Digital Vulnerabilities".',
  },
  {
    id: 'ker-fib-ui', scope: 'dalam-negeri', partner: 'Fakultas Ilmu Budaya Universitas Indonesia', kind: 'Kolaborasi riset dan pengabdian',
    since: '2025-12-15',
    summary: 'Setelah benchmarking 15 Desember 2025, kedua pihak sepakat menjajaki pengabdian masyarakat bersama, kolaborasi riset, dan kuliah umum. Tim UNIMED dan UI juga menggarap penelitian tentang strategi hedging pada pidato presiden.',
    content: doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Kerja sama ini bermula dari kunjungan benchmarking tim PUI. ' },
        { type: 'text', text: 'Baca uraian dan foto kegiatannya', marks: [{ type: 'link', attrs: { href: '/kegiatan/kunjungan/keg-benchmarking-fib-ui' } }] },
        { type: 'text', text: '.' },
      ],
    }),
  },
];

// Slide carousel beranda. Ubah, urutkan, atau ganti foto lewat /admin/slider.
export const sliderSeed = [
  { id: 'slide-1', order: 1, active: true, title: 'Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan', subtitle: 'Universitas Negeri Medan, sejak 2024', image: img(FIB, 2), linkUrl: '/tentang/sejarah', ctaLabel: 'Kenali pusat ini' },
  { id: 'slide-2', order: 2, active: true, title: 'Benchmarking pusat riset ke FIB Universitas Indonesia', subtitle: '15 Desember 2025, Gedung Dekanat FIB UI', image: img(FIB, 1), linkUrl: '/kegiatan/kunjungan/keg-benchmarking-fib-ui', ctaLabel: 'Lihat kegiatan' },
  { id: 'slide-3', order: 3, active: true, title: 'Kunjungan ke Faculty of Art and Design ITB', subtitle: 'Belajar dari pengelola fakultas mitra', image: img(FSRD, 1), linkUrl: '/kegiatan/kunjungan/keg-kunjungan-fsrd-itb', ctaLabel: 'Lihat kegiatan' },
  { id: 'slide-4', order: 4, active: true, title: 'Siswa mencoba Virtual Reality di SD Terpadu Muhammadiyah 36 Medan', subtitle: 'Dokumentasi kegiatan di sekolah dasar', image: img(SD1, 1), linkUrl: '/kegiatan/kunjungan/keg-vr-sdtp-muhammadiyah-36', ctaLabel: 'Lihat kegiatan' },
];
