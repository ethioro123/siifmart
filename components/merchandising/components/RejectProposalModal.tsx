import React, { useState, useEffect } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import Modal from '../../Modal';
import type { PendingInventoryChange } from '../../../types';

interface RejectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PendingInventoryChange | null;
  onConfirmReject: (requestId: string, reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const RejectProposalModal: React.FC<RejectProposalModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmReject,
  isSubmitting = false
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setValidationError(null);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError('A rejection reason is required for compliance audit trails.');
      return;
    }
    if (trimmed.length < 5) {
      setValidationError('Please provide a more descriptive reason (at least 5 characters).');
      return;
    }

    try {
      await onConfirmReject(request.id, trimmed);
      onClose();
    } catch {
      // Error handling is handled by the caller mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Merchandising Proposal"
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div className="text-xs">
            <p className="font-semibold">Audit Requirement</p>
            <p className="opacity-90">
              Rejections are permanently recorded in the regional governance audit log. Please state the operational or commercial rationale.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-xs space-y-1">
          <div className="flex justify-between text-[var(--theme-text-secondary)]">
            <span>Product</span>
            <span className="font-mono text-[var(--theme-text-primary)]">{request.productSku}</span>
          </div>
          <p className="font-semibold text-sm text-[var(--theme-text-primary)]">{request.productName}</p>
          <p className="text-[var(--theme-text-secondary)]">
            Requested by: <span className="font-medium text-[var(--theme-text-primary)]">{request.requestedBy}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rejection-reason" className="block text-xs font-semibold text-[var(--theme-text-primary)]">
            Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="e.g., Margin below threshold without seasonal promo approval; supplier price changes pending confirmation..."
            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            required
            disabled={isSubmitting}
            autoFocus
          />
          {validationError && (
            <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {validationError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[var(--theme-border)] px-4 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <XCircle size={14} />
            <span>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
