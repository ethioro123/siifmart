import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  zIndex?: string;
  variant?: 'center' | 'side';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  zIndex = 'z-[9999]',
  variant = 'center'
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
    <div className={`fixed inset-0 ${zIndex} flex ${isSide ? 'justify-end' : 'items-center justify-center'} p-4 sm:p-6 overflow-hidden print:static print:block print:p-0 print:bg-white`}>
      {/* Backdrop with blur and darken */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        style={{ backgroundColor: 'var(--theme-bg-panel)' }}
        className={`relative w-full max-w-full overflow-hidden ${isSide ? 'h-full max-w-md rounded-l-3xl rounded-r-none animate-in slide-in-from-right duration-300' : `${sizeClasses[size]} rounded-3xl animate-in fade-in zoom-in duration-200`} bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-[var(--shadow-modal)] transform transition-all flex flex-col ${isSide ? 'max-h-full' : 'max-h-[90vh]'} print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white`}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--theme-border-subtle)] bg-[var(--theme-bg-panel)] shrink-0 print:hidden">
          <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-border)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 print:overflow-visible print:px-0 print:py-0 bg-[var(--theme-bg-panel)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{ backgroundColor: 'var(--theme-bg-panel)' }}
            className="px-6 py-4 border-t border-[var(--theme-border-subtle)] bg-[var(--theme-bg-panel)] shrink-0"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}