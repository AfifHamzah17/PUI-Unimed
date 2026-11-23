// ============================================================
// SEMUA TEKS STATIS WEBSITE ADA DI SINI.
// Konten dinamis (kegiatan, publikasi, kerja sama) ada di backend; isi awalnya di data/seed.js
// dan nantinya datang dari API.
// ============================================================

export const org = {
  short: 'PUI Literasi dan Seni dalam Pendidikan',
  name: 'Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan',
  parent: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UNIMED',
  university: 'Universitas Negeri Medan',
  founded: 2024,
  // Isi kontak bila sudah ada. Yang kosong tidak ditampilkan.
  address: 'Jl. Willem Iskandar Pasar V, Medan Estate, Deli Serdang, Sumatera Utara 20221',
  email: '',
  phone: '',
  hours: '',
};

// Akun media sosial. Isi `href` dengan alamat profil lengkap (https://...). Ikon yang `href`-nya masih kosong
// tampil redup dan tidak bisa diklik, supaya tidak ada tautan mati di footer.
// Video di halaman /video. `sources` dicoba berurutan (berkas sendiri paling andal untuk loop); bila semuanya gagal dan
// `driveUrl` diisi, dicoba aliran langsung Drive, lalu pemutar Drive (tanpa loop). Berkas Drive harus dibagikan
// "Siapa saja yang memiliki link". Kosongkan `sources` bila ingin hanya memakai tautan Drive.
export const videoPage = {
  title: 'Video',
  lead: 'Cuplikan kegiatan PUI Literasi dan Seni dalam Pendidikan, diputar berulang.',
  // Kosong = langsung memakai video Drive di bawah. Untuk loop yang pasti jalan, taruh mp4 di public/video/ lalu isi
  // mis. sources: ['/video/nama-berkas.mp4'] dan poster: '/video/nama-poster.webp'.
  sources: ['/video/video-saya.mp4'],
  poster: '',
  driveUrl: 'https://drive.google.com/file/d/1MbRXRfxH8geqTcKHgknONBDCfYSvH7ez/view?usp=drivesdk',
};

export const social = [
  { key: 'facebook', label: 'Facebook', href: '' },
  { key: 'instagram', label: 'Instagram', href: '' },
  { key: 'tiktok', label: 'TikTok', href: '' },
];

// Menu utama. Setiap anak punya deskripsi singkat untuk panel menu.
export const nav = [
  { label: 'Beranda', path: '/' },
  {
    label: 'Tentang',
    children: [
      { label: 'Sejarah', path: '/tentang/sejarah', desc: 'Dari gagasan hingga berdirinya pusat unggulan.' },
      { label: 'Program Kerja', path: '/tentang/program-kerja', desc: 'Lima arah kerja riset, pelatihan, dan kolaborasi.' },
      { label: 'Visi dan Misi', path: '/tentang/visi-misi', desc: 'Arah jangka panjang dan komitmen kami.' },
      { label: 'Struktur Organisasi', path: '/tentang/struktur-organisasi', desc: 'Ketua, wakil ketua, sekretaris, dan tiga koordinator.' },
    ],
  },
  {
    label: 'Keanggotaan',
    children: [
      { label: 'Pendaftaran', path: '/keanggotaan/pendaftaran', desc: 'Ajukan diri sebagai anggota atau mitra.' },
      { label: 'Daftar Nama Anggota', path: '/keanggotaan/anggota', desc: 'Orang-orang di balik pusat ini.' },
    ],
  },
  {
    label: 'Publikasi Ilmiah',
    children: [
      { label: 'Penelitian', path: '/publikasi/penelitian', desc: 'Hasil riset yang dikerjakan tim.' },
      { label: 'Pengabdian kepada Masyarakat', path: '/publikasi/pengabdian', desc: 'Karya yang langsung menyentuh sekolah dan komunitas.' },
      { label: 'Jurnal', path: '/publikasi/jurnal', desc: 'Artikel terbit, bisa dibaca langsung di sini.' },
    ],
  },
  {
    label: 'Kegiatan',
    children: [
      { label: 'Semua Kegiatan', path: '/kegiatan', desc: 'Workshop, seminar, dan kunjungan, dari yang terbaru.' },
      { label: 'Workshop', path: '/kegiatan/workshop', desc: 'Pelatihan praktik untuk pendidik dan mahasiswa.' },
      { label: 'Seminar', path: '/kegiatan/seminar', desc: 'Forum diskusi hasil riset dan gagasan baru.' },
      { label: 'Benchmarking dan Kunjungan', path: '/kegiatan/kunjungan', desc: 'Belajar tata kelola pusat riset dari mitra.' },
    ],
  },
  { label: 'Video', path: '/video' },
  {
    label: 'Kerjasama',
    children: [
      { label: 'Kerjasama Dalam Negeri', path: '/kerjasama/dalam-negeri', desc: 'Mitra perguruan tinggi dan lembaga di Indonesia.' },
      { label: 'Kerjasama Luar Negeri', path: '/kerjasama/luar-negeri', desc: 'Jejaring riset lintas negara.' },
    ],
  },
];

