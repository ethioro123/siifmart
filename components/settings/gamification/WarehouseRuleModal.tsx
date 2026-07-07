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
            <div className="space-y-4 pr-2">
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Action
                    </label>
                    {editingWarehouseRule ? (
                        <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400">
                            {editedWarehouseRule.action}
                        </div>
                    ) : (
                        <select
                            value={editedWarehouseRule.action || 'PICK'}
                            onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, action: e.target.value as any })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyber-primary focus:outline-none"
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
                    <p className="text-[10px] text-gray-500 mt-1">
                        {editingWarehouseRule
                            ? 'Actions are system-defined and cannot be changed.'
                            : 'Select the warehouse action to award points for.'}
                    </p>
                </div>

                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Points *
                    </label>
                    <input
                        type="number"
                        aria-label="Points"
                        value={editedWarehouseRule.points || 0}
                        onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, points: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyber-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Description
                    </label>
                    <textarea
                        value={editedWarehouseRule.description || ''}
                        onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, description: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyber-primary focus:outline-none h-24"
                        placeholder="Describe how these points are earned..."
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setIsWarehouseRuleOpen(false)}
                        onClickCapture={(e) => {
                            e.preventDefault();
                            setIsWarehouseRuleModalOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveWarehouseRule}
                        className="px-6 py-2 bg-gradient-to-r from-cyber-primary to-green-400 text-black rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default WarehouseRuleModal;
