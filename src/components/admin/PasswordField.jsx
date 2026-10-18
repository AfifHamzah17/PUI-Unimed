import { useState } from 'react';
import { ArrowFatLineUp, Eye, EyeSlash, Key } from '@phosphor-icons/react';
import Field from '../ui/Field.jsx';
import { generatePassword } from '../../lib/password.js';

const small = 'grid h-8 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink';

/**
 * Isian kata sandi dengan tombol lihat/sembunyikan, peringatan Caps Lock, dan (opsional) pembuat kata sandi acak.
 * Dipakai di halaman masuk, pengajuan akun, ganti sandi, dan formulir admin.
 */
export default function PasswordField({ onGenerate, hint = 'Minimal 8 karakter, mengandung huruf dan angka.', onBlur, onKeyDown, onKeyUp, ...props }) {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const track = (e) => setCaps(Boolean(e.getModifierState?.('CapsLock')));
  return (
    <Field
      {...props}
      type={shown ? 'text' : 'password'}
      hint={caps ? <span className="inline-flex items-center gap-1.5 font-medium text-ink"><ArrowFatLineUp size={14} weight="fill" aria-hidden="true" /> Caps Lock sedang aktif</span> : hint}
      autoComplete={props.autoComplete ?? 'new-password'}
      onKeyDown={(e) => { track(e); onKeyDown?.(e); }}
      onKeyUp={(e) => { track(e); onKeyUp?.(e); }}
      onBlur={(e) => { setCaps(false); onBlur?.(e); }}
      adornment={
        <>
          {onGenerate && (
            <button type="button" className={`${small} w-8`} title="Buat kata sandi acak" aria-label="Buat kata sandi acak" onClick={() => { setShown(true); onGenerate(generatePassword()); }}>
              <Key size={18} aria-hidden="true" />
            </button>
          )}
          <button type="button" className={`${small} w-8`} aria-label={shown ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={shown} onClick={() => setShown((v) => !v)}>
            {shown ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </>
      }
    />
  );
}
