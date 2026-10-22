import React, { useState } from 'react';
import { ShieldCheck, XCircle, X } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { formatPONumber } from '../../utils/jobIdFormatter';
import {
  POApprovalReasonCode,
  PORejectionReasonCode
} from '../../types/procurement-zero-trust';

interface POApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'approve' | 'reject' | 'finance';
  po: PurchaseOrder;
  onConfirm: (reasonCode: string, notes: string) => Promise<void>;
  isSubmitting: boolean;
}

const APPROVAL_REASONS: { code: POApprovalReasonCode; label: string; desc: string }[] = [
  {
    code: 'STANDARD_REPLENISHMENT',
    label: 'Standard Replenishment',
    desc: 'Routine inventory restocking based on velocity'
  },
  {
    code: 'EMERGENCY_STOCK_OUT',
    label: 'Emergency Stock-Out',
    desc: 'Critical shortage or depleted SKU requiring immediate dispatch'
  },
  {
    code: 'DIRECT_FARMER_PURCHASE',
    label: 'Direct Farmer Purchase',
    desc: 'Fresh agricultural supply from contracted cooperative'
  },
  {
    code: 'COOPERATIVE_BULK_ORDER',
    label: 'Cooperative Bulk Order',
    desc: 'Large lot procurement at agreed master discount terms'
  },
  {
    code: 'PROMOTIONAL_STOCKING',
    label: 'Promotional Stocking',
    desc: 'Preparing inventory for retail campaign or seasonal demand'
  },
  {
    code: 'PRICE_PROTECTION_PURCHASE',
    label: 'Price Protection Purchase',
    desc: 'Forward contract purchasing ahead of expected price hikes'
  },
  {
    code: 'EXECUTIVE_SPECIAL_AUTHORIZATION',
    label: 'Executive Special Authorization',
    desc: 'Approved under executive managerial oversight'
  }
];

const REJECTION_REASONS: { code: PORejectionReasonCode; label: string; desc: string }[] = [
  {
    code: 'SPECIFICATION_MISMATCH',
    label: 'Specification Mismatch',
    desc: 'Item packaging, case size, or brand does not match standards'
  },
  {
    code: 'PRICE_UNFAVORABLE',
    label: 'Price Unfavorable',
    desc: 'Unit cost too high or margin falls below target'
  },
  {
    code: 'EXCESSIVE_STOCK_ON_HAND',
    label: 'Excessive Stock on Hand',
    desc: 'Warehouse already holds sufficient inventory'
  },
  {
    code: 'BUDGET_OVERRUN',
    label: 'Budget Overrun',
    desc: 'Total exceeds monthly autonomous department allocation'
  },
  {
    code: 'VENDOR_NON_COMPLIANT',
    label: 'Vendor Non-Compliant',
    desc: 'Vendor lacks required compliance or active agreement'
  },
  {
    code: 'SUSPECTED_DUPLICATE_ORDER',
    label: 'Suspected Duplicate Order',
    desc: 'Identical purchase order recently issued for this site'
  },
  {
    code: 'UNAUTHORIZED_DESTINATION',
    label: 'Unauthorized Destination',
    desc: 'Selected destination site is not authorized for receiving'
  }
];

export const POApprovalModal: React.FC<POApprovalModalProps> = ({
  isOpen,
  onClose,
  mode,
  po,
  onConfirm,
  isSubmitting
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(
    mode === 'approve' ? 'STANDARD_REPLENISHMENT' : 'SPECIFICATION_MISMATCH'
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const isApprove = mode === 'approve';
  const isFinance = mode === 'finance';
  const reasons = isApprove ? APPROVAL_REASONS : REJECTION_REASONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(isFinance ? 'FINANCE_CLEARANCE' : selectedReason, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isApprove
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {isApprove || isFinance ? <ShieldCheck size={20} /> : <XCircle size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[var(--theme-text-primary)]">
                {isFinance ? 'Clear PO Budget and Terms' : isApprove ? 'Authorize Purchase Order' : 'Reject Purchase Order'}
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)] font-mono font-medium">
                {formatPONumber(po)} • {po.currency} {po.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFinance && <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              Structured Reason Code *
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reasons.map(r => {
                const isSelected = selectedReason === r.code;
                return (
                  <div
                    key={r.code}
                    onClick={() => setSelectedReason(r.code)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isApprove
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--theme-text-primary)] shadow-xs'
                          : 'bg-rose-500/10 border-rose-500/40 text-[var(--theme-text-primary)] shadow-xs'
                        : 'bg-[var(--theme-bg-subtle)]/70 border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">{r.label}</p>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? isApprove
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-rose-500 bg-rose-500'
                          : 'border-[var(--theme-border)]'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-snug">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>}

          <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              {isFinance ? 'Finance Clearance Reason *' : 'Supervisory Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={isFinance ? 'Explain the budget and payment terms review...' : isApprove ? 'e.g. Verified dock capacity and price schedule...' : 'e.g. Request buyer to re-negotiate case pack discount...'}
              required={isFinance}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-5 rounded-full border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`h-11 px-6 rounded-full text-xs font-semibold text-white shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting
                ? (isFinance ? 'Recording clearance...' : isApprove ? 'Authorizing...' : 'Rejecting...')
                : (isFinance ? 'Record Finance Clearance' : isApprove ? 'Confirm Approval' : 'Confirm Rejection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
