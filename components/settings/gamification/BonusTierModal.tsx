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

export const BonusTierModal: React.FC = () => {
    const {
        isModalOpen,
        setIsModalOpen,
        editingTier,
        editedTier,
        setEditedTier,
        handleSaveTier
    } = useGamification();

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingTier ? 'Edit Bonus Tier' : 'Add New Bonus Tier'}
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Tier Name */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Tier Name *
                    </label>
                    <input
                        type="text"
                        value={editedTier.tierName || ''}
                        onChange={(e) => setEditedTier({ ...editedTier, tierName: e.target.value })}
                        placeholder="e.g., Gold, Diamond, Elite"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {/* Point Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Min Points *
                        </label>
                        <input
                            type="number"
                            aria-label="Min Points"
                            value={editedTier.minPoints || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, minPoints: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Max Points (blank = unlimited)
                        </label>
                        <input
                            type="number"
                            value={editedTier.maxPoints ?? ''}
                            onChange={(e) => setEditedTier({
                                ...editedTier,
                                maxPoints: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder="∞"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Bonus Amounts */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Base Bonus ({CURRENCY_SYMBOL})
                        </label>
                        <input
                            type="number"
                            aria-label="Base Bonus"
                            value={editedTier.bonusAmount || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, bonusAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Fixed amount for reaching this tier</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Per-Point Bonus ({CURRENCY_SYMBOL})
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            aria-label="Per-Point Bonus"
                            value={editedTier.bonusPerPoint || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, bonusPerPoint: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Additional bonus per point earned</p>
                    </div>
                </div>

                {/* Tier Color */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                        Tier Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setEditedTier({ ...editedTier, tierColor: color.value })}
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${
                                    editedTier.tierColor === color.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-gray scale-110'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedTier.tierColor === color.value && (
                                    <Sparkles size={16} className="text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Example Calculation */}
                {editedTier.minPoints !== undefined && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-xs text-green-400 font-bold mb-2">Example Calculation</p>
                        <p className="text-sm text-gray-300">
                            Worker with <span className="text-white font-bold">{((editedTier.minPoints || 0) + 50).toLocaleString()}</span> points would earn:
                        </p>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                            {CURRENCY_SYMBOL}
                            {((editedTier.bonusAmount || 0) + (((editedTier.minPoints || 0) + 50) * (editedTier.bonusPerPoint || 0))).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            = {CURRENCY_SYMBOL}{(editedTier.bonusAmount || 0).toLocaleString()} base + ({((editedTier.minPoints || 0) + 50)} × {CURRENCY_SYMBOL}{(editedTier.bonusPerPoint || 0).toFixed(2)})
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveTier}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                        <Save size={18} />
                        {editingTier ? 'Update Tier' : 'Add Tier'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
