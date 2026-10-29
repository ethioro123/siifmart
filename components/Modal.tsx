import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let openDialogCount = 0;
let bodyOverflowBeforeDialogs = '';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  zIndex?: string;
  variant?: 'center' | 'side';
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  mobileFullScreen?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  zIndex = 'z-[9999]',
  variant = 'center',
  closeOnClickOutside = true,
  mobileFullScreen = false,
  closeOnEscape = true
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  // Keep keyboard and screen-reader focus within the active dialog.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (openDialogCount === 0) {
      bodyOverflowBeforeDialogs = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogCount += 1;
    const modalRoot = dialogRef.current?.parentElement;
    const inertedSiblings = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== modalRoot)
      .map(element => ({ element, wasInert: element.inert }));
    inertedSiblings.forEach(({ element }) => { element.inert = true; });
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFirst = window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
      (first || dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!items.length) { event.preventDefault(); dialogRef.current.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.removeEventListener('keydown', handleKeyDown);
      inertedSiblings.forEach(({ element, wasInert }) => { element.inert = wasInert; });
      openDialogCount = Math.max(0, openDialogCount - 1);
      if (openDialogCount === 0) document.body.style.overflow = bodyOverflowBeforeDialogs;
      previouslyFocused?.focus();
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    '4xl': 'max-w-[95vw]',
  };

  const isSide = variant === 'side';

  const modalContent = (
    <div
      style={{
        paddingTop: isSide ? undefined : 'max(1rem, calc(var(--app-top-inset, 0px) + env(safe-area-inset-top, 0px) + 1rem))',
        paddingBottom: isSide ? undefined : 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        paddingLeft: isSide ? undefined : 'max(0.75rem, calc(env(safe-area-inset-left, 0px) + 0.75rem))',
        paddingRight: isSide ? undefined : 'max(0.75rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))'
      }}
      className={`fixed inset-0 ${zIndex} flex ${isSide ? 'justify-end' : 'items-center justify-center'} ${mobileFullScreen ? 'p-0 sm:p-6' : 'p-3 sm:p-6'} overflow-hidden print:static print:block print:p-0 print:bg-[var(--theme-bg-card)]`}
    >
      {/* Backdrop with blur and darken */}
      <div
        className="absolute inset-0 bg-[var(--theme-overlay)] transition-opacity print:hidden"
        onClick={closeOnClickOutside ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        style={{
          backgroundColor: 'var(--theme-bg-panel)',
          maxHeight: isSide ? '100%' : 'calc(100dvh - var(--app-top-inset, 0px) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2.5rem)'
        }}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full overflow-hidden ${isSide ? 'h-full max-w-md rounded-l-3xl rounded-r-none animate-in slide-in-from-right duration-300' : `${sizeClasses[size]} ${mobileFullScreen ? 'h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl' : 'rounded-3xl'} animate-in fade-in zoom-in duration-200`} bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-[var(--shadow-modal)] transform transition-all flex flex-col my-auto print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-[var(--theme-bg-card)]`}
      >

        {/* Header */}
        <div className={`flex items-center justify-between gap-3 ${mobileFullScreen ? 'px-4 py-3 sm:px-6 sm:py-5' : 'px-6 py-5'} border-b border-[var(--theme-border-subtle)] bg-[var(--theme-bg-panel)] shrink-0 print:hidden`}>
          <h3 id={titleId} className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`min-h-11 min-w-11 flex items-center justify-center shrink-0 p-2 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-border)] transition-colors cursor-pointer`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className={`${mobileFullScreen ? 'p-4 sm:p-6' : 'p-6'} min-h-0 overscroll-contain overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 print:overflow-visible print:px-0 print:py-0 bg-[var(--theme-bg-panel)]`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{ backgroundColor: 'var(--theme-bg-panel)' }}
            className={`${mobileFullScreen ? 'px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4' : 'px-6 py-4'} border-t border-[var(--theme-border-subtle)] bg-[var(--theme-bg-panel)] shrink-0`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}