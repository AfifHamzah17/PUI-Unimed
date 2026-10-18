import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImageSquare, Plus, Trash } from '@phosphor-icons/react';
import { adminApi } from '../../services/api.js';
import { cn } from '../../lib/cn.js';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX = 5 * 1024 * 1024;
const URL_OK = /^(\/(?!\/)\S*|https:\/\/\S+)$/;

/** Memeriksa dan mengunggah satu gambar; melempar Error berpesan Indonesia bila ditolak. */
async function uploadImage(file, onProgress) {
  if (!TYPES.includes(file.type)) throw new Error(`"${file.name}": format harus PNG, JPEG, atau WebP.`);
  if (file.size > MAX) throw new Error(`"${file.name}": ukuran maksimal 5 MB.`);
  return adminApi.upload(file, onProgress);
}

const btn = 'inline-flex h-10 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm font-medium transition hover:border-ink/50 hover:bg-ink/[0.04]';

function UrlInput({ onAdd, label }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const add = () => {
    const x = v.trim();
    if (!URL_OK.test(x)) return setErr('Alamat harus diawali https:// atau /');
    onAdd(x);
    setV('');
    setErr('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          aria-label={label}
          value={v}
          onChange={(e) => { setV(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="https://.../foto.webp"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        <button type="button" onClick={add} className={btn}>Pakai</button>
      </div>
      {err && <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-danger">{err}</p>}
    </div>
  );
}

/** Foto sampul tunggal. Unggah ke Cloud Storage bila backend aktif; selain itu cukup tempel alamat gambar. */
export function ImageField({ label, value, onChange, canUpload, error, hint }) {
  const input = useRef(null);
  const [state, setState] = useState({ busy: false, pct: 0, error: '' });

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setState({ busy: true, pct: 0, error: '' });
    try {
      onChange(await uploadImage(file, (pct) => setState((s) => ({ ...s, pct }))));
      setState({ busy: false, pct: 100, error: '' });
    } catch (err) {
      setState({ busy: false, pct: 0, error: err.message });
    }
  };

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-mist">
          {value ? (
            <img src={value} alt="Pratinjau sampul" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted"><ImageSquare size={30} aria-hidden="true" /></span>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div className="flex flex-wrap gap-2">
            {canUpload && (
              <>
                <button type="button" className={btn} disabled={state.busy} onClick={() => input.current?.click()}>
                  {state.busy ? `Mengunggah ${state.pct}%` : value ? 'Ganti foto' : 'Unggah foto'}
                </button>
                <input ref={input} type="file" accept={TYPES.join(',')} className="sr-only" tabIndex={-1} aria-label={`Pilih berkas ${label}`} onChange={pick} />
              </>
            )}
            {value && <button type="button" className={cn(btn, 'text-danger')} onClick={() => onChange('')}><Trash size={16} aria-hidden="true" /> Hapus</button>}
          </div>
          <UrlInput label={`Alamat ${label}`} onAdd={onChange} />
          <p className="text-[0.8125rem] text-muted">{hint ?? (canUpload ? 'PNG, JPEG, atau WebP, maksimal 5 MB. Atau tempel alamat gambar.' : 'Tempel alamat gambar https://. Unggah langsung tersedia setelah backend aktif.')}</p>
        </div>
      </div>
      {(error || state.error) && <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-danger">{error || state.error}</p>}
    </fieldset>
  );
}

/** Galeri foto: unggah banyak berkas, urutkan dengan panah, hapus. Maksimal 12 (sama dengan aturan server). */
export function GalleryField({ label, value = [], onChange, canUpload, max = 12, error }) {
  const input = useRef(null);
  const [state, setState] = useState({ busy: false, note: '', error: '' });
  const full = value.length >= max;

  const pick = async (e) => {
    const files = [...(e.target.files ?? [])].slice(0, max - value.length);
    e.target.value = '';
    if (!files.length) return;
    let next = [...value];
    const errors = [];
    for (let i = 0; i < files.length; i += 1) {
      setState({ busy: true, note: `Mengunggah ${i + 1} dari ${files.length}...`, error: '' });
      try {
        next = [...next, await uploadImage(files[i])];
        onChange(next);
      } catch (err) {
        errors.push(err.message);
      }
    }
    setState({ busy: false, note: '', error: errors.join(' ') });
  };

  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label} <span className="font-normal text-muted">({value.length}/{max})</span></legend>
      {value.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((src, i) => (
            <li key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-mist">
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-deep/80 p-1 text-white opacity-100 sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Geser foto ${i + 1} ke kiri`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15 disabled:opacity-30"><ArrowLeft size={16} aria-hidden="true" /></button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Hapus foto ${i + 1}`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15"><Trash size={16} aria-hidden="true" /></button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Geser foto ${i + 1} ke kanan`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15 disabled:opacity-30"><ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
        {canUpload && (
          <>
            <button type="button" className={btn} disabled={full || state.busy} onClick={() => input.current?.click()}>
              <Plus size={16} weight="bold" aria-hidden="true" /> {state.busy ? state.note : 'Tambah foto'}
            </button>
            <input ref={input} type="file" multiple accept={TYPES.join(',')} className="sr-only" tabIndex={-1} aria-label={`Pilih berkas ${label}`} onChange={pick} />
          </>
        )}
        {!full && <UrlInput label={`Alamat foto ${label}`} onAdd={(u) => onChange([...value, u])} />}
      </div>
      {full && <p className="mt-2 text-[0.8125rem] text-muted">Batas {max} foto tercapai.</p>}
      {(error || state.error) && <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-danger">{error || state.error}</p>}
    </fieldset>
  );
}
