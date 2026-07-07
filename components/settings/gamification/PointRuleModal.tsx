import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';
import { CURRENCY_SYMBOL, GROCERY_CATEGORIES } from '../../../constants';
import type { PointRuleType } from '../../../types';

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

export const PointRuleModal: React.FC = () => {
    const {
        isPointRuleModalOpen,
        setIsPointRuleModalOpen,
        editingPointRule,
        editedPointRule,
        setEditedPointRule,
        ruleNameError,
        setRuleNameError,
        handleSavePointRule
    } = useGamification();

    return (
        <Modal
            isOpen={isPointRuleModalOpen}
            onClose={() => setIsPointRuleModalOpen(false)}
            title={editingPointRule ? 'Edit Point Rule' : 'Add New Point Rule'}
            size="lg"
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Rule Name & Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Rule Name *
                        </label>
                        <input
                            type="text"
                            value={editedPointRule.name || ''}
                            onChange={(e) => {
                                setEditedPointRule({ ...editedPointRule, name: e.target.value });
                                setRuleNameError(false);
                            }}
                            placeholder="e.g., Premium Electronics"
                            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none ${
                                ruleNameError ? 'border-red-500' : 'border-white/10'
                            }`}
                        />
                        {ruleNameError && <p className="text-xs text-red-400 mt-1">Rule name is required</p>}
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Rule Type
                        </label>
                        <select
                            value={editedPointRule.type || 'category'}
                            aria-label="Rule Type"
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, type: e.target.value as PointRuleType })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="category">Category-based</option>
                            <option value="product">Specific Product</option>
                            <option value="revenue">Revenue-based</option>
                            <option value="quantity">Quantity Bonus</option>
                            <option value="promotion">Promotional</option>
                        </select>
                    </div>
                </div>

                {/* Category/Product Selection */}
                {(editedPointRule.type === 'category' || editedPointRule.type === 'quantity') && (
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Category
                        </label>
                        <select
                            value={editedPointRule.categoryId || 'all'}
                            aria-label="Category"
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, categoryId: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="all">All Categories</option>
                            {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                                <optgroup key={group} label={group} className="bg-gray-900 text-gray-300">
                                    {items.map(c => (
                                        <option key={c} value={c} className="bg-black text-white">
                                            {c}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}

                {editedPointRule.type === 'product' && (
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Product SKU
                        </label>
                        <input
                            type="text"
                            value={editedPointRule.productSku || ''}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, productSku: e.target.value })}
                            placeholder="Enter product SKU"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Enter the SKU of the specific product this rule applies to
                        </p>
                    </div>
                )}

                {/* Points Configuration */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Points Per Unit Sold
                        </label>
                        <input
                            type="number"
                            min="0"
                            aria-label="Points Per Unit Sold"
                            value={editedPointRule.pointsPerUnit || 0}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, pointsPerUnit: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Priority (higher = applied first)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            aria-label="Priority"
                            value={editedPointRule.priority || 5}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, priority: parseInt(e.target.value) || 5 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Revenue-based Options */}
                {editedPointRule.type === 'revenue' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div>
                            <label className="text-xs text-green-400 uppercase font-bold mb-1 block">
                                Points Per Revenue Threshold
                            </label>
                            <input
                                type="number"
                                min="0"
                                aria-label="Points Per Revenue Threshold"
                                value={editedPointRule.pointsPerRevenue || 0}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, pointsPerRevenue: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/40 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-green-400 uppercase font-bold mb-1 block">
                                Revenue Threshold ({CURRENCY_SYMBOL})
                            </label>
                            <input
                                type="number"
                                min="1"
                                aria-label="Revenue Threshold"
                                value={editedPointRule.revenueThreshold || 100}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, revenueThreshold: parseInt(e.target.value) || 100 })}
                                className="w-full bg-black/40 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <p className="col-span-2 text-[10px] text-gray-400">
                            Example: 1 point per {CURRENCY_SYMBOL}
                            {editedPointRule.revenueThreshold || 100} ={' '}
                            {Math.floor(1000 / (editedPointRule.revenueThreshold || 100)) * (editedPointRule.pointsPerRevenue || 0)} points for
                            a {CURRENCY_SYMBOL}1,000 sale
                        </p>
                    </div>
                )}

                {/* Quantity Bonus Options */}
                {editedPointRule.type === 'quantity' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <div>
                            <label className="text-xs text-amber-400 uppercase font-bold mb-1 block">
                                Minimum Quantity to Trigger
                            </label>
                            <input
                                type="number"
                                min="1"
                                aria-label="Minimum Quantity"
                                value={editedPointRule.minQuantity || 1}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, minQuantity: parseInt(e.target.value) || 1 })}
                                className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-amber-400 uppercase font-bold mb-1 block">
                                Points Multiplier
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="0.1"
                                aria-label="Points Multiplier"
                                value={editedPointRule.multiplier || 1}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, multiplier: parseFloat(e.target.value) || 1 })}
                                className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                        <p className="col-span-2 text-[10px] text-gray-400">
                            When selling {editedPointRule.minQuantity || 1}+ items, multiply all points by {editedPointRule.multiplier || 1}
                            x
                        </p>
                    </div>
                )}

                {/* Max Points Cap */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Max Points Per Transaction (optional)
                    </label>
                    <input
                        type="number"
                        min="0"
                        aria-label="Max Points Per Transaction"
                        value={editedPointRule.maxPointsPerTransaction || ''}
                        onChange={(e) =>
                            setEditedPointRule({
                                ...editedPointRule,
                                maxPointsPerTransaction: e.target.value ? parseInt(e.target.value) : undefined
                            })
                        }
                        placeholder="No limit"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Leave empty for no cap. Useful for preventing abuse.</p>
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                        Description
                    </label>
                    <textarea
                        value={editedPointRule.description || ''}
                        aria-label="Description"
                        onChange={(e) => setEditedPointRule({ ...editedPointRule, description: e.target.value })}
                        placeholder="Describe what this rule does..."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none resize-none"
                    />
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                        Rule Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setEditedPointRule({ ...editedPointRule, color: color.value })}
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${
                                    editedPointRule.color === color.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-gray scale-110'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedPointRule.color === color.value && <Sparkles size={16} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                    <div>
                        <p className="font-bold text-white">Enable Rule</p>
                        <p className="text-xs text-gray-400">Disabled rules don't earn points</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            aria-label="Enable point rule"
                            checked={editedPointRule.enabled ?? true}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => setIsPointRuleModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSavePointRule}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                        <Save size={18} />
                        {editingPointRule ? 'Update Rule' : 'Add Rule'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default PointRuleModal;
