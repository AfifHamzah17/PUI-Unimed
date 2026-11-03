import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowUUpLeft, ArrowUUpRight, ImageSquare, LinkSimple, ListBullets, ListNumbers, Minus, Quotes,
  TextB, TextHThree, TextHTwo, TextItalic, TextStrikethrough,
} from '@phosphor-icons/react';
import { Skeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';

const LINK_OK = /^(https?:\/\/\S+|mailto:\S+|\/(?!\/)\S*)$/;
const IMAGE_OK = /^(\/(?!\/)\S*|https:\/\/\S+)$/;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE = 5 * 1024 * 1024;

function Btn({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      // mousedown dicegah agar fokus dan seleksi teks di editor tidak hilang saat tombol ditekan
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-ink/[0.07] disabled:opacity-35',
        active && 'bg-brand text-on-brand hover:bg-brand'
      )}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />;

/**
 * Editor teks kaya berbasis Tiptap (ProseMirror). Nilai masuk/keluar berupa JSON dokumen (atau null bila kosong);
 * server membersihkan JSON itu lagi sebelum menyimpan. Dimuat malas, hanya di halaman admin.
 *
 * onUploadImage(file) -> Promise<url>; bila tidak diberikan, gambar disisipkan lewat alamat https://.
 */
export default function RichEditor({ value, onChange, onUploadImage, placeholder = 'Tulis isi di sini...', label = 'Isi' }) {
  const latest = useRef(onChange);
  latest.current = onChange;
  const timer = useRef(0);
  const fileRef = useRef(null);
  const [panel, setPanel] = useState(null); // null | 'link' | 'image'
  const [url, setUrl] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  const emit = (ed) => latest.current?.(ed.isEmpty ? null : ed.getJSON());

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? '',
    editorProps: { attributes: { class: 'min-h-[14rem] px-4 py-3 focus:outline-none', 'aria-label': label, role: 'textbox', 'aria-multiline': 'true' } },
    // Perubahan dikirim ke form setelah jeda 300 ms, dan langsung saat editor kehilangan fokus.
    onUpdate: ({ editor: ed }) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => emit(ed), 300);
    },
    onBlur: ({ editor: ed }) => {
      clearTimeout(timer.current);
      emit(ed);
    },
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!editor) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const chain = () => editor.chain().focus();
  const openPanel = (kind) => {
    setProblem('');
    setUrl(kind === 'link' ? editor.getAttributes('link').href ?? '' : '');
    setPanel(kind);
  };

  const applyLink = (e) => {
    e.preventDefault();
    const href = url.trim();
    if (!href) {
      chain().extendMarkRange('link').unsetLink().run();
    } else if (!LINK_OK.test(href)) {
      setProblem('Gunakan alamat https://, mailto:, atau yang diawali /');
      return;
    } else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else {
      chain().extendMarkRange('link').setLink({ href }).run();
    }
    setPanel(null);
  };

  const applyImageUrl = (e) => {
    e.preventDefault();
    const src = url.trim();
    if (!IMAGE_OK.test(src)) {
      setProblem('Alamat gambar harus diawali https:// atau /');
      return;
    }
    chain().setImage({ src, alt: '' }).run();
    setPanel(null);
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setProblem('Format gambar harus PNG, JPEG, atau WebP.') || setPanel('image');
    if (file.size > MAX_IMAGE) return setProblem('Ukuran gambar maksimal 5 MB.') || setPanel('image');
    setBusy(true);
    setProblem('');
    try {
      const src = await onUploadImage(file);
      chain().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run();
      setPanel(null);
    } catch (err) {
      setProblem(err.message);
      setPanel('image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rich-editor rounded-2xl border border-line bg-surface transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
      <div role="toolbar" aria-label="Pemformatan teks" className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
        <Btn label="Tebal" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}><TextB size={18} aria-hidden="true" /></Btn>
        <Btn label="Miring" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}><TextItalic size={18} aria-hidden="true" /></Btn>
        <Btn label="Coret" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}><TextStrikethrough size={18} aria-hidden="true" /></Btn>
        <Sep />
        <Btn label="Judul bagian" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}><TextHTwo size={18} aria-hidden="true" /></Btn>
        <Btn label="Anak judul" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}><TextHThree size={18} aria-hidden="true" /></Btn>
        <Sep />
        <Btn label="Daftar poin" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}><ListBullets size={18} aria-hidden="true" /></Btn>
        <Btn label="Daftar nomor" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}><ListNumbers size={18} aria-hidden="true" /></Btn>
        <Btn label="Kutipan" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}><Quotes size={18} aria-hidden="true" /></Btn>
        <Btn label="Garis pemisah" onClick={() => chain().setHorizontalRule().run()}><Minus size={18} aria-hidden="true" /></Btn>
        <Sep />
        <Btn label="Tautan" active={editor.isActive('link')} onClick={() => openPanel('link')}><LinkSimple size={18} aria-hidden="true" /></Btn>
        <Btn label="Sisipkan gambar" onClick={() => (onUploadImage ? fileRef.current?.click() : openPanel('image'))} disabled={busy}><ImageSquare size={18} aria-hidden="true" /></Btn>
        <Sep />
        <Btn label="Urungkan" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><ArrowUUpLeft size={18} aria-hidden="true" /></Btn>
        <Btn label="Ulangi" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><ArrowUUpRight size={18} aria-hidden="true" /></Btn>
        <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pickImage} />
      </div>

      {busy && <p className="border-b border-line bg-brand-soft px-4 py-2 text-sm" role="status">Mengunggah gambar...</p>}

      {panel && (
        <form onSubmit={panel === 'link' ? applyLink : applyImageUrl} className="flex flex-wrap items-center gap-2 border-b border-line bg-mist/60 p-2.5">
          <label className="sr-only" htmlFor="rte-url">{panel === 'link' ? 'Alamat tautan' : 'Alamat gambar'}</label>
          <input
            id="rte-url"
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setProblem(''); }}
            placeholder={panel === 'link' ? 'https://contoh.id atau kosongkan untuk melepas tautan' : 'https://.../gambar.webp'}
            className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none"
          />
          <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand">{panel === 'link' ? 'Terapkan' : 'Sisipkan'}</button>
          <button type="button" onClick={() => setPanel(null)} className="h-10 rounded-lg px-3 text-sm text-muted hover:bg-ink/5">Batal</button>
        </form>
      )}
      {problem && <p role="alert" className="border-b border-line px-4 py-2 text-sm font-medium text-danger">{problem}</p>}

      <EditorContent editor={editor} />
    </div>
  );
}
