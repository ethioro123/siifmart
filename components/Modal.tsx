import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  };

  const isSide = variant === 'side';

  const modalContent = (
    <div className={`fixed inset-0 ${zIndex} flex ${isSide ? 'justify-end' : 'items-center justify-center'} p-0 sm:p-4`}>
      {/* Backdrop with blur and darken */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full ${isSide ? 'h-full max-w-md rounded-l-3xl rounded-r-none animate-in slide-in-from-right duration-300' : `${sizeClasses[size]} rounded-2xl animate-in fade-in zoom-in duration-200`} bg-cyber-dark border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all flex flex-col ${isSide ? 'max-h-full' : 'max-h-[90vh]'}`}>

        {/* Glow Effect */}
        <div className={`absolute -inset-[1px] bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent ${isSide ? 'rounded-l-3xl' : 'rounded-2xl'} blur-sm -z-10 pointer-events-none`} />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-white/5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}