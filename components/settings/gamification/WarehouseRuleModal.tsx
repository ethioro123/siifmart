import React from 'react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';

export const WarehouseRuleModal: React.FC = () => {
    const {
        isWarehouseRuleModalOpen,
        setIsWarehouseRuleModalOpen,
        editingWarehouseRule,
        editedWarehouseRule,
        setEditedWarehouseRule,
        handleSaveWarehouseRule
    } = useGamification();

    return (
        <Modal
            isOpen={isWarehouseRuleModalOpen}
            onClose={() => setIsWarehouseRuleModalOpen(false)}
            title={editingWarehouseRule ? 'Edit Warehouse Point Rule' : 'Add New Warehouse Rule'}
        >
            <div className="space-y-4 pr-1">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Action
                    </label>
                    {editingWarehouseRule ? (
                        <div className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-mono font-medium">
                            {editedWarehouseRule.action}
                        </div>
                    ) : (
                        <select
                            value={editedWarehouseRule.action || 'PICK'}
                            onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, action: e.target.value as any })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-semibold outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors cursor-pointer"
                            aria-label="Select warehouse action"
                        >
                            <option value="PICK">PICK</option>
                            <option value="PACK">PACK</option>
                            <option value="PUTAWAY">PUTAWAY</option>
                            <option value="TRANSFER">TRANSFER</option>
                            <option value="DISPATCH">DISPATCH</option>
                            <option value="ITEM_BONUS">ITEM_BONUS</option>
                            <option value="ACCURACY_100">ACCURACY_100</option>
                            <option value="ACCURACY_95">ACCURACY_95</option>
                            <option value="STREAK_3">STREAK_3</option>
                            <option value="STREAK_7">STREAK_7</option>
                            <option value="STREAK_30">STREAK_30</option>
                        </select>
                    )}
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">
                        {editingWarehouseRule
                            ? 'Actions are system-defined and cannot be changed.'
                            : 'Select the warehouse action to award points for.'}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Points *
                    </label>
                    <input
                        type="number"
                        aria-label="Points"
                        value={editedWarehouseRule.points || 0}
                        onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, points: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Description
                    </label>
                    <textarea
                        value={editedWarehouseRule.description || ''}
                        onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, description: e.target.value })}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 text-xs text-[var(--theme-text-primary)] font-normal outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors h-24"
                        placeholder="Describe how these points are earned..."
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsWarehouseRuleModalOpen(false)}
                        className="h-9 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveWarehouseRule}
                        className="h-9 px-4 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default WarehouseRuleModal;
