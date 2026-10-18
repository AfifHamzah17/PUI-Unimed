import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowsClockwise, Eye, FunnelSimple, ImageSquare, MagnifyingGlass, PencilSimple, Plus, Star, Trash } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Badge, { DemoBadge } from '../../components/ui/Badge.jsx';
import Field from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import ListFooter from '../../components/admin/ListFooter.jsx';
import { GalleryField, ImageField } from '../../components/admin/ImageFields.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useRepoList } from '../../hooks/useRepo.js';
import { adminApi, isRemote } from '../../services/api.js';
import { cn } from '../../lib/cn.js';
import NotFound from '../NotFound.jsx';
import { fromForm, schemas, titleOf, toForm, validateForm } from './schemas.js';

// Editor (Tiptap/ProseMirror) berukuran besar: hanya diunduh saat admin membuka formulir yang memakainya.
const RichEditor = lazy(() => import('../../components/editor/RichEditor.jsx'));

const SECTIONS = [
  ['info', 'Informasi'],
  ['foto', 'Foto dan berkas'],
  ['isi', 'Isi lengkap'],
  ['opsi', 'Tampilan'],
];
const sel = 'h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

export default function AdminCollection() {
  const { resource } = useParams();
  const schema = schemas[resource];
  if (!schema) return <NotFound title="Koleksi tidak dikenal" />;
  return <Collection key={resource} resource={resource} schema={schema} />;
}

function Thumb({ src }) {
  return src ? (
    <img src={src} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-xl border border-line object-cover" />
  ) : (
    <span className="grid h-14 w-14 place-items-center rounded-xl bg-mist text-muted" aria-hidden="true"><ImageSquare size={22} /></span>
  );
}