export const history = [
  'Pada tahun 2024 Universitas Negeri Medan mendirikan Pusat Unggulan IPTEK (PUI) Literasi dan Seni dalam Pendidikan. PUI Literasi dan Seni dalam Pendidikan berada di bawah Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UNIMED.',
  'PUI ini lahir dari komitmen institusi dalam mengembangkan penelitian dan inovasi berbasis literasi serta seni dalam dunia pendidikan. Perkembangan pusat ini tidak terlepas dari perjalanan panjang UNIMED sebagai salah satu institusi pendidikan tinggi yang memiliki fokus kuat dalam bidang kependidikan, seni, dan sains.',
  'Sejak awal pendiriannya, UNIMED telah berperan aktif dalam membangun ekosistem akademik yang mendukung pengembangan literasi dan seni. Dengan bertambahnya kebutuhan akan pendekatan interdisipliner dalam pendidikan, UNIMED mulai merancang program-program riset yang berorientasi pada penguatan literasi dan seni sebagai bagian dari strategi pembelajaran modern.',
  'Pada tahun-tahun awal abad ke-21, berbagai penelitian dan inovasi di UNIMED dalam bidang literasi dan seni semakin mendapat perhatian. Akademisi dari berbagai disiplin ilmu mulai berkolaborasi untuk menciptakan model pembelajaran yang inovatif, menggabungkan teknologi, seni, dan literasi guna meningkatkan kualitas pendidikan. Hasil dari penelitian ini kemudian melahirkan inisiatif untuk membentuk pusat unggulan yang dapat menjadi wadah pengembangan ilmu dan inovasi lebih lanjut.',
  'Dengan dukungan dari pemerintah, mitra industri, dan komunitas akademik, Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan resmi didirikan di UNIMED. Keberadaan pusat ini bertujuan untuk mengembangkan riset-riset unggulan, memfasilitasi inovasi pendidikan berbasis seni dan literasi, serta menjalin kerja sama dengan berbagai lembaga pendidikan dan kebudayaan di dalam maupun luar negeri.',
  'Hingga saat ini, PUI Literasi dan Seni dalam Pendidikan di UNIMED terus berkembang, menghasilkan berbagai penelitian, publikasi ilmiah, serta program-program pelatihan yang mendukung peningkatan kualitas pendidikan di Indonesia. Dengan visi untuk menjadi pusat unggulan dalam penelitian dan inovasi pendidikan berbasis literasi dan seni, UNIMED melalui PUI ini terus berkontribusi dalam menciptakan ekosistem pendidikan yang dinamis, kreatif, dan berbasis ilmu pengetahuan.',
  'Ke depan, Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan di UNIMED berkomitmen untuk terus berinovasi, berkolaborasi, serta memberikan dampak positif bagi dunia pendidikan di Indonesia dan global.',
];

export const programs = [
  {
    title: 'Pengembangan Riset dan Inovasi',
    desc: 'Penelitian unggulan dalam literasi dan seni yang berkontribusi pada kemajuan pendidikan.',
    items: ['Riset Kolaboratif', 'Publikasi Ilmiah'],
  },
  {
    title: 'Pelatihan dan Pengembangan Kapasitas',
    desc: 'Peningkatan kapasitas akademik dan profesional pendidik serta mahasiswa.',
    items: ['Workshop dan Seminar', 'Pelatihan'],
  },
  {
    title: 'Komunitas',
    desc: 'Membangun jejaring akademisi dan pegiat literasi serta seni.',
    items: [],
  },
  {
    title: 'Kolaborasi Strategis',
    desc: 'Kemitraan dengan institusi pendidikan, industri kreatif, dan lembaga penelitian nasional maupun internasional.',
    items: [],
  },
  {
    title: 'Penyelenggaraan Festival dan Kompetisi Seni dan Literasi',
    desc: 'Mendorong budaya literasi dan apresiasi seni melalui festival dan kompetisi ilmiah maupun seni.',
    items: [],
  },
];

