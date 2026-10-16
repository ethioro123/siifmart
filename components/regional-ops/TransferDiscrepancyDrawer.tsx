import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { TransferRecord } from '../../types';

interface TransferDiscrepancyDrawerProps {
  transfer: TransferRecord;
  discrepancyReasonCode: string;
  discrepancyNotes: string;
  onChangeReasonCode: (code: string) => void;
  onChangeNotes: (notes: string) => void;
  onCancel: () => void;
  onResolveLocally: (transfer: TransferRecord) => void;
  onEscalateLP: (transfer: TransferRecord) => void;
}

export const TransferDiscrepancyDrawer: React.FC<TransferDiscrepancyDrawerProps> = ({
  transfer,
  discrepancyReasonCode,
  discrepancyNotes,
  onChangeReasonCode,
  onChangeNotes,
  onCancel,
  onResolveLocally,
  onEscalateLP
}) => {
  return (
    <div className="w-full mt-3 pt-3 border-t border-[var(--theme-border)]/60 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-medium text-[var(--theme-text-secondary)] mb-1">
            Audit Reason Code
          </label>
          <select
            value={discrepancyReasonCode}
            onChange={e => onChangeReasonCode(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
          >
            <option value="DAMAGED_IN_TRANSIT">Damaged in Transit / Crushed</option>
            <option value="SUPPLIER_SHORT_PACK">Supplier Short-Pack in Carton</option>
            <option value="MISCOUNT_ACCEPTED">Count Variance Accepted</option>
            <option value="RETURNED_TO_ORIGIN">Damaged Goods Returned to Origin</option>
            <option value="HIGH_VALUE_THEFT_SUSPECT">High-Value Shortage / Loss Prevention</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-[var(--theme-text-secondary)] mb-1">
            Discrepancy Details & Variance Notes
          </label>
          <input
            type="text"
            placeholder="e.g. 2 units damaged in transit; or missing high-value carton..."
            value={discrepancyNotes}
            onChange={e => onChangeNotes(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => onResolveLocally(transfer)}
          className="px-3 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          title="Resolve minor variance locally with manager audit sign-off"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Resolve Locally (Store Manager)</span>
        </button>

        <button
          type="button"
          onClick={() => onEscalateLP(transfer)}
          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          title="Escalate high-value item discrepancy to Regional Security Supervisor"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Escalate to Loss Prevention</span>
        </button>
      </div>
    </div>
  );
};