function FilterSelect({ label, value, onChange, options, all }) {
  return (
    <label className="grid gap-1 text-[0.8125rem] font-medium text-muted">
      {label}
      <select className={sel} value={value} onChange={(e) => onChange(e.target.value)}>
        {all !== null && <option value="">{all ?? 'Semua'}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Collection({ resource, schema }) {
  const { repo } = schema;
  const blank = { q: '', type: '', mode: '', status: '', from: '', to: '', featured: '', sort: schema.defaultSort };
  const [f, setF] = useState(blank);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { id: string | null }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [starBusy, setStarBusy] = useState('');
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const dq = useDebouncedValue(f.q, 300);
  const rangeError = f.from && f.to && f.from > f.to ? 'Tanggal awal tidak boleh setelah tanggal akhir.' : '';
  const params = { q: dq, type: f.type, mode: f.mode, status: f.status, featured: f.featured, sort: f.sort, from: rangeError ? '' : f.from, to: rangeError ? '' : f.to, page, pageSize };

  useEffect(() => setPage(1), [dq, f.type, f.mode, f.status, f.featured, f.sort, f.from, f.to, pageSize]);
  const { data, loading, error } = useRepoList(repo, params);

  // Jika menghapus membuat halaman saat ini kosong, mundur satu halaman.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) setPage(page - 1);
  }, [data, page]);

  const activeCount = ['q', 'type', 'mode', 'status', 'from', 'to', 'featured'].filter((k) => f[k]).length + (f.sort !== schema.defaultSort ? 1 : 0);
  const filtered = activeCount > 0;

  const toggleStar = async (it) => {
    setStarBusy(it.id);
    try {
      await repo.setFeatured(it.id, !it.featured);
      setNotice({ type: 'ok', text: it.featured ? 'Dilepas dari sorotan beranda.' : 'Ditampilkan di sorotan beranda.' });
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setStarBusy('');
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await repo.remove(toDelete.id);
      setNotice({ type: 'ok', text: 'Data dihapus.' });
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  const range = schema.dateRange;
  const rangeInput = (name, label) => (
    <label className="grid gap-1 text-[0.8125rem] font-medium text-muted">
      {label}
      <input
        className={sel}
        type={range.kind === 'year' ? 'number' : 'date'}
        {...(range.kind === 'year' ? { min: 1990, max: 2100, placeholder: 'mis. 2024', inputMode: 'numeric' } : {})}
        value={f[name]}
        onChange={(e) => set(name)(e.target.value)}
        aria-invalid={rangeError ? 'true' : undefined}
      />
    </label>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-medium">{schema.label}</h2>
          <p className="mt-1 text-sm text-muted tabular" aria-live="polite">{data ? `${data.total} entri${filtered ? ' sesuai filter' : ''}` : '\u00A0'}</p>
        </div>
        <Button onClick={() => setEditing({ id: null })}><Plus size={18} weight="bold" aria-hidden="true" /> Tambah {schema.label.toLowerCase()}</Button>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="admin-cari" className="sr-only">Cari di {schema.label}</label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="admin-cari" type="search" value={f.q} onChange={(e) => set('q')(e.target.value)} placeholder={`Cari di ${schema.label.toLowerCase()}`} className="h-11 w-full rounded-full border border-line bg-paper pl-11 pr-4 text-[0.9375rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
          </div>
          <Button variant="outline" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} aria-controls="panel-filter">
            <FunnelSimple size={18} aria-hidden="true" /> Filter{activeCount ? ` (${activeCount})` : ''}
          </Button>
        </div>

        <div id="panel-filter" hidden={!filtersOpen} className="mt-4 border-t border-line pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect label={schema.typeFilter.label} value={f.type} onChange={set('type')} options={schema.typeFilter.options} />
            {schema.extraFilters.map((x) => <FilterSelect key={x.name} label={x.label} value={f[x.name]} onChange={set(x.name)} options={x.options} />)}
            <FilterSelect label="Sorotan beranda" value={f.featured} onChange={set('featured')} options={[{ value: 'true', label: 'Disorot' }, { value: 'false', label: 'Tidak disorot' }]} />
            <FilterSelect label="Urutkan" value={f.sort} onChange={set('sort')} options={schema.sorts} all={null} />
            {rangeInput('from', `${range.label}, dari`)}
            {rangeInput('to', `${range.label}, sampai`)}
          </div>
          {rangeError && <p role="alert" className="mt-3 text-[0.8125rem] font-medium text-danger">{rangeError}</p>}
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" disabled={!filtered} onClick={() => setF(blank)}><ArrowsClockwise size={16} aria-hidden="true" /> Reset filter</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {error ? (
          <EmptyState title="Data belum bisa dimuat">{error.message}</EmptyState>
        ) : !data ? (
          <ul className="divide-y divide-line border-y border-line" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <li key={i} className="flex gap-4 py-4"><Skeleton className="h-14 w-14 rounded-xl" /><div className="flex-1"><Skeleton className="h-5 w-3/5" /><Skeleton className="mt-3 h-3 w-1/4" /></div></li>)}
          </ul>
        ) : data.items.length === 0 ? (
          <EmptyState title={filtered ? 'Tidak ada yang cocok' : 'Belum ada data'} action={filtered ? <Button variant="outline" onClick={() => setF(blank)}>Reset filter</Button> : <Button onClick={() => setEditing({ id: null })}>Tambah {schema.label.toLowerCase()}</Button>}>
            {filtered ? 'Tidak ada entri yang cocok dengan pencarian atau filter ini.' : 'Mulai dengan menambahkan entri pertama.'}
          </EmptyState>
        ) : (
          <>
            <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_7rem_9rem_auto] gap-x-4 border-b border-line px-1 pb-2 text-[0.8125rem] font-medium text-muted md:grid" aria-hidden="true">
              <span /> <span>Judul</span> <span>Jenis</span> <span>{range.label}</span> <span className="w-[8.5rem] text-right">Aksi</span>
            </div>
            <ul className="divide-y divide-line border-b border-line md:border-t-0" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
              {data.items.map((it) => {
                const r = schema.row(it);
                const title = titleOf(resource, it);
                return (
                  <li key={it.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-1 py-4 md:grid-cols-[3.5rem_minmax(0,1fr)_7rem_9rem_auto]">
                    <Thumb src={it.cover} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium leading-snug">
                        <span className="min-w-0 break-words">{title}</span>
                        {it.demo && <DemoBadge />}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted">{r.meta}</p>
                      <p className="mt-1 text-xs text-muted md:hidden">{r.badge}{r.when ? `, ${r.when}` : ''}</p>
                    </div>
                    <div className="hidden md:block"><Badge tone="muted">{r.badge}</Badge></div>
                    <div className="hidden text-sm text-muted tabular md:block">{r.when || '-'}</div>
                    <div className="flex items-center justify-end gap-0.5">
                      <button type="button" onClick={() => toggleStar(it)} disabled={starBusy === it.id} aria-pressed={Boolean(it.featured)} aria-label={it.featured ? `Lepas ${title} dari sorotan` : `Sorot ${title} di beranda`} title={it.featured ? 'Disorot di beranda' : 'Sorot di beranda'} className={cn('grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5', it.featured ? 'text-accent' : 'text-muted')}>
                        <Star size={19} weight={it.featured ? 'fill' : 'regular'} aria-hidden="true" />
                      </button>
                      <a href={schema.publicPath(it)} target="_blank" rel="noopener noreferrer" aria-label={`Lihat ${title} di situs`} title="Lihat di situs" className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink/5"><Eye size={18} aria-hidden="true" /></a>
                      <button type="button" onClick={() => setEditing({ id: it.id })} className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink/5" aria-label={`Ubah ${title}`} title="Ubah"><PencilSimple size={18} aria-hidden="true" /></button>
                      <button type="button" onClick={() => setToDelete(it)} className="grid h-10 w-10 place-items-center rounded-full text-danger transition hover:bg-danger/10" aria-label={`Hapus ${title}`} title="Hapus"><Trash size={18} aria-hidden="true" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <ListFooter data={data} onPage={setPage} onPageSize={setPageSize} />
          </>
        )}
      </div>

      {editing && (
        <EditDrawer
          schema={schema}
          resource={resource}
          id={editing.id}
          onClose={() => setEditing(null)}
          onSaved={(text) => { setEditing(null); setNotice({ type: 'ok', text }); }}
          onFail={(text) => setNotice({ type: 'error', text })}
        />
      )}

      <Modal
        open={Boolean(toDelete)}
        onClose={() => !busy && setToDelete(null)}
        dismissible={!busy}
        title="Hapus data ini?"
        description={toDelete ? titleOf(resource, toDelete) : ''}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setToDelete(null)} disabled={busy}>Batal</Button><Button variant="danger" onClick={confirmDelete} disabled={busy}>{busy ? 'Menghapus...' : 'Ya, hapus'}</Button></>}
      >
        <p className="text-sm text-muted">Data yang dihapus tidak bisa dikembalikan.</p>
      </Modal>
      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}

/** Memuat entri lengkap (daftar tidak membawa isi teks kaya) lalu menampilkan formulir. */
function EditDrawer(props) {
  const { schema, id, onClose } = props;
  const [state, setState] = useState({ loading: Boolean(id), item: null, error: '' });

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    schema.repo.get(id)
      .then((item) => alive && setState(item ? { loading: false, item, error: '' } : { loading: false, item: null, error: 'Data tidak ditemukan.' }))
      .catch((e) => alive && setState({ loading: false, item: null, error: e.message }));
    return () => { alive = false; };
  }, [schema, id]);

  if (state.loading || state.error) {
    return (
      <Modal open onClose={onClose} variant="drawer" size="xl" title={`Ubah ${schema.label.toLowerCase()}`}>
        {state.loading ? <div className="grid gap-4" aria-busy="true"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-40 w-full" /></div> : <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      </Modal>
    );
  }
  return <EditForm {...props} item={state.item} />;
}

