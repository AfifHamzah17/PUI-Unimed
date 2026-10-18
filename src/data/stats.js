// ANGKA CONTOH. Ganti dengan data dari API bila backend sudah siap.
// Tambah satu objek lagi di `stats` untuk membuat kartu keempat; tata letak menyesuaikan sendiri.
export const stats = [
  {
    id: 'jurnal',
    label: 'Artikel jurnal terbit pada 2026',
    value: 17,
    note: 'naik dari 11 artikel pada 2025',
    trend: [2, 3, 3, 5, 6, 8, 9, 12, 14, 17],
    featured: true,
  },
  {
    id: 'peserta',
    label: 'Peserta workshop dan seminar',
    value: 1284,
    note: 'dari 9 kegiatan sepanjang tahun',
    trend: [90, 150, 210, 380, 520, 610, 840, 1010, 1284],
  },
  {
    id: 'mitra',
    label: 'Mitra kerja sama aktif',
    value: 11,
    note: '8 dalam negeri, 3 luar negeri',
    trend: [3, 4, 4, 6, 7, 9, 11],
  },
];

// Grafik batang bertumpuk: publikasi menurut jenis. Data contoh.
export const chartSeries = [
  { key: 'jurnal', label: 'Jurnal', tone: 'brand' },
  { key: 'penelitian', label: 'Penelitian', tone: 'soft' },
  { key: 'pengabdian', label: 'Pengabdian', tone: 'accent' },
];

export const chartViews = {
  tahun: {
    label: 'Per tahun',
    data: [
      { label: '2024', values: { jurnal: 5, penelitian: 4, pengabdian: 3 } },
      { label: '2025', values: { jurnal: 11, penelitian: 9, pengabdian: 6 } },
      { label: '2026', values: { jurnal: 17, penelitian: 12, pengabdian: 8 } },
    ],
  },
  bulan: {
    label: 'Per bulan, 2026',
    data: [
      ['Jan', 1, 1, 0],
      ['Feb', 1, 2, 1],
      ['Mar', 2, 1, 1],
      ['Apr', 1, 2, 0],
      ['Mei', 2, 1, 1],
      ['Jun', 3, 1, 1],
      ['Jul', 2, 2, 2],
      ['Agu', 3, 1, 1],
      ['Sep', 2, 1, 1],
    ].map(([label, jurnal, penelitian, pengabdian]) => ({ label, values: { jurnal, penelitian, pengabdian } })),
  },
};
