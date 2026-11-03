import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

/**
 * Dialog memakai elemen <dialog> bawaan browser: focus trap, tombol Esc, dan
 * pengembalian fokus sudah ditangani browser. Kita hanya menambah kunci scroll dan klik latar.
 *
 * variant: 'modal' (tengah) | 'drawer' (geser dari kanan) | 'menu' (layar penuh, konten bebas)
 */
export default function Modal({ open, onClose, title, description, children, footer, variant = 'modal', size = 'md', bare = false, dismissible = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  const drawerWidths = { sm: 'max-w-[26rem]', md: 'max-w-[34rem]', lg: 'max-w-[44rem]', xl: 'max-w-[56rem]' };
  const isDrawer = variant === 'drawer';
  const isMenu = variant === 'menu';

  return (
    <dialog
      ref={ref}
      className={cn(
        'pui-dialog',
        isDrawer && 'pui-dialog--drawer m-0 ml-auto h-[100dvh] w-full',
        isDrawer && drawerWidths[size],
        isMenu && 'm-0 h-[100dvh] w-full',
        !isDrawer && !isMenu && 'w-[calc(100%-2rem)]',
        !isDrawer && !isMenu && widths[size]
      )}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        if (!dismissible) e.preventDefault(); // Esc diabaikan saat proses simpan berjalan
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {open && bare && children}
      {open && !bare && (
        <div
          className={cn(
            'flex flex-col bg-surface text-ink shadow-lift',
            isDrawer ? 'h-full' : 'max-h-[88dvh] rounded-3xl border border-line'
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
