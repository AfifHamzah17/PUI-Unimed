import { useId } from 'react';
import { cn } from '../../lib/cn.js';

const control =
  'w-full rounded-xl border bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-muted/70 ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60';

/**
 * Isian formulir: label di atas, petunjuk opsional, galat di bawah.
 * as: 'input' | 'textarea' | 'select' (untuk select, kirim <option> sebagai children).
 */
export default function Field({ label, hint, error, required, as = 'input', className, children, id: idProp, adornment, ...rest }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const Tag = as;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <Tag
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          required={required}
          className={cn(
            control,
            as === 'textarea' ? 'min-h-28 resize-y py-3' : 'h-11',
            adornment && 'pr-28',
            error ? 'border-danger' : 'border-line'
          )}
          {...rest}
        >
          {children}
        </Tag>
        {adornment && <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">{adornment}</div>}
      </div>
      {hint && !error && <p id={hintId} className="mt-1.5 text-[0.8125rem] text-muted">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-danger">{error}</p>}
    </div>
  );
}
