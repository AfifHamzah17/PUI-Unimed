import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

const base =
  'group/btn inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ' +
  'transition-[transform,background-color,color,border-color,box-shadow] duration-300 ease-out ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary: 'bg-brand text-on-brand hover:shadow-soft hover:brightness-110',
  gold: 'bg-accent text-deep hover:shadow-[0_10px_30px_-10px_rgb(227_169_26/0.7)] hover:brightness-105',
  outline: 'border border-ink/20 text-ink hover:border-ink/50 hover:bg-ink/[0.04]',
  'outline-light': 'border border-white/25 text-white hover:border-white/60 hover:bg-white/10',
  ghost: 'text-ink hover:bg-ink/[0.06]',
  danger: 'bg-danger text-white hover:brightness-110',
};
const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[0.9375rem]',
  lg: 'h-[3.25rem] px-8 text-base',
  icon: 'h-10 w-10',
};

/** Satu komponen untuk <Link>, <a>, dan <button>. */
export default function Button({ to, href, variant = 'primary', size = 'md', className, children, ...rest }) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
