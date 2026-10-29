import React from 'react';
import {
    Store, ShoppingBag, Calendar, Percent, Star, Plus,
    Medal, Edit2, Trash2, Zap, Target, Layers, Package, DollarSign, Hash, Tag
} from 'lucide-react';
import { useGamification } from './GamificationContext';
import { useData } from '../../../contexts/DataContext';
import { Country, getCountryProfile } from '../../../utils/localization';
import type { PointRuleType } from '../../../types';
import { POSRoleDistributionList } from './components/POSRoleDistributionList';
import { POSPointRulesList } from './components/POSPointRulesList';

export const POSTab: React.FC = () => {
    const {
        posBonusEnabled, setPosBonusEnabled,
        posPayoutFrequency, setPosPayoutFrequency,
        posRoleDistribution, posPointRules, sites,
        toggleStoreBonusEligibility, handleResetDefaults,
        openAddModal, openEditModal, handleDeleteTier,
        openRoleModal, handleDeleteRole, openPointRuleModal,
        handleDeletePointRule, togglePointRule, getColorClass
    } = useGamification();

    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || countryProfile.currencyCode;

    const stores = sites.filter(s => s.type === 'Store');
    const totalRolePercentage = posRoleDistribution.reduce((sum, r) => sum + r.percentage, 0);

    const getRuleTypeIcon = (type: PointRuleType) => {
        switch (type) {
            case 'category': return <Layers size={15} />;
            case 'product': return <Package size={15} />;
            case 'revenue': return <DollarSign size={15} />;
            case 'quantity': return <Hash size={15} />;
            case 'promotion': return <Tag size={15} />;
            default: return <Zap size={15} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* POS HEADER INFO */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Store size={18} />
                </div>
                <div>
                    <h4 className="text-[var(--theme-text-primary)] font-semibold text-xs">Team-Based Retail Incentive Pool</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Stores accumulate points collectively from sales. When threshold tiers are reached, the bonus pool is allocated among staff per role percentages.
                    </p>
                </div>
            </div>

            {/* POS MAIN CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">POS Team Bonus</h4>
                                <p className="text-[11px] text-[var(--theme-text-secondary)]">Enable retail bonuses</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={posBonusEnabled}
                            onClick={() => setPosBonusEnabled(!posBonusEnabled)}
                            aria-label="Toggle POS bonuses"
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${posBonusEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-[var(--theme-bg-card)] shadow-xs transition-transform ${posBonusEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">Payout Frequency</h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">Calculation cadence</p>
                        </div>
                    </div>
                    <select
                        title="Select POS payout frequency"
                        value={posPayoutFrequency}
                        onChange={(e) => setPosPayoutFrequency(e.target.value as any)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3 py-2 text-xs font-semibold focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] outline-none transition-colors cursor-pointer"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                            <Percent size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">Role Distribution</h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">Target: exactly 100%</p>
                        </div>
                    </div>
                    <div className={`w-full text-center py-2 rounded-xl font-semibold text-xs border ${totalRolePercentage === 100 ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]' : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'}`}>
                        {totalRolePercentage}% allocated
                    </div>
                </div>
            </div>

            {/* STORE ELIGIBILITY SECTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Store className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            Store Eligibility
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Control which retail branches participate in the team bonus program
                        </p>
                    </div>
                </div>

                {stores.length === 0 ? (
                    <div className="text-center py-8 text-[var(--theme-text-secondary)] text-xs">
                        <Store size={28} className="mx-auto mb-2 opacity-40" />
                        <p>No retail stores configured</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stores.map(store => {
                            const isEnabled = store.bonusEnabled !== false;
                            return (
                                <div
                                    key={store.id}
                                    className={`bg-[var(--theme-bg-subtle)] border rounded-xl p-3.5 transition-all ${isEnabled ? 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50' : 'border-transparent opacity-60'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/10 dark:text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'}`}>
                                                <Store size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{store.name}</h4>
                                                <p className="text-[10px] text-[var(--theme-text-secondary)]">{store.type} • {store.code}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isEnabled}
                                            onClick={() => toggleStoreBonusEligibility(store, 'bonusEnabled')}
                                            aria-label={`Toggle bonus for ${store.name}`}
                                            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${isEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-[var(--theme-bg-card)] shadow-xs transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[var(--theme-border)]">
                                        <p className={`text-[11px] font-medium ${isEnabled ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-text-secondary)]'}`}>
                                            {isEnabled ? 'Earning team points' : 'Not participating'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold">
                        <div className="w-2 h-2 rounded-full bg-[var(--theme-status-success-bg)]"></div>
                        {stores.filter(s => s.bonusEnabled !== false).length} stores enabled
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                        <div className="w-2 h-2 rounded-full bg-[var(--theme-border)]"></div>
                        {stores.filter(s => s.bonusEnabled === false).length} stores disabled
                    </div>
                </div>
            </div>

            {/* POS BONUS TIERS */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Star className="text-[var(--theme-status-warning-text)]" size={18} />
                            Store Bonus Tiers
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Define point thresholds for store bonuses
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleResetDefaults('pos')}
                            className="h-8 px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold border border-[var(--theme-border)] transition-colors cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                        <button
                            type="button"
                            onClick={() => openAddModal('pos')}
                            className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                            <Plus size={14} /> Add Tier
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {useGamification().posBonusTiers.sort((a, b) => a.minPoints - b.minPoints).map((tier, index) => (
                        <div
                            key={tier.id}
                            className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={22} className="text-[var(--theme-text-primary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{tier.tierName}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                            Tier {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                        {tier.minPoints.toLocaleString()} - {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} points
                                    </p>
                                </div>
                                <div className="text-right px-3 border-l border-[var(--theme-border)]">
                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Bonus Pool</p>
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                        {currency} {tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(tier, 'pos')}
                                        className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTier(tier.id, 'pos')}
                                        className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] transition-colors cursor-pointer"
                                        title={`Delete ${tier.tierName}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ROLE DISTRIBUTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Percent className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            POS Role Bonus Distribution
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Allocate the bonus pool percentage by employee role. Must total exactly 100%.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openRoleModal()}
                        className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Plus size={14} /> Add Role
                    </button>
                </div>

                <POSRoleDistributionList
                    posRoleDistribution={posRoleDistribution}
                    getColorClass={getColorClass}
                    openRoleModal={openRoleModal}
                    handleDeleteRole={handleDeleteRole}
                />
            </div>

            {/* POS POINT RULES */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Zap className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            Store Point Automation Rules
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Configure how stores collectively earn points for bonuses
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleResetDefaults('pos')}
                            className="h-8 px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold border border-[var(--theme-border)] transition-colors cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                        <button
                            type="button"
                            onClick={() => openPointRuleModal()}
                            className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                            <Plus size={14} /> Add Rule
                        </button>
                    </div>
                </div>

                <POSPointRulesList
                    posPointRules={posPointRules}
                    togglePointRule={togglePointRule}
                    getColorClass={getColorClass}
                    getRuleTypeIcon={getRuleTypeIcon}
                    openPointRuleModal={openPointRuleModal}
                    handleDeletePointRule={handleDeletePointRule}
                />

                {/* Point Calculation Preview */}
                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <Target className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={15} />
                        Example: Selling 5 Electronics + 10 Grocery items = {currency} 2,500
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(() => {
                            const electronicsRule = posPointRules.find(r => r.enabled && r.categoryId === 'Electronics');
                            const groceryRule = posPointRules.find(r => r.enabled && r.categoryId === 'Groceries');
                            const baseRule = posPointRules.find(r => r.enabled && r.type === 'quantity' && r.categoryId === 'all');
                            const revenueRule = posPointRules.find(r => r.enabled && r.type === 'revenue');

                            const items = [
                                { label: 'Electronics (5)', points: 5 * (electronicsRule?.pointsPerUnit || 0) },
                                { label: 'Groceries (10)', points: 10 * (groceryRule?.pointsPerUnit || 0) },
                                { label: 'Base (15 items)', points: 15 * (baseRule?.pointsPerUnit || 1) },
                                { label: 'Revenue Bonus', points: revenueRule ? Math.floor(2500 / (revenueRule.revenueThreshold || 100)) * (revenueRule.pointsPerRevenue || 0) : 0 },
                            ];

                            return items.map((item, idx) => (
                                <div key={idx} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{item.label}</p>
                                    <p className="text-sm font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-0.5">
                                        +{item.points}
                                    </p>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default POSTab;
