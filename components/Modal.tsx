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
    <div className={`fixed inset-0 ${zIndex} flex ${isSide ? 'justify-end' : 'items-center justify-center'} p-0 sm:p-4 print:static print:block print:p-0 print:bg-white`}>
      {/* Backdrop with blur and darken */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full ${isSide ? 'h-full max-w-md rounded-l-3xl rounded-r-none animate-in slide-in-from-right duration-300' : `${sizeClasses[size]} rounded-2xl animate-in fade-in zoom-in duration-200`} bg-[#F7F3ED]/95 dark:bg-[#1E2822]/95 backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-2xl dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] transform transition-all flex flex-col ${isSide ? 'max-h-full' : 'max-h-[90vh]'} print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white`}>

        {/* Glow Effect */}
        <div className={`absolute -inset-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent dark:via-[#A9CBA2]/10 ${isSide ? 'rounded-l-3xl' : 'rounded-2xl'} blur-sm -z-10 pointer-events-none print:hidden`} />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2DCCE] dark:border-emerald-950/20 shrink-0 print:hidden">
          <h3 className="text-lg font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2 uppercase tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-[#E2DCCE]/40 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#E2DCCE]/60 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 print:overflow-visible print:px-0 print:py-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-[#E2DCCE] dark:border-emerald-950/20 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}