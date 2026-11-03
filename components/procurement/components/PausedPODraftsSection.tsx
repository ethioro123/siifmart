import React from 'react';
import { Clock3, Play, Trash2, Building2, Package, ArrowRight, Layers } from 'lucide-react';
import type { StoredPODraft } from '../../../utils/procurementDraftStorage';
import { formatCompactNumber } from '../../../utils/formatting';

interface PausedPODraftsSectionProps {
    drafts: StoredPODraft[];
    onResumeDraft: (draft: StoredPODraft) => void;
    onDeleteDraft: (draftId: string) => void;
    currencySymbol?: string;
}

function formatRelativeTime(isoString: string): string {
    try {
        const diffMs = Date.now() - new Date(isoString).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1 min ago';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1 hr ago';
        if (diffHours < 24) return `${diffHours} hrs ago`;
        const diffDays = Math.floor(diffHours / 24);
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } catch {
        return 'recently';
    }
}

export const PausedPODraftsSection: React.FC<PausedPODraftsSectionProps> = ({
    drafts,
    onResumeDraft,
    onDeleteDraft,
    currencySymbol = 'ETB'
}) => {
    if (!drafts || drafts.length === 0) return null;

    return (
        <div className="mb-4 rounded-3xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-4 sm:p-5 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <Clock3 size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Paused Drafts (Work-in-Progress)
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                {drafts.length} {drafts.length === 1 ? 'Session Order' : 'Session Orders'}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Incomplete orders saved in your session. Resume anytime to complete and submit for sign-off.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {drafts.map(draft => {
                    const timeAgo = formatRelativeTime(draft.updatedAt || draft.meta.savedAt);
                    const itemCount = draft.meta.itemCount || draft.data.newPOItems?.length || 0;
                    const supplier = draft.meta.supplierDisplay || 'Unspecified Supplier';
                    const estimatedTotal = draft.meta.totalEstimatedAmount || 0;
                    const items = draft.data.newPOItems || [];

                    return (
                        <div
                            key={draft.id}
                            className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-3.5 flex flex-col justify-between gap-3 hover:border-[var(--theme-border-accent)] transition-all shadow-xs"
                        >
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Building2 size={15} className="text-[var(--theme-text-secondary)] shrink-0" />
                                        <span className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] truncate" title={supplier}>
                                            {supplier}
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] shrink-0">
                                        Paused Draft
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--theme-text-secondary)]">
                                    <span className="inline-flex items-center gap-1">
                                        <Package size={13} className="shrink-0" />
                                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono font-medium text-[var(--theme-text-primary)]">
                                        Est. {currencySymbol} {formatCompactNumber(estimatedTotal)}
                                    </span>
                                    <span>•</span>
                                    <span>Saved {timeAgo}</span>
                                </div>

                                {items.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {items.slice(0, 2).map((item, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border-subtle)] truncate max-w-[200px]"
                                                title={item.productName}
                                            >
                                                <span className="truncate">{item.productName}</span>
                                                <span className="font-mono opacity-80 shrink-0">x{item.quantity}</span>
                                            </span>
                                        ))}
                                        {items.length > 2 && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border-subtle)] font-mono">
                                                +{items.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--theme-border-subtle)]">
                                <button
                                    type="button"
                                    onClick={() => onDeleteDraft(draft.id)}
                                    className="h-8 px-2.5 rounded-full text-xs font-medium text-[var(--theme-status-danger-text)] hover:bg-[var(--theme-status-danger-bg)] hover:border-[var(--theme-status-danger-border)] border border-transparent transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="Discard this paused draft from session"
                                >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onResumeDraft(draft)}
                                    className="h-8 px-3.5 rounded-full text-xs font-semibold bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Play size={12} className="fill-current" />
                                    <span>Resume Order</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
