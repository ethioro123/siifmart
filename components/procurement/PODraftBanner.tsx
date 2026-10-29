import React from 'react';
import { Clock3, Trash2, Check, ArrowRight } from 'lucide-react';
import { PODraftMeta } from './hooks/usePODraft';

interface PODraftBannerProps {
    meta: PODraftMeta;
    onDismiss: () => void;
    onDiscard: () => void;
}

function formatRelativeTime(isoString: string): string {
    try {
        const diffMs = Date.now() - new Date(isoString).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } catch {
        return 'earlier';
    }
}

export const PODraftBanner: React.FC<PODraftBannerProps> = ({
    meta,
    onDismiss,
    onDiscard
}) => {
    const timeAgo = formatRelativeTime(meta.savedAt);

    return (
        <div className="w-full p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                    <Clock3 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wide">
                            In-Progress Draft Restored
                        </span>
                        <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border border-[var(--theme-border-subtle)]">
                            Saved Locally
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-0.5 truncate">
                        Saved {timeAgo} • {meta.itemCount} {meta.itemCount === 1 ? 'added item' : 'added items'}
                        {meta.itemInProgress ? ' • item in progress' : ''}
                        {meta.supplierDisplay && meta.supplierDisplay !== 'Unspecified' ? ` • ${meta.supplierDisplay}` : ''}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                    type="button"
                    onClick={onDiscard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] transition-colors border border-[var(--theme-status-danger-border)] active:scale-[0.98] cursor-pointer"
                    title="Permanently remove saved draft and start fresh"
                >
                    <Trash2 size={13} />
                    <span>Delete Draft</span>
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-95 transition-opacity active:scale-[0.98] cursor-pointer shadow-xs"
                >
                    <Check size={13} />
                    <span>Continue Drafting</span>
                </button>
            </div>
        </div>
    );
};
