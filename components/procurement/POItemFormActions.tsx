import React from 'react';
import { Plus, Save } from 'lucide-react';
import { POItem } from '../../types';

interface POItemFormActionsProps {
    editingItem: POItem | null;
    onCancelEdit: () => void;
    onSubmit: () => void;
}

export const POItemFormActions: React.FC<POItemFormActionsProps> = ({
    editingItem,
    onCancelEdit,
    onSubmit
}) => {
    return (
        <div className="pt-2 border-t border-[var(--theme-border-subtle)]">
            {editingItem ? (
                <div className="flex w-full gap-2 font-semibold">
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="w-1/3 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)] rounded-xl transition-colors cursor-pointer text-xs font-semibold border border-[var(--theme-border)] active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="w-2/3 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-95 active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold shadow-sm"
                    >
                        <Save size={15} /> Update Item
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={onSubmit}
                    className="w-full py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-95 active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold shadow-sm"
                >
                    <Plus size={15} /> Add Item to Order
                </button>
            )}
        </div>
    );
};
