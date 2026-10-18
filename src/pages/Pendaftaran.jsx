import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { isRemote, pendaftaranApi } from '../services/api.js';

const PERAN = ['Dosen', 'Mahasiswa', 'Guru atau tenaga pendidik', 'Pegiat seni dan budaya', 'Peneliti mitra', 'Lainnya'];
const EMPTY = { nama: '', email: '', institusi: '', peran: '', minat: '', setuju: false };

function validate(v) {
  const e = {};
  if (v.nama.trim().length < 3) e.nama = 'Isi nama lengkap, minimal 3 huruf.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email belum benar, contoh: nama@unimed.ac.id.';
  if (!v.institusi.trim()) e.institusi = 'Isi asal institusi atau sekolah.';
  if (!v.peran) e.peran = 'Pilih peran Anda.';
  if (v.minat.trim().length < 20) e.minat = 'Ceritakan minat riset Anda dalam minimal 20 karakter.';
  if (!v.setuju) e.setuju = 'Centang persetujuan agar data Anda dapat diproses.';
  return e;
}

export default function Pendaftaran() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (name) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const next = { ...values, [name]: v };
    setValues(next);
    if (touched[name]) setErrors(validate(next));
  };
  const blur = (name) => () => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  };
  const err = (name) => (touched[name] ? errors[name] : undefined);

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    setTouched({ nama: true, email: true, institusi: true, peran: true, minat: true, setuju: true });
    if (Object.keys(e).length) {
      document.getElementById(`pendaftaran-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setSending(true);
    try {
      await pendaftaranApi.submit(values);
      setDone(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setDone(false);
    setValues(EMPTY);
    setErrors({});
    setTouched({});
  };

  return (
    <>
      <PageHeader title="Pendaftaran" lead="Ajukan diri sebagai anggota atau mitra. Tim akan menghubungi Anda melalui email." crumbs={[{ label: 'Keanggotaan' }, { label: 'Pendaftaran' }]} />
      <section className="shell grid gap-12 py-16 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
        <form onSubmit={submit} noValidate className="grid gap-6 sm:grid-cols-2" aria-label="Formulir pendaftaran">
          <Field className="sm:col-span-2" id="pendaftaran-nama" label="Nama lengkap dan gelar" required autoComplete="name" value={values.nama} onChange={set('nama')} onBlur={blur('nama')} error={err('nama')} />
          <Field id="pendaftaran-email" label="Email" required type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set('email')} onBlur={blur('email')} error={err('email')} />
          <Field id="pendaftaran-institusi" label="Asal institusi" required autoComplete="organization" value={values.institusi} onChange={set('institusi')} onBlur={blur('institusi')} error={err('institusi')} hint="Perguruan tinggi, sekolah, atau komunitas." />
          <Field id="pendaftaran-peran" className="sm:col-span-2" as="select" label="Peran Anda" required value={values.peran} onChange={set('peran')} onBlur={blur('peran')} error={err('peran')}>
            <option value="">Pilih peran</option>
            {PERAN.map((p) => <option key={p} value={p}>{p}</option>)}
          </Field>
          <Field id="pendaftaran-minat" className="sm:col-span-2" as="textarea" label="Minat riset atau kegiatan" required value={values.minat} onChange={set('minat')} onBlur={blur('minat')} error={err('minat')} hint="Mis. literasi digital, seni pertunjukan di kelas, asesmen kreatif." />

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
              <input id="pendaftaran-setuju" type="checkbox" checked={values.setuju} onChange={set('setuju')} onBlur={blur('setuju')} aria-invalid={err('setuju') ? 'true' : undefined} className="mt-1 h-5 w-5 shrink-0 rounded-md border-line accent-[rgb(var(--brand))]" />
              <span>Saya setuju data ini digunakan oleh tim PUI untuk keperluan keanggotaan.</span>
            </label>
            {err('setuju') && <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-danger">{errors.setuju}</p>}
          </div>

          <div className="sm:col-span-2">
            {errors.submit && <p role="alert" className="mb-3 text-sm font-medium text-danger">{errors.submit}</p>}
            <Button type="submit" size="lg" disabled={sending}>{sending ? 'Mengirim...' : 'Kirim pendaftaran'}</Button>
          </div>
        </form>

        <aside className="self-start rounded-3xl border border-line bg-surface p-7">
          <h2 className="font-sans text-lg font-semibold">Setelah mendaftar</h2>
          <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
            <li>Tim memeriksa kecocokan bidang Anda dengan program pusat.</li>
            <li>Anda menerima kabar melalui email yang didaftarkan.</li>
            <li>Anggota baru dapat ikut riset kolaboratif, workshop, dan seminar.</li>
          </ul>
          {!isRemote && (
            <p className="mt-6 rounded-2xl bg-accent/20 p-4 text-sm leading-relaxed">
              Formulir ini belum tersambung ke server. Untuk sementara data hanya tersimpan di perangkat ini.
            </p>
          )}
        </aside>
      </section>

      <Modal open={done} onClose={reset} title="Pendaftaran tercatat" size="sm" footer={<Button onClick={reset}>Mengerti</Button>}>
        <p className="leading-relaxed text-muted">
          {isRemote
            ? 'Terima kasih. Pendaftaran Anda sudah diterima tim PUI. Kami akan menghubungi Anda melalui email yang didaftarkan.'
            : 'Terima kasih. Karena backend belum aktif, data Anda baru tersimpan di perangkat ini dan belum diterima tim PUI.'}
        </p>
      </Modal>
    </>
  );
}
