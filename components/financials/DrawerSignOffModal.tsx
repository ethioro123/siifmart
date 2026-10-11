import React, { useState } from 'react';
import {
    ShieldCheck,
    AlertTriangle,
    Loader2,
    UserCheck,
    CheckCircle2,
    Receipt,
    Building2,
    DollarSign
} from 'lucide-react';
import type { DrawerReconciliationRecord } from '../../types';
import Modal from '../Modal';

interface DrawerSignOffModalProps {
    shift: DrawerReconciliationRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onSignOff: (shiftId: string, action: 'Reconciled' | 'Flagged', notes: string) => Promise<void>;
    isActionLoading: boolean;
    currencySymbol: string;
}

export const DrawerSignOffModal: React.FC<DrawerSignOffModalProps> = ({
    shift,
    isOpen,
    onClose,
    onSignOff,
    isActionLoading,
    currencySymbol
}) => {
    const [auditNotes, setAuditNotes] = useState('');

    if (!shift) return null;

    const handleConfirm = async (action: 'Reconciled' | 'Flagged') => {
        await onSignOff(shift.id, action, auditNotes);
        setAuditNotes('');
    };

    const isExcessive = Math.abs(shift.variance) > 500;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="HQ Finance Supervisory Sign-Off"
            size="md"
        >
            <div className="p-5 space-y-4">
                {/* Header Banner */}
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            Dual-Control Verification (Shift #{shift.shiftNumber})
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                            Supervisory shift variance co-attributed under Rule 18 zero-trust financial governance.
                        </p>
                    </div>
                </div>

                {/* Shift Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--theme-bg-subtle)] p-3.5 rounded-xl border border-[var(--theme-border)]">
                    <div>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Cashier</span>
                        <span className="text-[var(--theme-text-primary)] font-medium text-xs mt-0.5 block truncate">
                            {shift.cashierName}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">On-Duty Supervisor</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <UserCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-[var(--theme-text-primary)] font-medium text-xs truncate">
                                {shift.supervisorName || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Expected Drawer Cash</span>
                        <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums text-xs mt-0.5 block">
                            {currencySymbol} {shift.expectedCash.toLocaleString()}
                        </span>
                    </div>
                    <div className="pt-2 border-t border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Actual Counted Cash</span>
                        <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums text-xs mt-0.5 block">
                            {currencySymbol} {shift.actualCash.toLocaleString()}
                        </span>
                    </div>
                    <div className="col-span-2 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">Net Variance</span>
                        <span className={`font-mono font-semibold text-sm tabular-nums ${
                            shift.variance === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isExcessive
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                        }`}>
                            {shift.variance > 0 ? '+' : ''}{currencySymbol} {shift.variance.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Cashier Discrepancy Note */}
                {shift.discrepancyReason && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                            <AlertTriangle size={13} />
                            <span>Cashier Discrepancy Explanation</span>
                        </div>
                        <p className="text-[var(--theme-text-secondary)] text-xs leading-relaxed">
                            {shift.discrepancyReason}
                        </p>
                    </div>
                )}

                {/* Audit Notes Form */}
                <div>
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">
                        HQ Finance Audit Notes
                    </label>
                    <textarea
                        value={auditNotes}
                        onChange={(e) => setAuditNotes(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl p-3 text-xs focus:outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors resize-none h-20 placeholder:text-[var(--theme-text-secondary)]/50"
                        placeholder="Enter supervisory verification findings, CCTV cross-check notes, or required audit follow-ups..."
                        aria-label="HQ Audit Notes"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        onClick={onClose}
                        disabled={isActionLoading}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleConfirm('Flagged')}
                        disabled={isActionLoading}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shadow-xs"
                    >
                        Flag Discrepancy
                    </button>
                    <button
                        onClick={() => handleConfirm('Reconciled')}
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                        {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                        <span>Sign-off &amp; Reconcile</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DrawerSignOffModal;
