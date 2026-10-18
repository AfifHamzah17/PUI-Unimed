import { cn } from '../../lib/cn.js';

/** Kartu tengah untuk halaman masuk, pengajuan akun, dan lupa kata sandi. Gaya sama dengan kartu admin lainnya. */
export default function AuthCard({ icon: Icon, title, lead, children, footer, wide = false }) {
  return (
    <section className="shell pb-20 pt-28 sm:pt-36">
      <div className={cn('mx-auto rounded-3xl border border-line bg-surface p-8 shadow-soft', wide ? 'max-w-lg' : 'max-w-md')}>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={26} aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-medium">{title}</h1>
        {lead && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{lead}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 border-t border-line pt-5 text-center text-[0.8125rem] leading-relaxed text-muted">{footer}</div>}
      </div>
    </section>
  );
}

export const linkClass = 'font-medium text-brand underline-offset-4 hover:underline';
