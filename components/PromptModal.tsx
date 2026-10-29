import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  type?: 'text' | 'number' | 'email';
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

export default function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  type = 'text',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  required = false
}: PromptModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (required && !inputValue.trim()) {
      setError('This field is required');
      return;
    }
    setError('');
    onConfirm(inputValue);
    onClose();
  };

  const handleClose = () => {
    setInputValue('');
    setError('');
    onClose();
  };

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
            className="px-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-muted)] font-bold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-cyber-primary hover:bg-cyber-accent text-[var(--theme-text-primary)] font-bold transition-colors"
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {message && (
          <p className="text-[var(--theme-text-muted)] text-sm whitespace-pre-line">{message}</p>
        )}
        <div>
          <input
            type={type}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm();
              } else if (e.key === 'Escape') {
                handleClose();
              }
            }}
            placeholder={placeholder}
            className="w-full bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-lg px-3 py-2 text-[var(--theme-text-primary)] text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none"
            autoFocus
          />
          {error && (
            <p className="text-[var(--theme-status-danger-text)] text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

