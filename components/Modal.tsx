import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  zIndex?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md', zIndex = 'z-[9999]' }: ModalProps) {
  console.log('🟦 MODAL: Rendering, isOpen=', isOpen, 'title=', title);

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
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 sm:p-6`}>
      {/* Backdrop with blur and darken */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
          console.log('🟦 MODAL: Backdrop clicked', e);
          onClose();
        }}
      />

      {/* Modal Content */}
      <div className={`relative w-full ${sizeClasses[size]} bg-cyber-dark border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>

        {/* Glow Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent rounded-2xl blur-sm -z-10 pointer-events-none" />

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
}