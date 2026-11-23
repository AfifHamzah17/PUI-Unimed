// Foto kegiatan dibuat dalam tiga ukuran oleh `npm run images`: <nama>-480.webp, -960.webp, -1600.webp.
// Alamat apa pun yang mengikuti pola itu otomatis mendapat srcset; alamat lain (mis. unggahan ke Cloud Storage)
// dipakai apa adanya.
const RE = /^(.*)-(480|960|1600)\.webp$/;

/** Atribut <img> untuk alamat gambar: src menengah dan srcSet bila tersedia. */
export function responsive(src) {
  const m = RE.exec(src || '');
  if (!m) return { src };
  const base = m[1];
  return { src: `${base}-960.webp`, srcSet: `${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w` };
}

/** Versi terbesar untuk lightbox dan hero. */
export const fullSize = (src) => (RE.test(src || '') ? src.replace(RE, '$1-1600.webp') : src);
