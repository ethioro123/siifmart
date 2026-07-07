import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';
import { CURRENCY_SYMBOL } from '../../../constants';

const TIER_COLORS = [
    { value: 'gray', label: 'Gray', class: 'from-gray-400 to-gray-500' },
    { value: 'amber', label: 'Bronze', class: 'from-amber-500 to-amber-600' },
    { value: 'yellow', label: 'Gold', class: 'from-yellow-400 to-yellow-500' },
    { value: 'cyan', label: 'Platinum', class: 'from-cyan-400 to-cyan-500' },
    { value: 'purple', label: 'Diamond', class: 'from-purple-400 to-purple-600' },
    { value: 'green', label: 'Emerald', class: 'from-green-400 to-green-600' },
    { value: 'rose', label: 'Ruby', class: 'from-rose-400 to-rose-600' },
    { value: 'blue', label: 'Sapphire', class: 'from-blue-400 to-blue-600' },
];

export const POSRoleModal: React.FC = () => {
    const {
        isRoleModalOpen,
        setIsRoleModalOpen,
        editingRole,
        editedRole,
        setEditedRole,
        handleSaveRole
    } = useGamification();

    return (
        <Modal
            isOpen={isRoleModalOpen}
            onClose={() => setIsRoleModalOpen(false)}
            title={editingRole ? 'Edit Role Distribution' : 'Add New Role'}
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Role Name */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Role Name *
                    </label>
                    <input
                        type="text"
                        value={editedRole.role || ''}
                        onChange={(e) => setEditedRole({ ...editedRole, role: e.target.value })}
                        placeholder="e.g., Store Manager, Cashier"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {/* Percentage */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Bonus Percentage (%) *
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        aria-label="Bonus Percentage"
                        value={editedRole.percentage || 0}
                        onChange={(e) => setEditedRole({ ...editedRole, percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                        Share of the store bonus pool this role receives. All roles must total 100%.
                    </p>
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                        Role Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setEditedRole({ ...editedRole, color: color.value })}
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${
                                    editedRole.color === color.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-gray scale-110'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedRole.color === color.value && (
                                    <Sparkles size={16} className="text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Example Calculation */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-xs text-blue-400 font-bold mb-2">Example: {CURRENCY_SYMBOL}10,000 Store Bonus</p>
                    <p className="text-2xl font-bold text-green-400">
                        {CURRENCY_SYMBOL}{((10000 * (editedRole.percentage || 0)) / 100).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                        This role would receive {editedRole.percentage || 0}% of the bonus pool
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => setIsRoleModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveRole}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                        <Save size={18} />
                        {editingRole ? 'Update Role' : 'Add Role'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default POSRoleModal;
