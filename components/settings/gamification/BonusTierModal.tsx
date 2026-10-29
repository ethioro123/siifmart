import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import { useGamification } from './GamificationContext';
import { useData } from '../../../contexts/DataContext';
import { Country, getCountryProfile } from '../../../utils/localization';

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

export const BonusTierModal: React.FC = () => {
    const {
        isModalOpen,
        setIsModalOpen,
        editingTier,
        editedTier,
        setEditedTier,
        handleSaveTier
    } = useGamification();

    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || countryProfile.currencyCode;

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingTier ? 'Edit Bonus Tier' : 'Add New Bonus Tier'}
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Tier Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Tier Name *
                    </label>
                    <input
                        type="text"
                        value={editedTier.tierName || ''}
                        onChange={(e) => setEditedTier({ ...editedTier, tierName: e.target.value })}
                        placeholder="e.g., Gold, Diamond, Elite"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                    />
                </div>

                {/* Point Range */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Min Points *
                        </label>
                        <input
                            type="number"
                            aria-label="Min Points"
                            value={editedTier.minPoints || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, minPoints: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
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
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                    </div>
                </div>

                {/* Bonus Amounts */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Base Bonus ({currency})
                        </label>
                        <input
                            type="number"
                            aria-label="Base Bonus"
                            value={editedTier.bonusAmount || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, bonusAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                        <p className="text-[10px] text-[var(--theme-text-secondary)]">Fixed payout for reaching tier</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                            Per-Point Bonus ({currency})
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            aria-label="Per-Point Bonus"
                            value={editedTier.bonusPerPoint || 0}
                            onChange={(e) => setEditedTier({ ...editedTier, bonusPerPoint: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                        />
                        <p className="text-[10px] text-[var(--theme-text-secondary)]">Additional incentive per unit</p>
                    </div>
                </div>

                {/* Tier Color */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                        Tier Badge Accent
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {TIER_COLORS.map(color => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setEditedTier({ ...editedTier, tierColor: color.value })}
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color.class} flex items-center justify-center transition-all cursor-pointer ${
                                    editedTier.tierColor === color.value
                                        ? 'ring-2 ring-[var(--theme-accent)] dark:ring-[var(--theme-accent)] scale-110 shadow-xs'
                                        : 'opacity-70 hover:opacity-100'
                                }`}
                                title={color.label}
                            >
                                {editedTier.tierColor === color.value && (
                                    <Sparkles size={14} className="text-[var(--theme-text-primary)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Example Calculation */}
                {editedTier.minPoints !== undefined && (
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5">
                        <p className="text-xs font-semibold text-[var(--theme-text-primary)] mb-1">Example Calculation</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Worker with <span className="font-semibold text-[var(--theme-text-primary)]">{((editedTier.minPoints || 0) + 50).toLocaleString()}</span> points earns:
                        </p>
                        <p className="text-lg font-bold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-1">
                            {currency} {((editedTier.bonusAmount || 0) + (((editedTier.minPoints || 0) + 50) * (editedTier.bonusPerPoint || 0))).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">
                            = {currency} {(editedTier.bonusAmount || 0).toLocaleString()} base + ({((editedTier.minPoints || 0) + 50)} × {currency} {(editedTier.bonusPerPoint || 0).toFixed(2)})
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 justify-end">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="h-9 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveTier}
                        className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Save size={14} />
                        {editingTier ? 'Update Tier' : 'Add Tier'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
