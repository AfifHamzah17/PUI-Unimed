import { useCallback, useEffect, useState } from 'react';
import { Info, MagnifyingGlass, Star } from '@phosphor-icons/react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { repos, sorotanApi } from '../../services/api.js';
import { titleOf } from './schemas.js';
import { cn } from '../../lib/cn.js';

const KINDS = [['kegiatan', 'Kegiatan'], ['publikasi', 'Publikasi'], ['kerjasama', 'Kerjasama']];
const SHOWN = 8; // sama dengan batas server (buildSorotan)

/** Atur kartu "Sorotan terbaru" di beranda. Bila tidak ada yang dipilih, beranda memakai entri terakhir ditambahkan. */
export default function AdminSorotan() {
  const [state, setState] = useState({ loading: true, picked: [], preview: null, error: '' });
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    const offs = KINDS.map(([k]) => repos[k].subscribe(() => setTick((n) => n + 1)));
    return () => offs.forEach((off) => off());
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      ...KINDS.map(([k]) => repos[k].list({ featured: 'true', pageSize: 50, sort: 'created_desc' }).then((r) => r.items.map((it) => ({ ...it, resource: k })))),
      sorotanApi.get(),
    ])
      .then((parts) => {
        if (!alive) return;
        const preview = parts.pop();
        const picked = parts.flat().sort((a, b) => String(b.featuredAt ?? '').localeCompare(String(a.featuredAt ?? '')));
        setState({ loading: false, picked, preview, error: '' });
      })
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: e.message })));
    return () => { alive = false; };
  }, [tick]);

  const toggle = async (it, on) => {
    try {
      await repos[it.resource].setFeatured(it.id, on);
      setNotice({ type: 'ok', text: on ? 'Ditambahkan ke sorotan.' : 'Dilepas dari sorotan.' });
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const { loading, picked, preview, error } = state;
  return (
    <div>
      <h2 className="text-2xl font-medium">Sorotan beranda</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
        Pilih entri yang tampil pada kartu Sorotan terbaru di beranda. Yang terakhir ditandai tampil paling depan. Jika tidak ada yang dipilih,
        beranda otomatis menampilkan 6 entri yang paling baru ditambahkan.
      </p>

      {error && <EmptyState title="Data belum bisa dimuat">{error}</EmptyState>}

      <section className="mt-8" aria-labelledby="dipilih">
        <h3 id="dipilih" className="font-sans text-base font-semibold">Dipilih admin {picked.length > 0 && <span className="font-normal text-muted">({picked.length})</span>}</h3>
        {loading ? <div className="mt-4 grid gap-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          : picked.length === 0 ? (
            <p className="mt-3 flex gap-3 rounded-2xl bg-mist/60 p-4 text-sm leading-relaxed"><Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />Belum ada yang dipilih, jadi beranda memakai entri terakhir ditambahkan (lihat pratinjau di bawah).</p>
          ) : (
            <>
              {picked.length > SHOWN && <p role="note" className="mt-3 rounded-2xl bg-accent/20 p-3 text-sm">Hanya {SHOWN} teratas yang tampil di beranda. Lepas sebagian agar semua yang Anda pilih tampil.</p>}
              <ol className="mt-4 divide-y divide-line border-y border-line">
                {picked.map((it, i) => (
                  <li key={`${it.resource}-${it.id}`} className="flex items-center gap-4 py-3" data-testid="picked">
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm tabular', i < SHOWN ? 'bg-brand text-on-brand' : 'bg-mist text-muted')} aria-label={i < SHOWN ? `Urutan ${i + 1}` : 'Tidak tampil'}>{i + 1}</span>
                    {it.cover ? <img src={it.cover} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" decoding="async" /> : <span className="h-12 w-12 rounded-lg bg-mist" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{titleOf(it.resource, it)}</p>
                      <p className="text-sm text-muted">{KINDS.find(([k]) => k === it.resource)[1]}{i >= SHOWN ? ', belum tampil (melebihi batas)' : ''}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toggle(it, false)} aria-label={`Lepas ${titleOf(it.resource, it)} dari sorotan`}><Star size={16} weight="fill" className="text-accent" aria-hidden="true" /> Lepas</Button>
                  </li>
                ))}
              </ol>
            </>
          )}
      </section>

      <section className="mt-10" aria-labelledby="pratinjau">
        <h3 id="pratinjau" className="font-sans text-base font-semibold">Yang tampil di beranda sekarang {preview && <Badge tone={preview.mode === 'pilihan' ? 'brand' : 'muted'} className="ml-2 align-middle">{preview.mode === 'pilihan' ? 'Pilihan admin' : 'Terakhir ditambahkan'}</Badge>}</h3>
        {preview && (preview.items.length === 0 ? <p className="mt-3 text-sm text-muted">Belum ada konten.</p> : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="preview">
            {preview.items.map((it) => <li key={`${it.resource}-${it.id}`} className="truncate rounded-xl border border-line px-4 py-2.5 text-sm"><span className="text-muted">{KINDS.find(([k]) => k === it.resource)[1]}: </span>{titleOf(it.resource, it)}</li>)}
          </ul>
        ))}
      </section>

      <Picker onToggle={toggle} refresh={tick} />
      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}

function Picker({ onToggle, refresh }) {
  const [kind, setKind] = useState('kegiatan');
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    repos[kind].list({ featured: 'false', q: dq, pageSize: 6, sort: 'created_desc' }).then((r) => alive && setRows(r)).catch(() => alive && setRows({ items: [], total: 0 }));
    return () => { alive = false; };
  }, [kind, dq, refresh]);

  return (
    <section className="mt-10" aria-labelledby="tambah-sorotan">
      <h3 id="tambah-sorotan" className="font-sans text-base font-semibold">Tambah sorotan</h3>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div role="tablist" aria-label="Jenis konten" className="inline-flex rounded-full bg-mist p-1">
          {KINDS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cn('rounded-full px-4 py-2 text-sm font-medium transition', kind === k ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}>{label}</button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <label htmlFor="cari-sorotan" className="sr-only">Cari untuk disorot</label>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="cari-sorotan" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul" className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
        </div>
      </div>
      {!rows ? <Skeleton className="mt-4 h-24 w-full" />
        : rows.items.length === 0 ? <p className="mt-4 text-sm text-muted">Tidak ada entri yang belum disorot{dq ? ' untuk pencarian ini' : ''}.</p>
        : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {rows.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0 truncate text-[0.9375rem]">{titleOf(kind, it)}</span>
                <Button size="sm" variant="outline" onClick={() => onToggle({ ...it, resource: kind }, true)} aria-label={`Sorot ${titleOf(kind, it)}`}><Star size={16} aria-hidden="true" /> Sorot</Button>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
