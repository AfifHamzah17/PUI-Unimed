import { CheckCircle, Circle } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

const LABELS = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
const BAR = ['', 'bg-danger', 'bg-accent', 'bg-brand', 'bg-brand'];

/** Aturan yang sama dengan backend (passwordProblem). Meter di atasnya hanya penunjuk, bukan aturan tambahan. */
function evaluate(pw, email) {
  const rules = [
    { ok: pw.length >= 8, label: 'Minimal 8 karakter' },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: 'Mengandung huruf dan angka' },
    { ok: pw.length > 0 && pw.toLowerCase() !== String(email ?? '').trim().toLowerCase(), label: 'Tidak sama dengan email' },
  ];
  if (!pw) return { rules, level: 0 };
  if (!rules.every((r) => r.ok)) return { rules, level: 1 };
  const extras = [pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  return { rules, level: Math.min(4, 2 + Math.min(extras, 2)) };
}

/** Meter kekuatan dan daftar syarat yang berubah langsung saat mengetik. */
export default function PasswordStrength({ value = '', email = '', className }) {
  const { rules, level } = evaluate(value, email);
  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1.5 rounded-full transition-colors duration-300', i <= level ? BAR[level] : 'bg-line')} />)}
        </div>
        <p className="w-24 text-right text-[0.8125rem] font-medium" aria-live="polite">{level ? <><span className="sr-only">Kekuatan: </span>{LABELS[level]}</> : <span className="text-muted">Kekuatan</span>}</p>
      </div>
      <ul className="mt-3 grid gap-1.5 text-[0.8125rem]">
        {rules.map((r) => (
          <li key={r.label} className={cn('flex items-center gap-2 transition-colors', r.ok ? 'text-ink' : 'text-muted')}>
            {r.ok ? <CheckCircle size={16} weight="fill" className="text-brand" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            {r.label}
            <span className="sr-only">{r.ok ? ', terpenuhi' : ', belum terpenuhi'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
