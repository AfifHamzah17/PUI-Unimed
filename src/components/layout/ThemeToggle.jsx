import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../../hooks/useTheme.js';
import { cn } from '../../lib/cn.js';

export default function ThemeToggle({ className }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      className={cn('grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10', className)}
    >
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}
