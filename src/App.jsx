import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';

// Setiap halaman selain beranda menjadi chunk sendiri dan baru diunduh saat dikunjungi.
const Sejarah = lazy(() => import('./pages/tentang/Sejarah.jsx'));
const ProgramKerja = lazy(() => import('./pages/tentang/ProgramKerja.jsx'));
const VisiMisi = lazy(() => import('./pages/tentang/VisiMisi.jsx'));
const Struktur = lazy(() => import('./pages/tentang/Struktur.jsx'));
const Pendaftaran = lazy(() => import('./pages/Pendaftaran.jsx'));
const Anggota = lazy(() => import('./pages/Anggota.jsx'));
const Publikasi = lazy(() => import('./pages/Publikasi.jsx'));
const BacaPublikasi = lazy(() => import('./pages/BacaPublikasi.jsx'));
const Kegiatan = lazy(() => import('./pages/Kegiatan.jsx'));
const KegiatanDetail = lazy(() => import('./pages/KegiatanDetail.jsx'));
const Kerjasama = lazy(() => import('./pages/Kerjasama.jsx'));
const KerjasamaDetail = lazy(() => import('./pages/KerjasamaDetail.jsx'));
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const RegisterRequest = lazy(() => import('./pages/auth/RegisterRequest.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminCollection = lazy(() => import('./pages/admin/AdminCollection.jsx'));
const AdminSorotan = lazy(() => import('./pages/admin/AdminSorotan.jsx'));
const AdminPendaftar = lazy(() => import('./pages/admin/AdminPendaftar.jsx'));
const AdminPengguna = lazy(() => import('./pages/admin/AdminPengguna.jsx'));
const AdminPengajuan = lazy(() => import('./pages/admin/AdminPengajuan.jsx'));
const AdminAkun = lazy(() => import('./pages/admin/AdminAkun.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />

        <Route path="tentang/sejarah" element={<Sejarah />} />
        <Route path="tentang/program-kerja" element={<ProgramKerja />} />
        <Route path="tentang/visi-misi" element={<VisiMisi />} />
        <Route path="tentang/struktur-organisasi" element={<Struktur />} />

        <Route path="keanggotaan/pendaftaran" element={<Pendaftaran />} />
        <Route path="keanggotaan/anggota" element={<Anggota />} />

        <Route path="publikasi/penelitian" element={<Publikasi type="penelitian" />} />
        <Route path="publikasi/pengabdian" element={<Publikasi type="pengabdian" />} />
        <Route path="publikasi/jurnal" element={<Publikasi type="jurnal" />} />
        <Route path="publikasi/baca/:id" element={<BacaPublikasi />} />

        <Route path="kegiatan/workshop" element={<Kegiatan type="workshop" />} />
        <Route path="kegiatan/seminar" element={<Kegiatan type="seminar" />} />
        <Route path="kegiatan/:type/:id" element={<KegiatanDetail />} />

        <Route path="kerjasama/dalam-negeri" element={<Kerjasama scope="dalam-negeri" />} />
        <Route path="kerjasama/luar-negeri" element={<Kerjasama scope="luar-negeri" />} />
        <Route path="kerjasama/:scope/:id" element={<KerjasamaDetail />} />

        <Route path="masuk" element={<Login />} />
        <Route path="daftar-akun" element={<RegisterRequest />} />
        <Route path="lupa-sandi" element={<ForgotPassword />} />

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="sorotan" element={<AdminSorotan />} />
          <Route path="pendaftar" element={<AdminPendaftar />} />
          <Route path="pengguna" element={<AdminPengguna />} />
          <Route path="pengajuan" element={<AdminPengajuan />} />
          <Route path="akun" element={<AdminAkun />} />
          <Route path=":resource" element={<AdminCollection />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