export const vision =
  'Menjadi Pusat Unggulan dalam Penelitian, Inovasi, dan Pengembangan Literasi serta Seni dalam Pendidikan yang berlandaskan pada harmoni intelektual, kreativitas tanpa batas, serta kemanusiaan yang mencerdaskan, guna membangun peradaban yang lebih berbudaya, berdaya saing, dan berkelanjutan.';

export const missions = [
  {
    title: 'Mengembangkan riset dan inovasi',
    desc: 'Menghasilkan penelitian unggulan dalam literasi dan seni yang berkontribusi pada kemajuan pendidikan dan peradaban.',
  },
  {
    title: 'Meningkatkan kapasitas akademik dan profesional',
    desc: 'Pelatihan dan pengembangan berbasis seni dan literasi bagi pendidik serta mahasiswa.',
  },
  {
    title: 'Menciptakan media pembelajaran digital',
    desc: 'Media pembelajaran berbasis teknologi digital untuk mendukung pembelajaran literasi dan seni.',
  },
  {
    title: 'Membangun kemitraan strategis',
    desc: 'Bermitra dengan institusi pendidikan, industri kreatif, serta lembaga penelitian nasional dan internasional.',
  },
  {
    title: 'Memberdayakan masyarakat melalui pendidikan berbasis seni dan literasi',
    desc: 'Mendorong budaya literasi dan apresiasi seni dalam masyarakat melalui kegiatan akademik, kompetisi, dan festival ilmiah serta seni.',
  },
];

// ------------------------------------------------------------
// Anggota. `photo` adalah nama dasar berkas di public/foto
// (mis. 'rita' -> /foto/rita-160.webp dan /foto/rita-240.webp).
// `role` memakai bahasa Indonesia, `roleEn` adalah padanan resminya dan tampil sebagai keterangan kedua.
// Yang berawalan "Koordinator" otomatis masuk tingkat ketiga di halaman Struktur Organisasi.
// ------------------------------------------------------------
export const members = [
  {
    initials: 'TR',
    photo: 'tengku-ratna',
    name: 'Dr. Tengku Ratna Soraya, M.Pd.',
    role: 'Ketua',
    roleEn: 'Chairman',
    institution: 'FBS UNIMED',
    expertise: 'Ilmu Pendidikan Bahasa',
  },
  { initials: 'HF', photo: 'hesti', name: 'Dr. Hesti Fibriasari, M.Hum.', role: 'Wakil Ketua', roleEn: 'Deputy Chairman' },
  { initials: 'TH', photo: 'trisnawati', name: 'Trisnawati Hutagalung, S.Pd., M.Pd.', role: 'Sekretaris', roleEn: 'Secretary' },
  {
    initials: 'WT',
    photo: 'wahyu',
    name: 'Dr. Wahyu Tri Atmojo, M.Hum.',
    role: 'Koordinator Inovasi Pendidikan Literasi dan Seni',
    roleEn: 'Coordinator of Literacy and Arts Education Innovation',
  },
  {
    initials: 'RS',
    photo: 'rita',
    name: 'Dr. Rita Suswati, M.Hum.',
    role: 'Koordinator Riset, Publikasi, dan Kekayaan Intelektual',
    roleEn: 'Coordinator of Research, Publication and Intellectual Property',
  },
  {
    initials: 'OS',
    photo: 'oksari',
    name: 'Oksari A. Sihaloho, S.Pd., M.Pd.',
    role: 'Koordinator Kemitraan, Diseminasi, dan Pengabdian kepada Masyarakat',
    roleEn: 'Coordinator of Partnership, Dissemination and Community Service',
  },
];

export const isKetua = (m) => /^ketua$/i.test(m.role);
export const isWakil = (m) => /^wakil ketua$/i.test(m.role);
export const isSekretaris = (m) => /^sekretaris$/i.test(m.role);
export const isKoordinator = (m) => /^koordinator/i.test(m.role);

/** Urutan tampil: ketua, wakil, sekretaris, lalu koordinator. */
export const rankOf = (m) => (isKetua(m) ? 0 : isWakil(m) ? 1 : isSekretaris(m) ? 2 : 3);

/** Pecah daftar anggota menjadi tiga tingkat struktur. */
export function groupMembers(list = members) {
  return {
    ketua: list.find(isKetua) ?? null,
    wakil: list.find(isWakil) ?? null,
    sekretaris: list.find(isSekretaris) ?? null,
    koordinator: list.filter(isKoordinator),
  };
}