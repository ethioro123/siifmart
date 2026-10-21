import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';

interface CreatePOFooterProps {
    currencySymbol: string;
    poTotal: number;
    onClose: () => void;
    onCreatePO: () => void;
    isPendingAction: boolean;
    isEditMode: boolean;
    itemsCount: number;
    hasUnsavedItemDraft?: boolean;
}

export const CreatePOFooter: React.FC<CreatePOFooterProps> = ({
    currencySymbol,
    poTotal,
    onClose,
    onCreatePO,
    isPendingAction,
    isEditMode,
    itemsCount,
    hasUnsavedItemDraft = false
}) => {
    return (
        <div className="flex justify-between items-center w-full px-2">
            <div className="flex items-center gap-4">
                <div className="h-8 w-[1px] bg-[var(--theme-border-subtle)] hidden md:block"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider leading-none">Total Value</span>
                    <span className="text-lg font-mono text-[var(--theme-text-primary)] tracking-tight font-bold tabular-nums">
                        {currencySymbol} {formatCompactNumber(poTotal)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {itemsCount === 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                        <AlertCircle size={13} />
                        {hasUnsavedItemDraft ? 'Click "Add Item to Order" above first' : 'Add at least 1 item to submit'}
                    </span>
                )}
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold transition-colors text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] cursor-pointer active:scale-[0.98]"
                >
                    Cancel
                </button>
                <button
                    onClick={onCreatePO}
                    disabled={isPendingAction || itemsCount === 0}
                    title={itemsCount === 0 ? 'Add at least one line item to the order first' : undefined}
                    className="px-7 py-2.5 rounded-full text-xs font-semibold bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                    {isPendingAction && <Loader2 size={14} className="animate-spin" />}
                    {isEditMode ? 'Save Changes' : 'Create Purchase Order'}
                </button>
            </div>
        </div>
    );
};
