import { cn } from '../../lib/cn.js';

export default function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('rounded-3xl border border-dashed border-line px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-muted">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
