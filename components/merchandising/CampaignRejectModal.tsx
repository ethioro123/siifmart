import React, { useState } from 'react';
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import type { CampaignProposal } from '../../services/merchandising-campaigns.service';

interface CampaignRejectModalProps {
   isOpen: boolean;
   onClose: () => void;
   proposal: CampaignProposal | null;
   onConfirmReject: (id: string, reason: string) => Promise<void>;
   isSubmitting: boolean;
}

export const CampaignRejectModal: React.FC<CampaignRejectModalProps> = ({
   isOpen,
   onClose,
   proposal,
   onConfirmReject,
   isSubmitting
}) => {
   const [reason, setReason] = useState('');
   const trimmedReason = reason.trim();
   const isValid = trimmedReason.length >= 3;

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!proposal || !isValid || isSubmitting) return;
      await onConfirmReject(proposal.id, trimmedReason);
      setReason('');
      onClose();
   };

   if (!proposal) return null;

   return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Reject Proposal: ${proposal.code}`}>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] p-3.5 text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-start gap-2.5">
               <AlertTriangle size={16} className="shrink-0 mt-0.5" />
               <div>
                  <p className="font-semibold">Governance Rejection Audit</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                     A formal rejection reason is required and will be logged in the permanent campaign audit trail.
                  </p>
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-[var(--theme-text-secondary)] block">
                  Rejection Reason (Required)
               </label>
               <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Discount depth exceeds quarterly margin budget for the region."
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 ring-[var(--theme-status-danger-border)] transition-colors"
                  aria-label="Rejection Reason"
               />
               <div className="flex items-center justify-between text-[10px] text-[var(--theme-text-muted)]">
                  <span>Minimum 3 characters</span>
                  <span className={trimmedReason.length >= 3 ? 'text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)]'}>
                     {trimmedReason.length}/3 min
                  </span>
               </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-border)]">
               <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] transition-colors"
               >
                  Cancel
               </button>
               <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
               >
                  {isSubmitting ? (
                     <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Rejecting...</span>
                     </>
                  ) : (
                     <>
                        <XCircle size={14} />
                        <span>Confirm Rejection</span>
                     </>
                  )}
               </button>
            </div>
         </form>
      </Modal>
   );
};
