import React, { useState } from 'react';
import {
    ShieldAlert,
    CheckCircle2,
    XCircle,
    ArrowDownRight,
    TrendingDown,
    Calendar,
    User,
    Store,
    FileText,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import Modal from '../Modal';
import type { MarginApprovalRequest } from '../../types';

interface MarginExceptionModalProps {
    request: MarginApprovalRequest | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
    canApprove: boolean;
    onSignOff: (id: string, action: 'Approved' | 'Rejected', reason?: string) => Promise<void>;
}

export const MarginExceptionModal: React.FC<MarginExceptionModalProps> = ({
    request,
    isOpen,
    onClose,
    currencySymbol,
    canApprove,
    onSignOff
}) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);

    if (!request) return null;

    const handleAction = async (action: 'Approved' | 'Rejected') => {
        setIsSubmitting(true);
        setActionType(action);
        try {
            await onSignOff(request.id, action, action === 'Rejected' ? rejectionReason : undefined);
            setRejectionReason('');
            onClose();
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const isPending = request.status === 'Pending';
    const isApproved = request.status === 'Approved';
    const isRejected = request.status === 'Rejected';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Margin Exception Review"
            size="md"
        >
            <div className="p-5 space-y-5">
                {/* Product Header Card */}
                <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                {request.requestNumber || `REQ-${request.id.slice(0, 8).toUpperCase()}`}
                            </span>
                            <h4 className="text-base font-semibold text-[var(--theme-text-primary)] leading-tight mt-0.5">
                                {request.productName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                    SKU: {request.sku}
                                </span>
                                {request.siteId && (
                                    <>
                                        <span className="text-[11px] text-[var(--theme-text-secondary)]">/</span>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-text-secondary)]">
                                            <Store size={12} /> {request.siteId}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 ${
                        isApproved
                            ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                            : isRejected
                                ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                    }`}>
                        {isApproved && <CheckCircle2 size={12} />}
                        {isRejected && <XCircle size={12} />}
                        {isPending && <AlertTriangle size={12} />}
                        {request.status}
                    </span>
                </div>

                {/* Pricing & Margin Dynamics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] block">
                            Landed Cost
                        </span>
                        <div className="text-sm font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                            {currencySymbol} {request.costPrice.toLocaleString()}
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] block">
                            Proposed Price
                        </span>
                        <div className="text-sm font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                            {currencySymbol} {request.proposedRetailPrice.toLocaleString()}
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] block">
                            Target Hurdle
                        </span>
                        <div className="text-sm font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                            {request.targetMarginPct.toFixed(1)}%
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)]">
                        <span className="text-[11px] font-medium text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] block">
                            Proposed Margin
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-mono tabular-nums">
                                {request.proposedMarginPct.toFixed(1)}%
                            </span>
                            <span className="inline-flex items-center text-[10px] font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] px-1 py-0.5 rounded font-mono">
                                <ArrowDownRight size={10} />
                                {request.marginVariancePct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Margin Threshold Comparison Indicator */}
                <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--theme-text-secondary)] flex items-center gap-1">
                            <TrendingDown size={13} className="text-[var(--theme-status-danger-text)]" />
                            Margin Variance from Floor Target
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                            -{Math.abs(request.marginVariancePct).toFixed(1)}% Under Hurdle
                        </span>
                    </div>
                    <div className="h-2 w-full bg-[color-mix(in_srgb,var(--theme-overlay)_10%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-[var(--theme-status-danger-bg)] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(10, (request.proposedMarginPct / (request.targetMarginPct || 1)) * 100))}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--theme-text-secondary)] font-mono">
                        <span>Proposed: {request.proposedMarginPct.toFixed(1)}%</span>
                        <span>Target Hurdle: {request.targetMarginPct.toFixed(1)}%</span>
                    </div>
                </div>

                {/* Justification & Context */}
                <div className="space-y-2">
                    <span className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                        <FileText size={14} className="text-[var(--theme-text-secondary)]" />
                        Commercial Justification
                    </span>
                    <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] leading-relaxed">
                        {request.reason || 'No commercial rationale specified.'}
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--theme-text-secondary)] pt-1 border-t border-[var(--theme-border)]">
                    <div className="flex items-center gap-1.5">
                        <User size={13} />
                        <span>Requested By:</span>
                        <span className="font-medium text-[var(--theme-text-primary)]">
                            {request.requestedByName || request.requestedById || 'Operations'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>Date:</span>
                        <span className="font-medium text-[var(--theme-text-primary)]">
                            {request.createdAt ? new Date(String(request.createdAt)).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Resolved Status Details */}
                {!isPending && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        isApproved
                            ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]'
                            : 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                {isApproved ? (
                                    <>
                                        <CheckCircle2 size={14} className="text-[var(--theme-status-success-text)]" />
                                        Approved Exception Audit
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={14} className="text-[var(--theme-status-danger-text)]" />
                                        Rejection Audit
                                    </>
                                )}
                            </span>
                            {request.approvedAt && (
                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                    {new Date(String(request.approvedAt)).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="text-[var(--theme-text-secondary)]">
                            Sign-off by: <span className="font-medium text-[var(--theme-text-primary)]">{request.approvedByName || 'Finance Director'}</span>
                        </div>
                        {request.rejectionReason && (
                            <div className="text-[var(--theme-text-secondary)] pt-1">
                                Note: <span className="italic text-[var(--theme-text-primary)]">"{request.rejectionReason}"</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Section for Pending Requests */}
                {isPending && (
                    <div className="pt-2 border-t border-[var(--theme-border)] space-y-3">
                        {canApprove ? (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--theme-text-secondary)] block">
                                        Rejection Note / Governance Guidance (Required on Reject)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Add commercial rationale or directive if rejecting..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleAction('Rejected')}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSubmitting && actionType === 'Rejected' ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <XCircle size={13} />
                                        )}
                                        Reject Price Cut
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAction('Approved')}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-accent)] hover:bg-[#0077ED] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                    >
                                        {isSubmitting && actionType === 'Approved' ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={13} />
                                        )}
                                        Approve Exception
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-3 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-2">
                                <AlertTriangle size={15} className="shrink-0" />
                                <span>Pending Finance sign-off. Your role does not possess authority to approve sub-floor margins.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default MarginExceptionModal;
