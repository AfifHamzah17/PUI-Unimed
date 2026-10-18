// Teks kaya disimpan sebagai JSON ProseMirror/Tiptap, BUKAN HTML. Server membangun ulang pohon dari daftar putih
// (jenis simpul, penanda, atribut) sehingga skrip atau atribut sembarang tidak mungkin tersimpan, dan frontend
// merender JSON itu menjadi elemen React tanpa dangerouslySetInnerHTML. Modul ini murni (tanpa API Node)
// agar dipakai bersama oleh backend dan frontend mode lokal.

const MAX_NODES = 4000;
const MAX_DEPTH = 10;
const MAX_TEXT = 80_000;

const IMAGE_URL = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/;
const LINK_URL = /^(https?:\/\/[^\s]+|mailto:[^\s]+|\/(?!\/)[^\s]*)$/;

const INLINE = ['text', 'hardBreak'];
const BLOCK = ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'horizontalRule', 'image'];
const ALLOWED_CHILDREN = {
  doc: BLOCK,
  paragraph: INLINE,
  heading: INLINE,
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  listItem: ['paragraph', 'bulletList', 'orderedList'],
  blockquote: ['paragraph', 'heading', 'bulletList', 'orderedList'],
  codeBlock: ['text'],
};
const SIMPLE_MARKS = new Set(['bold', 'italic', 'strike', 'code']);

class RichError extends Error {}

const hasSubstance = (n) => n.type === 'text' || n.type === 'image' || n.type === 'horizontalRule' || (n.content ?? []).some(hasSubstance);

function marks(raw) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.length > 6) throw new RichError('Format teks tidak valid.');
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') throw new RichError('Format teks tidak valid.');
    if (SIMPLE_MARKS.has(m.type)) out.push({ type: m.type });
    else if (m.type === 'link') {
      const href = typeof m.attrs?.href === 'string' ? m.attrs.href.trim() : '';
      if (href.length <= 500 && LINK_URL.test(href)) out.push({ type: 'link', attrs: { href } }); // href berbahaya dibuang diam-diam
    } else throw new RichError(`Gaya teks "${String(m.type).slice(0, 30)}" tidak diizinkan.`);
  }
  return out.length ? out : undefined;
}

function node(n, parentType, depth, st) {
  if (!n || typeof n !== 'object' || typeof n.type !== 'string') throw new RichError('Struktur konten tidak valid.');
  st.nodes += 1;
  if (st.nodes > MAX_NODES) throw new RichError('Konten terlalu panjang.');
  if (depth > MAX_DEPTH) throw new RichError('Konten terlalu bersarang.');
  if (!ALLOWED_CHILDREN[parentType]?.includes(n.type)) throw new RichError(`Elemen "${n.type.slice(0, 30)}" tidak diizinkan di sini.`);

  switch (n.type) {
    case 'text': {
      if (typeof n.text !== 'string') throw new RichError('Teks tidak valid.');
      if (n.text === '') return null;
      st.text += n.text.length;
      if (st.text > MAX_TEXT) throw new RichError('Konten terlalu panjang.');
      const m = parentType === 'codeBlock' ? undefined : marks(n.marks);
      return m ? { type: 'text', text: n.text, marks: m } : { type: 'text', text: n.text };
    }
    case 'hardBreak':
    case 'horizontalRule':
      return { type: n.type };
    case 'image': {
      const src = typeof n.attrs?.src === 'string' ? n.attrs.src.trim() : '';
      if (src.length > 500 || !IMAGE_URL.test(src)) return null; // gambar dengan alamat tidak sah dibuang
      const alt = typeof n.attrs?.alt === 'string' ? n.attrs.alt.slice(0, 200) : '';
      return { type: 'image', attrs: { src, alt } };
    }
    default: {
      if (n.content !== undefined && !Array.isArray(n.content)) throw new RichError('Struktur konten tidak valid.');
      const kids = (n.content ?? []).map((c) => node(c, n.type, depth + 1, st)).filter(Boolean);
      const out = { type: n.type };
      if (n.type === 'heading') {
        const lv = Number(n.attrs?.level);
        out.attrs = { level: lv === 3 || lv === 4 ? lv : 2 };
      }
      if (kids.length) out.content = kids;
      return out;
    }
  }
}

/** Mengembalikan { value } (pohon bersih atau null bila kosong) atau { error }. */
export function sanitizeRich(raw, label = 'Konten') {
  if (raw === null || raw === undefined || raw === '') return { value: null };
  if (typeof raw !== 'object' || Array.isArray(raw) || raw.type !== 'doc') return { error: `${label} tidak valid.` };
  if (raw.content !== undefined && !Array.isArray(raw.content)) return { error: `${label} tidak valid.` };
  try {
    const st = { nodes: 0, text: 0 };
    const content = (raw.content ?? []).map((c) => node(c, 'doc', 1, st)).filter(Boolean);
    // Dokumen kosong bawaan editor (satu paragraf tanpa isi) disimpan sebagai null.
    return { value: content.some(hasSubstance) ? { type: 'doc', content } : null };
  } catch (e) {
    if (e instanceof RichError) return { error: `${label}: ${e.message}` };
    throw e;
  }
}

/** Teks polos dari dokumen, berguna untuk ringkasan dan pencarian. */
export function richToText(doc, max = 400) {
  if (!doc) return '';
  const parts = [];
  const walk = (n) => {
    if (n.type === 'text') parts.push(n.text);
    else if (n.type === 'hardBreak') parts.push(' ');
    (n.content ?? []).forEach(walk);
    if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(n.type)) parts.push(' ');
  };
  walk(doc);
  return parts.join('').replace(/\s+/g, ' ').trim().slice(0, max);
}
