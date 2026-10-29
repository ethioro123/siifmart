import React from 'react';
import { Gift, Calendar, DollarSign, Package, Users, UserCheck, Zap, Plus, Star, Medal, Edit2, Trash2, TrendingUp, Info } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { useData } from '../../../contexts/DataContext';
import { Country, getCountryProfile } from '../../../utils/localization';

export const WarehouseTab: React.FC = () => {
    const {
        bonusEnabled, setBonusEnabled,
        payoutFrequency, setPayoutFrequency,
        sites, toggleStoreBonusEligibility,
        warehousePointsRoles, setWarehousePointsRoles,
        warehousePointRules, setWarehousePointRules,
        setEditingWarehouseRule, setEditedWarehouseRule,
        setIsWarehouseRuleModalOpen, handleResetDefaults,
        bonusTiers, openAddModal, getColorClass,
        openEditModal, handleDeleteTier, calculateExampleBonus
    } = useGamification();

    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || countryProfile.currencyCode;

    const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* MAIN CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                                <Gift size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">Bonus System</h4>
                                <p className="text-[11px] text-[var(--theme-text-secondary)]">Enable worker bonuses</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={bonusEnabled}
                            onClick={() => setBonusEnabled(!bonusEnabled)}
                            aria-label="Toggle warehouse bonuses"
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${bonusEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${bonusEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
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
                        title="Select payout frequency"
                        value={payoutFrequency}
                        onChange={(e) => setPayoutFrequency(e.target.value as any)}
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
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">Bonus Currency</h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">Sovereign unit</p>
                        </div>
                    </div>
                    <div className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3 py-2 text-xs font-semibold">
                        {countryProfile.name} ({currency})
                    </div>
                </div>
            </div>

            {/* WAREHOUSE ELIGIBILITY SECTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Package className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            Warehouse Eligibility
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Control which warehouses participate in the worker bonus program
                        </p>
                    </div>
                </div>

                {warehouses.length === 0 ? (
                    <div className="text-center py-8 text-[var(--theme-text-secondary)] text-xs">
                        <Package size={28} className="mx-auto mb-2 opacity-40" />
                        <p>No warehouses configured</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {warehouses.map(warehouse => {
                            const isEnabled = warehouse.warehouseBonusEnabled !== false;
                            return (
                                <div
                                    key={warehouse.id}
                                    className={`bg-[var(--theme-bg-subtle)] border rounded-xl p-3.5 transition-all ${isEnabled ? 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50' : 'border-transparent opacity-60'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/10 dark:text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'}`}>
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{warehouse.name}</h4>
                                                <p className="text-[10px] text-[var(--theme-text-secondary)]">{warehouse.type} • {warehouse.code}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isEnabled}
                                            onClick={() => toggleStoreBonusEligibility(warehouse, 'warehouseBonusEnabled')}
                                            aria-label={`Toggle bonus for ${warehouse.name}`}
                                            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${isEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[var(--theme-border)]">
                                        <p className={`text-[11px] font-medium ${isEnabled ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-text-secondary)]'}`}>
                                            {isEnabled ? 'Workers earn bonuses' : 'Not participating'}
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
                        {warehouses.filter(w => w.warehouseBonusEnabled !== false).length} warehouses enabled
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                        <div className="w-2 h-2 rounded-full bg-[var(--theme-border)]"></div>
                        {warehouses.filter(w => w.warehouseBonusEnabled === false).length} warehouses disabled
                    </div>
                </div>
            </div>

            {/* ROLE ELIGIBILITY SECTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Users className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            Role Eligibility
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Control which warehouse floor roles can earn points and performance incentives
                        </p>
                    </div>
                    <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        {warehousePointsRoles.filter(r => r.enabled).length} of {warehousePointsRoles.length} roles enabled
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {warehousePointsRoles.map((roleConfig) => (
                        <div
                            key={roleConfig.role}
                            className={`bg-[var(--theme-bg-subtle)] border rounded-xl p-3.5 transition-all cursor-pointer ${roleConfig.enabled ? 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50' : 'border-transparent opacity-60'}`}
                            onClick={() => {
                                setWarehousePointsRoles(prev =>
                                    prev.map(r => r.role === roleConfig.role ? { ...r, enabled: !r.enabled } : r)
                                );
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleConfig.enabled ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/10 dark:text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'}`}>
                                        <UserCheck size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{roleConfig.label}</h4>
                                        <p className="text-[10px] text-[var(--theme-text-secondary)]">{roleConfig.role}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={roleConfig.enabled}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setWarehousePointsRoles(prev =>
                                            prev.map(r => r.role === roleConfig.role ? { ...r, enabled: !r.enabled } : r)
                                        );
                                    }}
                                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${roleConfig.enabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${roleConfig.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center gap-2">
                    <Info size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Only enabled roles will accumulate points upon job verification. Disable roles not eligible for shift bonuses.
                    </p>
                </div>
            </div>

            {/* WAREHOUSE POINT RULES SECTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Zap className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                            Warehouse Point Rules
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Configure how many points workers earn for verified activities
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingWarehouseRule(null);
                                setEditedWarehouseRule({
                                    id: `wpr-${Date.now()}`,
                                    action: 'PICK' as any,
                                    points: 10,
                                    description: '',
                                    enabled: true,
                                });
                                setIsWarehouseRuleModalOpen(true);
                            }}
                            className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                            <Plus size={14} /> Add Rule
                        </button>
                        <button
                            type="button"
                            onClick={() => handleResetDefaults('warehouse')}
                            className="h-8 px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold border border-[var(--theme-border)] transition-colors cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {warehousePointRules.map((rule) => (
                        <div
                            key={rule.id}
                            className={`bg-[var(--theme-bg-subtle)] border rounded-xl p-3.5 transition-all group ${rule.enabled ? 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50' : 'border-transparent opacity-60'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rule.enabled ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/10 dark:text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'}`}>
                                        {rule.action.includes('STREAK') ? <TrendingUp size={15} /> : <Package size={15} />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{rule.action}</h4>
                                        <p className="text-[10px] text-[var(--theme-text-secondary)]">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-1">
                                        <p className="text-[10px] text-[var(--theme-text-secondary)]">Points</p>
                                        <p className={`text-xs font-bold ${rule.enabled ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`}>
                                            +{rule.points}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingWarehouseRule(rule);
                                            setEditedWarehouseRule({ ...rule });
                                            setIsWarehouseRuleModalOpen(true);
                                        }}
                                        className="p-1 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                                        title={`Edit points for ${rule.action}`}
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={rule.enabled}
                                        onClick={() => {
                                            setWarehousePointRules(prev =>
                                                prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)
                                            );
                                        }}
                                        className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${rule.enabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWarehousePointRules(prev => prev.filter(r => r.id !== rule.id))}
                                        className="p-1 rounded-lg text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title={`Delete ${rule.action} rule`}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BONUS TIERS SECTION */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <Star className="text-[var(--theme-status-warning-text)]" size={18} />
                            Bonus Tiers
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Define point ranges and corresponding bonus amounts
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openAddModal('warehouse')}
                        className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Plus size={14} /> Add Tier
                    </button>
                </div>

                <div className="space-y-3">
                    {bonusTiers.sort((a, b) => a.minPoints - b.minPoints).map((tier, index) => (
                        <div
                            key={tier.id}
                            className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={22} className="text-white" />
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
                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Base Bonus</p>
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                        {currency} {tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right px-3 border-l border-[var(--theme-border)]">
                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Per Point</p>
                                    <p className="text-sm font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                        +{currency} {(tier.bonusPerPoint || 0).toFixed(2)}
                                    </p>
                                </div>

                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(tier, 'warehouse')}
                                        className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTier(tier.id, 'warehouse')}
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

            {/* BONUS CALCULATOR PREVIEW */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                    <TrendingUp className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                    Bonus Calculator Preview
                </h3>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                    Simulate how bonuses are awarded at various operational points milestones
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[100, 300, 600, 1000, 1500, 2000, 3000, 5000].map(points => {
                        const bonus = calculateExampleBonus(points);
                        const tier = bonusTiers.find(t =>
                            points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
                        );
                        return (
                            <div key={points} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-center">
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{points.toLocaleString()} pts</p>
                                <p className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                    {currency} {bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                                {tier && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                        {tier.tierName}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default WarehouseTab;
