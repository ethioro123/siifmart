import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';

const TIER_COLORS = [
    { value: 'gray', label: 'Gray', class: 'from-gray-400 to-gray-500' },
    { value: 'amber', label: 'Bronze', class: 'from-amber-500 to-amber-600' },
    { value: 'yellow', label: 'Gold', class: 'from-yellow-400 to-yellow-500' },
    { value: 'cyan', label: 'Platinum', class: 'from-cyan-400 to-cyan-500' },
    { value: 'purple', label: 'Diamond', class: 'from-purple-400 to-purple-600' },
    { value: 'green', label: 'Emerald', class: 'from-emerald-400 to-emerald-600' },
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Role Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Role Name *
                    </label>
                    <input
                        type="text"
                        value={editedRole.role || ''}
                        onChange={(e) => setEditedRole({ ...editedRole, role: e.target.value })}
                        placeholder="e.g., Store Manager, Cashier"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                    />
                </div>

                {/* Percentage */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Pool Percentage (%) *
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        aria-label="Pool Percentage"
                        value={editedRole.percentage || 0}
                        onChange={(e) => setEditedRole({ ...editedRole, percentage: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                    />
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">Share of the store's earned bonus pool</p>
                </div>

                {/* Role Color */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Role Color Accent
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setEditedRole({ ...editedRole, color: color.value })}
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color.class} flex items-center justify-center transition-all cursor-pointer ${
                                    editedRole.color === color.value
                                        ? 'ring-2 ring-[var(--theme-accent)] dark:ring-[var(--theme-accent)] scale-110 shadow-xs'
                                        : 'opacity-70 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedRole.color === color.value && (
                                    <Sparkles size={14} className="text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 justify-end">
                    <button
                        type="button"
                        onClick={() => setIsRoleModalOpen(false)}
                        className="h-9 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveRole}
                        className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Save size={14} />
                        {editingRole ? 'Update Role' : 'Add Role'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
