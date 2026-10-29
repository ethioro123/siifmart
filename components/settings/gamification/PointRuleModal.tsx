import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';
import { useData } from '../../../contexts/DataContext';
import { Country, getCountryProfile } from '../../../utils/localization';
import { GROCERY_CATEGORIES } from '../../../constants';
import type { PointRuleType } from '../../../types';

const TIER_COLORS = [
    { value: 'gray', label: 'Gray', class: 'from-[var(--theme-accent)] to-[var(--theme-accent)]' },
    { value: 'amber', label: 'Bronze', class: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]' },
    { value: 'yellow', label: 'Gold', class: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]' },
    { value: 'cyan', label: 'Platinum', class: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]' },
    { value: 'purple', label: 'Diamond', class: 'from-[var(--theme-accent)] to-[var(--theme-accent)]' },
    { value: 'green', label: 'Emerald', class: 'from-[var(--theme-status-success)] to-[var(--theme-status-success)]' },
    { value: 'rose', label: 'Ruby', class: 'from-[var(--theme-status-danger)] to-[var(--theme-status-danger)]' },
    { value: 'blue', label: 'Sapphire', class: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]' },
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

    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || countryProfile.currencyCode;

    return (
        <Modal
            isOpen={isPointRuleModalOpen}
            onClose={() => setIsPointRuleModalOpen(false)}
            title={editingPointRule ? 'Edit Point Rule' : 'Add New Point Rule'}
            size="lg"
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Rule Name & Type */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
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
                            className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors ${
                                ruleNameError ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'
                            }`}
                        />
                        {ruleNameError && <p className="text-[10px] text-[var(--theme-status-danger-text)] mt-0.5">Rule name is required</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Rule Type
                        </label>
                        <select
                            value={editedPointRule.type || 'category'}
                            aria-label="Rule Type"
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, type: e.target.value as PointRuleType })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-semibold outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors cursor-pointer"
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
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Category
                        </label>
                        <select
                            value={editedPointRule.categoryId || 'all'}
                            aria-label="Category"
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, categoryId: e.target.value })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-semibold outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                                <optgroup key={group} label={group}>
                                    {items.map(c => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}

                {editedPointRule.type === 'product' && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Product SKU
                        </label>
                        <input
                            type="text"
                            value={editedPointRule.productSku || ''}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, productSku: e.target.value })}
                            placeholder="Enter product SKU"
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors font-mono"
                        />
                        <p className="text-[10px] text-[var(--theme-text-secondary)]">
                            Enter the SKU of the specific catalog product this rule targets
                        </p>
                    </div>
                )}

                {/* Points Configuration */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Points Per Unit Sold
                        </label>
                        <input
                            type="number"
                            min="0"
                            aria-label="Points Per Unit Sold"
                            value={editedPointRule.pointsPerUnit || 0}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, pointsPerUnit: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Priority (higher = applied first)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            aria-label="Priority"
                            value={editedPointRule.priority || 5}
                            onChange={(e) => setEditedPointRule({ ...editedPointRule, priority: parseInt(e.target.value) || 5 })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                    </div>
                </div>

                {/* Revenue-based Options */}
                {editedPointRule.type === 'revenue' && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Points Per Revenue Threshold
                            </label>
                            <input
                                type="number"
                                min="0"
                                aria-label="Points Per Revenue Threshold"
                                value={editedPointRule.pointsPerRevenue || 0}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, pointsPerRevenue: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Revenue Threshold ({currency})
                            </label>
                            <input
                                type="number"
                                min="1"
                                aria-label="Revenue Threshold"
                                value={editedPointRule.revenueThreshold || 100}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, revenueThreshold: parseInt(e.target.value) || 100 })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <p className="col-span-2 text-[10px] text-[var(--theme-text-secondary)]">
                            Example: 1 pt per {currency}{editedPointRule.revenueThreshold || 100} = {Math.floor(1000 / (editedPointRule.revenueThreshold || 100)) * (editedPointRule.pointsPerRevenue || 0)} pts for a {currency}1,000 checkout
                        </p>
                    </div>
                )}

                {/* Quantity Bonus Options */}
                {editedPointRule.type === 'quantity' && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Minimum Quantity to Trigger
                            </label>
                            <input
                                type="number"
                                min="1"
                                aria-label="Minimum Quantity"
                                value={editedPointRule.minQuantity || 1}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, minQuantity: parseInt(e.target.value) || 1 })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Points Multiplier
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="0.1"
                                aria-label="Points Multiplier"
                                value={editedPointRule.multiplier || 1}
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, multiplier: parseFloat(e.target.value) || 1 })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <p className="col-span-2 text-[10px] text-[var(--theme-text-secondary)]">
                            When selling {editedPointRule.minQuantity || 1}+ items, multiply all points by {editedPointRule.multiplier || 1}x
                        </p>
                    </div>
                )}

                {/* Max Points Cap */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
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
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                    />
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">Leave empty for no cap.</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Description
                    </label>
                    <textarea
                        value={editedPointRule.description || ''}
                        aria-label="Description"
                        onChange={(e) => setEditedPointRule({ ...editedPointRule, description: e.target.value })}
                        placeholder="Describe what this rule does..."
                        rows={2}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] font-normal outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors resize-none"
                    />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Rule Color Accent
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setEditedPointRule({ ...editedPointRule, color: color.value })}
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color.class} flex items-center justify-center transition-all cursor-pointer ${
                                    editedPointRule.color === color.value
                                        ? 'ring-2 ring-[var(--theme-accent)] dark:ring-[var(--theme-accent)] scale-110 shadow-xs'
                                        : 'opacity-70 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedPointRule.color === color.value && <Sparkles size={14} className="text-[var(--theme-text-primary)]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <div>
                        <p className="font-semibold text-xs text-[var(--theme-text-primary)]">Enable Rule</p>
                        <p className="text-[10px] text-[var(--theme-text-secondary)]">Disabled rules don't accumulate points</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={editedPointRule.enabled ?? true}
                        onClick={() => setEditedPointRule({ ...editedPointRule, enabled: !(editedPointRule.enabled ?? true) })}
                        aria-label="Enable point rule"
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${
                            (editedPointRule.enabled ?? true) ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-[var(--theme-bg-card)] shadow-xs transition-transform ${(editedPointRule.enabled ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 justify-end">
                    <button
                        type="button"
                        onClick={() => setIsPointRuleModalOpen(false)}
                        className="h-9 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSavePointRule}
                        className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Save size={14} />
                        {editingPointRule ? 'Update Rule' : 'Add Rule'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default PointRuleModal;
