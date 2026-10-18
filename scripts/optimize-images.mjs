// Jalankan: npm run images
// Membaca assets-src/ lalu menulis versi terkompresi (WebP) dan ikon PWA ke public/.
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

// 2. Logo: kanvas persegi transparan agar ikon tidak gepeng.
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const logoSquare = async (size, pad = 0, bg = transparent) => {
  const inner = Math.round(size * (1 - pad * 2));
  const buf = await sharp(`${SRC}/logo.png`)
    .resize({ width: inner, height: inner, fit: 'contain', background: transparent })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } }).composite([
    { input: buf, gravity: 'center' },
  ]);
};

for (const s of [96, 320]) {
  await (await logoSquare(s)).webp({ quality: 88, effort: 6, alphaQuality: 90 }).toFile(`${OUT}/logo-${s}.webp`);
}
await (await logoSquare(32, 0.04)).png({ compressionLevel: 9 }).toFile(`${OUT}/favicon-32.png`);
await (await logoSquare(192, 0.06, '#ffffff')).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-192.png`);
await (await logoSquare(512, 0.06, '#ffffff')).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-512.png`);
// Maskable: isi logo harus berada di zona aman 80% tengah.
await (await logoSquare(512, 0.2, '#ffffff')).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/icon-maskable-512.png`);
await (await logoSquare(180, 0.08, '#ffffff')).png({ compressionLevel: 9 }).toFile(`${OUT}/icons/apple-touch-icon.png`);

// 3. Gambar pratinjau sosial 1200x630.
const logoBuf = await (await logoSquare(360)).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><radialGradient id="g" cx="82%" cy="30%" r="70%"><stop offset="0" stop-color="#14744d" stop-opacity=".85"/><stop offset="1" stop-color="#0a2018" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="#0a2018"/><rect width="1200" height="630" fill="url(#g)"/>
  <rect x="72" y="72" width="64" height="6" fill="#e3a91a"/>
  <text x="72" y="190" font-family="DejaVu Serif, Georgia, serif" font-size="30" fill="#b9d3c5">Universitas Negeri Medan</text>
  <text x="72" y="300" font-family="DejaVu Serif, Georgia, serif" font-size="64" font-weight="700" fill="#f1f4ef">Pusat Unggulan IPTEK</text>
  <text x="72" y="380" font-family="DejaVu Serif, Georgia, serif" font-size="64" font-weight="700" fill="#f1f4ef">Literasi dan Seni</text>
  <text x="72" y="460" font-family="DejaVu Serif, Georgia, serif" font-size="64" font-weight="700" fill="#f1f4ef">dalam Pendidikan</text>
</svg>`;
await sharp(Buffer.from(svg)).composite([{ input: logoBuf, left: 790, top: 135 }]).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/og-image.png`);
console.log('Selesai.');
