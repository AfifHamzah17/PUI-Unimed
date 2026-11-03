import { useEffect } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

/** Pemberitahuan singkat. `notice` = { type: 'ok' | 'error', text } atau null. */
export default function Toast({ notice, onDone, duration = 4000 }) {
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [notice, onDone, duration]);

  if (!notice) return null;
  const ok = notice.type !== 'error';
  return (
    <div role={ok ? 'status' : 'alert'} className={cn('fixed bottom-24 left-1/2 z-[85] flex max-w-[calc(100%-2rem)] -translate-x-1/2 animate-rise items-center gap-3 rounded-2xl px-5 py-3.5 text-sm text-white shadow-lift sm:bottom-6', ok ? 'bg-deep' : 'bg-danger')}>
      {ok ? <CheckCircle size={20} className="text-accent" aria-hidden="true" /> : <WarningCircle size={20} aria-hidden="true" />}
      {notice.text}
    </div>
  );
}
