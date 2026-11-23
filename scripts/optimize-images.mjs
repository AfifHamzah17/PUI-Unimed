// Jalankan: npm run images
// Membaca assets-src/ lalu menulis versi terkompresi (WebP) dan ikon PWA ke public/.
//   assets-src/foto/*.jpg                   -> public/foto/<nama>-160|240.webp   (foto anggota, crop 4:5)
//   assets-src/celae-lockup.png, celae-mark.png, unimed.png  -> logo dan ikon
//   assets-src/kegiatan/<slug>/NN.jpg       -> public/kegiatan/<slug>/NN-480|960|1600.webp
// Menambah kegiatan baru: taruh foto di assets-src/kegiatan/<slug>/ (urutan nama berkas = urutan galeri), jalankan
// skrip ini, lalu isi alamat `/kegiatan/<slug>/NN-1600.webp` di admin. Tampilan otomatis memilih ukuran yang pas.
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';

const SRC = 'assets-src';
const OUT = 'public';
await mkdir(`${OUT}/foto`, { recursive: true });
await mkdir(`${OUT}/icons`, { recursive: true });

// 1. Foto anggota: crop 4:5 dari bagian atas (kepala dan bahu), dua ukuran.
const fotos = (await readdir(`${SRC}/foto`)).filter((f) => /\.(jpe?g|png)$/i.test(f));
for (const file of fotos) {
  const { name } = parse(file);
  for (const w of [160, 240]) {
    await sharp(join(SRC, 'foto', file))
      .resize({ width: w, height: Math.round(w * 1.25), fit: 'cover', position: 'north' })
      .webp({ quality: 76, effort: 6 })
      .toFile(`${OUT}/foto/${name}-${w}.webp`);
  }
}

// 2. Logo. Lockup dan tanda CeLAE memakai latar transparan; lambang UNIMED tetap ada untuk keterangan "dibina oleh".
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
for (const w of [320, 640]) {
  await sharp(`${SRC}/celae-lockup.png`).resize({ width: w }).webp({ quality: 90, effort: 6, alphaQuality: 95 }).toFile(`${OUT}/celae-lockup-${w}.webp`);
}
for (const w of [96, 192]) {
  await sharp(`${SRC}/celae-mark.png`).resize({ width: w }).webp({ quality: 90, effort: 6, alphaQuality: 95 }).toFile(`${OUT}/celae-mark-${w}.webp`);
}
const square = async (file, size, pad = 0, bg = transparent) => {
  const inner = Math.round(size * (1 - pad * 2));
  const buf = await sharp(`${SRC}/${file}`).resize({ width: inner, height: inner, fit: 'contain', background: transparent }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } }).composite([{ input: buf, gravity: 'center' }]);
};
for (const s of [96, 320]) {
  await (await square('unimed.png', s)).webp({ quality: 88, effort: 6, alphaQuality: 90 }).toFile(`${OUT}/logo-${s}.webp`);
}
const paper = '#fbfaf6';
await (await square('celae-mark.png', 32, 0.02, paper)).png({ compressionLevel: 9 }).toFile(`${OUT}/favicon-32.png`);
await (await square('celae-mark.png', 192, 0.1, paper)).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-192.png`);
await (await square('celae-mark.png', 512, 0.1, paper)).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-512.png`);
// Maskable: isi logo harus berada di zona aman 80% tengah.
await (await square('celae-mark.png', 512, 0.22, paper)).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-maskable-512.png`);
await (await square('celae-mark.png', 180, 0.12, paper)).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/apple-touch-icon.png`);

// 3. Gambar pratinjau sosial 1200x630.
const lockup = await sharp(`${SRC}/celae-lockup.png`).resize({ width: 720 }).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#fbfaf6"/>
  <rect x="72" y="72" width="64" height="6" fill="#c99a2e"/>
  <text x="72" y="470" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#1e2646">Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan</text>
  <text x="72" y="520" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#5c6580">Universitas Negeri Medan, di bawah LPPM</text>
</svg>`;
await sharp(Buffer.from(svg)).composite([{ input: lockup, left: 72, top: 140 }]).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/og-image.png`);

// 4. Foto kegiatan: tiga ukuran per foto (kartu 480/960, hero dan lightbox 1600).
const kegiatanRoot = `${SRC}/kegiatan`;
const slugs = (await readdir(kegiatanRoot, { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory());
for (const dir of slugs) {
  await mkdir(`${OUT}/kegiatan/${dir.name}`, { recursive: true });
  const files = (await readdir(join(kegiatanRoot, dir.name))).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  for (const file of files) {
    const { name } = parse(file);
    for (const [w, q] of [[480, 72], [960, 72], [1600, 70]]) {
      await sharp(join(kegiatanRoot, dir.name, file))
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q, effort: 5 })
        .toFile(`${OUT}/kegiatan/${dir.name}/${name}-${w}.webp`);
    }
  }
}
console.log('Selesai.');
