// ============================================================
// SEMUA TEKS STATIS WEBSITE ADA DI SINI.
// Konten dinamis (kegiatan, publikasi, kerja sama) ada di data/seed.js
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

// Menu utama. Setiap anak punya deskripsi singkat untuk panel menu.
export const nav = [
  { label: 'Beranda', path: '/' },
  {
    label: 'Tentang',
    children: [
      { label: 'Sejarah', path: '/tentang/sejarah', desc: 'Dari gagasan hingga berdirinya pusat unggulan.' },
      { label: 'Program Kerja', path: '/tentang/program-kerja', desc: 'Lima arah kerja riset, pelatihan, dan kolaborasi.' },
      { label: 'Visi dan Misi', path: '/tentang/visi-misi', desc: 'Arah jangka panjang dan komitmen kami.' },
      { label: 'Struktur Organisasi', path: '/tentang/struktur-organisasi', desc: 'Ketua, sekretaris, dan tim pelaksana.' },
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
      { label: 'Workshop', path: '/kegiatan/workshop', desc: 'Pelatihan praktik untuk pendidik dan mahasiswa.' },
      { label: 'Seminar', path: '/kegiatan/seminar', desc: 'Forum diskusi hasil riset dan gagasan baru.' },
    ],
  },
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
//
// SEKRETARIS: struktur sudah menyediakan posisinya. Cukup ubah `role`
// salah satu anggota menjadi 'Sekretaris' dan halaman Struktur, Anggota,
// serta Beranda otomatis menyesuaikan. Selama belum ada, halaman Struktur
// menampilkan slot "belum diisi".
// ------------------------------------------------------------
export const members = [
  {
    initials: 'TR',
    photo: 'tengku-ratna',
    name: 'Dr. Tengku Ratna Soraya, S.Pd., M.Pd.',
    role: 'Ketua',
    institution: 'FBS UNIMED',
    expertise: 'Ilmu Pendidikan Bahasa',
  },
  { initials: 'HF', photo: 'hesti', name: 'Dr. Hesti Fibriasari, S.Pd., M.Hum', role: 'Anggota 1' },
  { initials: 'TH', photo: 'trisnawati', name: 'Trisnawati Hutagalung, S.Pd., M.Pd', role: 'Anggota 2' },
  { initials: 'WT', photo: 'wahyu', name: 'Dr. Wahyu Tri Atmojo, M.Hum', role: 'Anggota 3' },
  { initials: 'RS', photo: 'rita', name: 'Dr. Rita Suswati, S.Pd., M.Hum.', role: 'Anggota 4' },
  { initials: 'OS', photo: 'oksari', name: 'Oksari A. Sihaloho, M.Pd', role: 'Anggota 5' },
];

export const isKetua = (m) => /^ketua$/i.test(m.role);
export const isSekretaris = (m) => /^sekretaris$/i.test(m.role);

/** Pecah daftar anggota menjadi tiga tingkat struktur. */
export function groupMembers(list = members) {
  return {
    ketua: list.find(isKetua) ?? null,
    sekretaris: list.find(isSekretaris) ?? null,
    tim: list.filter((m) => !isKetua(m) && !isSekretaris(m)),
  };
}