function EditForm({ schema, resource, id, item, onClose, onSaved, onFail }) {
  const [initial] = useState(() => toForm(schema, item));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pdf, setPdf] = useState({ busy: false, pct: 0, error: '' });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isEdit = Boolean(id);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const setField = (name) => (v) => setValues((s) => ({ ...s, [name]: v }));
  const onInput = (name) => (e) => setField(name)(e.target.value);
  const tryClose = () => (dirty && !saving ? setConfirmDiscard(true) : onClose());

  const submit = async (e) => {
    e.preventDefault();
    const payload = fromForm(schema, values);
    const errs = validateForm(resource, schema, payload);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      if (isEdit) await schema.repo.update(id, payload);
      else await schema.repo.create(payload);
      onSaved(isEdit ? 'Perubahan disimpan.' : 'Data ditambahkan.');
    } catch (err) {
      if (err.fields) setErrors(err.fields); // galat validasi dari server tampil di field masing-masing
      onFail(err.message);
      setSaving(false);
    }
  };

  const pickPdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return setPdf({ busy: false, pct: 0, error: 'Berkas harus berformat PDF.' });
    setPdf({ busy: true, pct: 0, error: '' });
    try {
      setField('pdfUrl')(await adminApi.upload(file, (pct) => setPdf((u) => ({ ...u, pct }))));
      setPdf({ busy: false, pct: 100, error: '' });
    } catch (err) {
      setPdf({ busy: false, pct: 0, error: err.message });
    }
  };

  const renderField = (f) => {
    const common = { id: `f-${f.name}`, label: f.label, required: f.required, hint: f.hint, error: errors[f.name], value: values[f.name] ?? '', onChange: onInput(f.name), className: f.full || f.type === 'textarea' ? 'sm:col-span-2' : undefined };
    switch (f.type) {
      case 'select': return <Field key={f.name} {...common} as="select">{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field>;
      case 'textarea': return <Field key={f.name} {...common} as="textarea" />;
      case 'date': return <Field key={f.name} {...common} type="date" />;
      case 'number': return <Field key={f.name} {...common} type="number" inputMode="numeric" />;
      case 'pdf':
        return (
          <div key={f.name} className="sm:col-span-2">
            <Field {...common} className={undefined} type="text" />
            {isRemote && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-ink/20 px-5 text-sm font-medium transition hover:border-ink/50 hover:bg-ink/[0.04] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2">
                  {pdf.busy ? `Mengunggah ${pdf.pct}%` : 'Unggah PDF'}
                  <input type="file" accept="application/pdf" className="sr-only" disabled={pdf.busy} onChange={pickPdf} />
                </label>
                <span className="text-[0.8125rem] text-muted">Maksimal 20 MB. Alamat terisi otomatis setelah selesai.</span>
              </div>
            )}
            {pdf.error && <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-danger">{pdf.error}</p>}
          </div>
        );
      case 'image': return <div key={f.name} className="sm:col-span-2"><ImageField label={f.label} value={values[f.name]} onChange={setField(f.name)} canUpload={isRemote} error={errors[f.name]} /></div>;
      case 'gallery': return <div key={f.name} className="sm:col-span-2"><GalleryField label={f.label} value={values[f.name]} onChange={setField(f.name)} canUpload={isRemote} error={errors[f.name]} /></div>;
      case 'rich':
        return (
          <div key={f.name} className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium" id={`lbl-${f.name}`}>{f.label}</p>
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <RichEditor label={f.label} value={values[f.name]} onChange={setField(f.name)} onUploadImage={isRemote ? (file) => adminApi.upload(file) : undefined} />
            </Suspense>
            {errors[f.name] && <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-danger">{errors[f.name]}</p>}
          </div>
        );
      case 'checkbox':
        return (
          <label key={f.name} className="flex cursor-pointer items-start gap-3 sm:col-span-2">
            <input id={`f-${f.name}`} type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => setField(f.name)(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 rounded-md accent-[rgb(var(--brand))]" />
            <span><span className="block text-[0.9375rem] font-medium">{f.label}</span>{f.hint && <span className="block text-[0.8125rem] text-muted">{f.hint}</span>}</span>
          </label>
        );
      default: return <Field key={f.name} {...common} type="text" />;
    }
  };

  return (
    <>
      <Modal
        open
        onClose={tryClose}
        dismissible={!saving}
        variant="drawer"
        size="xl"
        title={`${isEdit ? 'Ubah' : 'Tambah'} ${schema.label.toLowerCase()}`}
        footer={<><Button variant="ghost" onClick={tryClose} disabled={saving}>Batal</Button><Button type="submit" form="form-admin" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button></>}
      >
        <form id="form-admin" onSubmit={submit} noValidate className="grid gap-10">
          {SECTIONS.map(([key, heading]) => {
            const fields = schema.fields.filter((f) => f.section === key);
            if (!fields.length) return null;
            return (
              <section key={key} aria-label={heading}>
                <h3 className="mb-5 font-sans text-base font-semibold">{heading}</h3>
                <div className="grid gap-5 sm:grid-cols-2">{fields.map(renderField)}</div>
              </section>
            );
          })}
        </form>
      </Modal>
      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Buang perubahan?"
        description="Ada perubahan yang belum disimpan."
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setConfirmDiscard(false)}>Lanjut mengedit</Button><Button variant="danger" onClick={onClose}>Buang</Button></>}
      >
        <p className="text-sm text-muted">Perubahan yang dibuang tidak bisa dikembalikan.</p>
      </Modal>
    </>
  );
}
