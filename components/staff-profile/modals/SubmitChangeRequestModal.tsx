import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, ArrowRight, Loader2, X } from 'lucide-react';
import { GovernanceRuleResult } from '../../../types/employee-change';
import Modal from '../../Modal';

interface SubmitChangeRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeName: string;
    ruleResult: GovernanceRuleResult;
    onConfirm: (reason: string) => Promise<void>;
    isSubmitting: boolean;
}

export const SubmitChangeRequestModal: React.FC<SubmitChangeRequestModalProps> = ({
    isOpen,
    onClose,
    employeeName,
    ruleResult,
    onConfirm,
    isSubmitting
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Please provide an operational justification for these changes.');
            return;
        }
        setError('');
        await onConfirm(reason.trim());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cross-Department Change Authorization" size="lg">
            <div className="space-y-5 p-2">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--theme-text-primary)] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-500">
                        <ShieldCheck size={16} />
                        Zero-Trust Segregation of Duties Governance
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
                        The requested modifications to <strong className="text-[var(--theme-text-primary)]">{employeeName}</strong> affect governed corporate fields. Under company policy, these changes cannot be applied unilaterally by HR and will be routed to the respective department heads for approval.
                    </p>
                </div>

                {/* Diff Breakdown */}
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
                        Proposed Modifications ({ruleResult.diffs.length})
                    </p>
                    <div className="divide-y divide-[var(--theme-border)] border border-[var(--theme-border)] rounded-2xl overflow-hidden bg-[var(--theme-bg-panel)]">
                        {ruleResult.diffs.map((diff, index) => (
                            <div key={index} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                    <span className="font-bold text-[var(--theme-text-primary)]">{diff.label}</span>
                                    <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                        Approver: {diff.approvingDepartment}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                    <span className="text-[var(--theme-text-muted)] line-through">
                                        {String(diff.oldValue || 'None')}
                                    </span>
                                    <ArrowRight size={12} className="text-[var(--theme-text-muted)]" />
                                    <span className="text-emerald-500 font-bold">
                                        {String(diff.newValue || 'None')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block">
                        Operational Justification <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Provide details on why these changes are requested (e.g. Annual compensation increment, legal marriage name change, store transfer)..."
                        rows={3}
                        className="w-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-primary)] transition-colors resize-none"
                    />
                    {error && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                            <AlertCircle size={12} />
                            {error}
                        </p>
                    )}
                </div>

                {/* Approvers summary */}
                <div className="p-3 bg-[var(--theme-bg-panel)] rounded-xl border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between">
                    <span>Routing to:</span>
                    <span className="font-bold text-[var(--theme-text-primary)]">
                        {ruleResult.requiredApprovers.join(' & ')}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-panel)] transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason.trim()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                        {isSubmitting ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>Submit for Sign-Off</>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
