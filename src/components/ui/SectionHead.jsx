import { cn } from '../../lib/cn.js';

export default function SectionHead({ title, lead, action, className, as: Tag = 'h2' }) {
  return (
    <div className={cn('flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        <Tag className="text-[clamp(1.875rem,3.6vw,3rem)] font-medium leading-[1.08]">{title}</Tag>
        {lead && <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
