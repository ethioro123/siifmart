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
      icon: 'text-[var(--theme-status-danger-text)]',
      button: 'bg-[var(--theme-status-danger-bg)] hover:opacity-90 text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]',
      border: 'border-[var(--theme-status-danger-border)]'
    },
    warning: {
      icon: 'text-[var(--theme-status-warning-text)]',
      button: 'bg-[var(--theme-status-warning-bg)] hover:opacity-90 text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]',
      border: 'border-[var(--theme-status-warning-border)]'
    },
    info: {
      icon: 'text-[var(--theme-status-info-text)]',
      button: 'bg-[var(--theme-status-info-bg)] hover:opacity-90 text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]',
      border: 'border-[var(--theme-status-info-border)]'
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
            className="px-4 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold border border-[var(--theme-border)] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className={`p-4 rounded-2xl border ${styles.border} bg-[var(--theme-bg-subtle)] mb-4`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`${styles.icon} flex-shrink-0 mt-0.5`} size={20} />
          <div className="flex-1">
            <p className="text-[var(--theme-text-primary)] text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
      </div>

      {requireText && (
        <div className="space-y-2">
          <label className="text-sm text-[var(--theme-text-secondary)] font-medium block">
            Type <span className="text-[var(--theme-primary)] font-mono font-bold">{requireText}</span> to confirm:
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
            className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-3.5 py-2 text-[var(--theme-text-primary)] text-sm focus:border-[var(--theme-primary)] outline-none font-mono transition-colors"
            placeholder={requireText}
            autoFocus
          />
          {error && (
            <p className="text-[var(--theme-status-danger-text)] text-xs">{error}</p>
          )}
        </div>
      )}
    </Modal>
  );
}

