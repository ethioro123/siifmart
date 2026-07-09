import React from 'react';
import {
    Store, ShoppingBag, Calendar, Percent, ToggleRight, ToggleLeft, Star, Plus,
    Medal, Edit2, Trash2, Zap, Target, Layers, Package, DollarSign, Hash, Tag
} from 'lucide-react';
import { useGamification } from './GamificationContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import type { PointRuleType } from '../../../types';
import { POSRoleDistributionList } from './components/POSRoleDistributionList';
import { POSPointRulesList } from './components/POSPointRulesList';

export const POSTab: React.FC = () => {
    const {
        posBonusEnabled,
        setPosBonusEnabled,
        posPayoutFrequency,
        setPosPayoutFrequency,
        posRoleDistribution,
        setPosRoleDistribution,
        posPointRules,
        setPosPointRules,
        sites,
        toggleStoreBonusEligibility,
        handleResetDefaults,
        openAddModal,
        openEditModal,
        handleDeleteTier,
        openRoleModal,
        handleDeleteRole,
        openPointRuleModal,
        handleDeletePointRule,
        togglePointRule,
        getColorClass
    } = useGamification();

    const stores = sites.filter(s => s.type === 'Store' || s.type === 'Dark Store');
    const totalRolePercentage = posRoleDistribution.reduce((sum, r) => sum + r.percentage, 0);

    const getRuleTypeIcon = (type: PointRuleType) => {
        switch (type) {
            case 'category': return <Layers size={16} />;
            case 'product': return <Package size={16} />;
            case 'revenue': return <DollarSign size={16} />;
            case 'quantity': return <Hash size={16} />;
            case 'promotion': return <Tag size={16} />;
            default: return <Zap size={16} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* POS HEADER INFO */}
            <div className="p-4 bg-amber-600/10 border border-[#E2DCCE]/40 dark:border-emerald-950/20 rounded-2xl flex items-start gap-3 shadow-sm select-none">
                <Store className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-amber-600 dark:text-amber-500 font-bold text-sm">Team-Based Bonus System</h4>
                    <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                        Stores earn points collectively from transactions. When a store reaches a tier, the bonus pool is distributed among staff based on their role percentages.
                    </p>
                </div>
            </div>

            {/* POS MAIN CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Enable/Disable */}
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-600/10 dark:bg-amber-500/10 flex items-center justify-center">
                                <ShoppingBag size={20} className="text-amber-600 dark:text-amber-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">POS Team Bonus</h4>
                                <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">Enable store bonuses</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" title="Toggle POS bonuses">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={posBonusEnabled}
                                onChange={(e) => setPosBonusEnabled(e.target.checked)}
                                title="Enable POS team bonuses"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 dark:peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                </div>

                {/* Payout Frequency */}
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600/10 dark:bg-amber-500/10 flex items-center justify-center">
                            <Calendar size={20} className="text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">Payout Frequency</h4>
                            <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">When bonuses are calculated</p>
                        </div>
                    </div>
                    <select
                        title="Select POS payout frequency"
                        value={posPayoutFrequency}
                        onChange={(e) => setPosPayoutFrequency(e.target.value as any)}
                        className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#1E3F27] dark:text-[#EAE5D9] focus:border-amber-600 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {/* Role Distribution Status */}
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center`}>
                            <Percent size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">Role Distribution</h4>
                            <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">Must total 100%</p>
                        </div>
                    </div>
                    <div className={`w-full text-center py-2 rounded-lg font-bold text-sm ${totalRolePercentage === 100 ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-red-500/20 text-red-500 dark:text-red-400'}`}>
                        {totalRolePercentage}% allocated
                    </div>
                </div>
            </div>

            {/* STORE ELIGIBILITY SECTION */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Store className="text-amber-600 dark:text-amber-500" size={22} />
                            Store Eligibility
                        </h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-1">
                            Control which stores participate in the bonus program
                        </p>
                    </div>
                </div>

                {stores.length === 0 ? (
                    <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                        <Store size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No stores configured</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">Add stores in Settings → Locations</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stores.map(store => {
                            const isEnabled = store.bonusEnabled !== false;
                            return (
                                <div
                                    key={store.id}
                                    className={`bg-stone-50/50 dark:bg-black/25 border rounded-xl p-4 transition-all ${
                                        isEnabled
                                            ? 'border-[#2C5E3B]/30 hover:border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 dark:hover:border-[#A9CBA2]/50'
                                            : 'border-transparent opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                isEnabled
                                                    ? 'bg-gradient-to-br from-[#2C5E3B] to-[#4A855A] dark:from-[#A9CBA2] dark:to-emerald-950'
                                                    : 'bg-stone-200 dark:bg-stone-800'
                                            }`}>
                                                <Store size={20} className={isEnabled ? 'text-white' : 'text-stone-600 dark:text-stone-400'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">{store.name}</h4>
                                                <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">
                                                    {store.type} • {store.code}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleStoreBonusEligibility(store, 'bonusEnabled')}
                                            className={`p-2 rounded-lg transition-all cursor-pointer ${
                                                isEnabled
                                                    ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/30 dark:hover:bg-[#A9CBA2]/30'
                                                    : 'bg-stone-200/50 text-stone-500 hover:bg-stone-200/70 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800/70'
                                            }`}
                                        >
                                            {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[#E2DCCE] dark:border-emerald-950/20">
                                        <p className={`text-xs ${isEnabled ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'}`}>
                                            {isEnabled ? '✓ Earning points & bonuses' : '✗ Not participating'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                <div className="mt-4 flex gap-4 text-xs select-none">
                    <div className="flex items-center gap-2 text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                        <div className="w-3 h-3 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2]"></div>
                        {stores.filter(s => s.bonusEnabled !== false).length} stores enabled
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 dark:text-[#7A9E83]">
                        <div className="w-3 h-3 rounded-full bg-stone-400 dark:bg-stone-600"></div>
                        {stores.filter(s => s.bonusEnabled === false).length} stores disabled
                    </div>
                </div>
            </div>

            {/* POS BONUS TIERS */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Star className="text-amber-600 dark:text-amber-500" size={22} />
                            Store Bonus Tiers
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                            Define point thresholds for store bonuses (based on transactions/revenue)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleResetDefaults('pos')}
                            className="px-3 py-2 text-xs bg-stone-200/50 hover:bg-stone-200/80 text-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-800/80 dark:text-stone-300 rounded-lg transition-all cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={() => openAddModal('pos')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:text-[#0B0F0D] dark:hover:bg-amber-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer animate-in fade-in"
                        >
                            <Plus size={16} />
                            Add Tier
                        </button>
                    </div>
                </div>

                {/* Tiers List */}
                <div className="space-y-3">
                    {useGamification().posBonusTiers.sort((a, b) => a.minPoints - b.minPoints).map((tier, index) => (
                        <div
                            key={tier.id}
                            className="bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 rounded-xl p-4 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={28} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{tier.tierName}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getColorClass(tier.tierColor)} text-white`}>
                                            Tier {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                                        {tier.minPoints.toLocaleString()} - {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} points
                                    </p>
                                </div>
                                <div className="text-right px-4 border-l border-[#E2DCCE] dark:border-emerald-950/20">
                                    <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Bonus Pool</p>
                                    <p className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
                                        {CURRENCY_SYMBOL}{tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(tier, 'pos')}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTier(tier.id, 'pos')}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                                        title={`Delete ${tier.tierName}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ROLE DISTRIBUTION */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Percent className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                            POS Role Bonus Distribution
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                            Allocate the bonus pool percentage by employee role. Must total exactly 100%.
                        </p>
                    </div>
                    <button
                        onClick={() => openRoleModal()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:text-[#0B0F0D] dark:hover:bg-amber-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        Add Role
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
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Zap className="text-amber-600 dark:text-amber-500" size={22} />
                            Store Point Automation Rules
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                            Configure how stores collectively earn points for bonuses
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleResetDefaults('pos')}
                            className="px-3 py-2 text-xs bg-stone-200/50 hover:bg-stone-200/80 text-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-800/80 dark:text-stone-300 rounded-lg transition-all cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={() => openPointRuleModal()}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:text-[#0B0F0D] dark:hover:bg-amber-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            Add Rule
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="flex-1 bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-4 select-none">
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
                            {posPointRules.filter(r => r.enabled).length}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Active Rules</p>
                    </div>
                    <div className="flex-1 bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-4 select-none">
                        <p className="text-3xl font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
                            {posPointRules.filter(r => r.type === 'category').length}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Category Rules</p>
                    </div>
                    <div className="flex-1 bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-4 select-none">
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            {posPointRules.filter(r => r.type === 'product').length}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Product Rules</p>
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
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-600/5 to-amber-700/5 border border-amber-600/20 dark:border-amber-950/40 rounded-xl">
                    <h4 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-3 flex items-center gap-2 select-none">
                        <Target className="text-amber-600 dark:text-amber-500" size={16} />
                        Example: Selling 5 Electronics + 10 Grocery items = {CURRENCY_SYMBOL}2,500
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(() => {
                            const electronicsRule = posPointRules.find(r => r.enabled && r.categoryId === 'Electronics');
                            const groceryRule = posPointRules.find(r => r.enabled && r.categoryId === 'Groceries');
                            const baseRule = posPointRules.find(r => r.enabled && r.type === 'quantity' && r.categoryId === 'all');
                            const revenueRule = posPointRules.find(r => r.enabled && r.type === 'revenue');

                            const items = [
                                { label: 'Electronics (5)', points: 5 * (electronicsRule?.pointsPerUnit || 0), color: 'amber' },
                                { label: 'Groceries (10)', points: 10 * (groceryRule?.pointsPerUnit || 0), color: 'emerald' },
                                { label: 'Base (15 items)', points: 15 * (baseRule?.pointsPerUnit || 1), color: 'emerald' },
                                { label: 'Revenue Bonus', points: revenueRule ? Math.floor(2500 / (revenueRule.revenueThreshold || 100)) * (revenueRule.pointsPerRevenue || 0) : 0, color: 'amber' },
                            ];

                            return items.map((item, idx) => (
                                <div key={idx} className="bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE]/50 dark:border-[#18201B] rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">{item.label}</p>
                                    <p className={`text-lg font-bold ${item.color === 'emerald' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-amber-600 dark:text-amber-500'}`}>
                                        +{item.points}
                                    </p>
                                </div>
                            ));
                        })()}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-3 text-center select-none">
                        Total:{' '}
                        <span className="text-amber-600 dark:text-amber-500 font-bold">
                            {(() => {
                                const electronicsRule = posPointRules.find(r => r.enabled && r.categoryId === 'Electronics');
                                const groceryRule = posPointRules.find(r => r.enabled && r.categoryId === 'Groceries');
                                const baseRule = posPointRules.find(r => r.enabled && r.type === 'quantity' && r.categoryId === 'all');
                                const revenueRule = posPointRules.find(r => r.enabled && r.type === 'revenue');

                                const total =
                                    5 * (electronicsRule?.pointsPerUnit || 0) +
                                    10 * (groceryRule?.pointsPerUnit || 0) +
                                    15 * (baseRule?.pointsPerUnit || 1) +
                                    (revenueRule ? Math.floor(2500 / (revenueRule.revenueThreshold || 100)) * (revenueRule.pointsPerRevenue || 0) : 0);
                                return total;
                            })()}
                        </span>{' '}
                        points for this transaction
                    </p>
                </div>
            </div>
        </div>
    );
};
export default POSTab;
