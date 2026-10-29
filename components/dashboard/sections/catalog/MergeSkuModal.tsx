import React from 'react';
import { GitMerge } from 'lucide-react';

interface MergeSkuModalProps {
    isOpen: boolean;
    onClose: () => void;
    survivingSku: string;
    deprecatedSku: string;
    onSurvivingSkuChange: (sku: string) => void;
    onDeprecatedSkuChange: (sku: string) => void;
    onExecuteMerge: () => void;
    isPending: boolean;
}

export const MergeSkuModal: React.FC<MergeSkuModalProps> = ({
    isOpen,
    onClose,
    survivingSku,
    deprecatedSku,
    onSurvivingSkuChange,
    onDeprecatedSkuChange,
    onExecuteMerge,
    isPending
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2">
                    <GitMerge size={18} className="text-[var(--theme-accent)]" />
                    <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                        Consolidate Duplicate SKUs
                    </h3>
                </div>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                    All physical stock, past PO line items, and stock movements under the deprecated SKU will be unified into the surviving SKU.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase block mb-1">
                            Surviving Canonical SKU (Kept)
                        </label>
                        <input
                            type="text"
                            value={survivingSku}
                            onChange={(e) => onSurvivingSkuChange(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)]"
                            placeholder="e.g. GN002"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase block mb-1">
                            Deprecated SKU (To Merge & Retire)
                        </label>
                        <input
                            type="text"
                            value={deprecatedSku}
                            onChange={(e) => onDeprecatedSkuChange(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)]"
                            placeholder="e.g. GN007"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!survivingSku || !deprecatedSku || isPending}
                        onClick={onExecuteMerge}
                        className="px-4 py-1.5 text-xs font-bold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] rounded-xl hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        {isPending ? 'Merging...' : 'Execute Merge'}
                    </button>
                </div>
            </div>
        </div>
    );
};
