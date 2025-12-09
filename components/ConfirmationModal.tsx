import React, { useState } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireText?: string; // If provided, user must type this text to confirm
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  requireText
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (requireText) {
      if (inputValue !== requireText) {
        setError(`Please type "${requireText}" to confirm`);
        return;
      }
    }
    setInputValue('');
    setError('');
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    setInputValue('');
    setError('');
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      button: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50',
      border: 'border-red-500/20'
    },
    warning: {
      icon: 'text-yellow-400',
      button: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/50',
      border: 'border-yellow-500/20'
    },
    info: {
      icon: 'text-blue-400',
      button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/50',
      border: 'border-blue-500/20'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-bold transition-colors border ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className={`p-4 rounded-xl border ${styles.border} bg-black/20 mb-4`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`${styles.icon} flex-shrink-0 mt-0.5`} size={20} />
          <div className="flex-1">
            <p className="text-white text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
      </div>

      {requireText && (
        <div className="space-y-2">
          <label className="text-sm text-gray-300 font-bold block">
            Type <span className="text-cyber-primary font-mono">{requireText}</span> to confirm:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue === requireText) {
                handleConfirm();
              }
            }}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none font-mono"
            placeholder={requireText}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
        </div>
      )}
    </Modal>
  );
}

