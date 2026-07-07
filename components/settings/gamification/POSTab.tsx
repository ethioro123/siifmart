import React from 'react';
import {
    Store, ShoppingBag, Calendar, Percent, ToggleRight, ToggleLeft, Star, Plus,
    Medal, Edit2, Trash2, Zap, Target, Layers, Package, DollarSign, Hash, Tag
} from 'lucide-react';
import { useGamification } from './GamificationContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import type { PointRuleType } from '../../../types';

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
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Store className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-blue-400 font-bold text-sm">Team-Based Bonus System</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Stores earn points collectively from transactions. When a store reaches a tier, the bonus pool is distributed among staff based on their role percentages.
                    </p>
                </div>
            </div>

            {/* POS MAIN CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Enable/Disable */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                <ShoppingBag size={20} className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">POS Team Bonus</h4>
                                <p className="text-[10px] text-gray-400">Enable store bonuses</p>
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
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                </div>

                {/* Payout Frequency */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                            <Calendar size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Payout Frequency</h4>
                            <p className="text-[10px] text-gray-400">When bonuses are calculated</p>
                        </div>
                    </div>
                    <select
                        title="Select POS payout frequency"
                        value={posPayoutFrequency}
                        onChange={(e) => setPosPayoutFrequency(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {/* Role Distribution Status */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${totalRolePercentage === 100 ? 'from-green-400 to-emerald-500' : 'from-red-400 to-red-600'} flex items-center justify-center`}>
                            <Percent size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Role Distribution</h4>
                            <p className="text-[10px] text-gray-400">Must total 100%</p>
                        </div>
                    </div>
                    <div className={`w-full text-center py-2 rounded-lg font-bold text-sm ${totalRolePercentage === 100 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {totalRolePercentage}% allocated
                    </div>
                </div>
            </div>

            {/* STORE ELIGIBILITY SECTION */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Store className="text-blue-400" size={22} />
                            Store Eligibility
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Control which stores participate in the bonus program
                        </p>
                    </div>
                </div>

                {stores.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Store size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No stores configured</p>
                        <p className="text-xs text-gray-500">Add stores in Settings → Locations</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stores.map(store => {
                            const isEnabled = store.bonusEnabled !== false;
                            return (
                                <div
                                    key={store.id}
                                    className={`bg-black/30 border rounded-xl p-4 transition-all ${
                                        isEnabled
                                            ? 'border-green-500/30 hover:border-green-500/50'
                                            : 'border-white/5 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                isEnabled
                                                    ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                                                    : 'bg-gray-700'
                                            }`}>
                                                <Store size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{store.name}</h4>
                                                <p className="text-[10px] text-gray-400">
                                                    {store.type} • {store.code}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleStoreBonusEligibility(store, 'bonusEnabled')}
                                            className={`p-2 rounded-lg transition-all ${
                                                isEnabled
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                                            }`}
                                        >
                                            {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        <p className={`text-xs ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                                            {isEnabled ? '✓ Earning points & bonuses' : '✗ Not participating'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                <div className="mt-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        {stores.filter(s => s.bonusEnabled !== false).length} stores enabled
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        {stores.filter(s => s.bonusEnabled === false).length} stores disabled
                    </div>
                </div>
            </div>

            {/* POS BONUS TIERS */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Star className="text-blue-400" size={22} />
                            Store Bonus Tiers
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Define point thresholds for store bonuses (based on transactions/revenue)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleResetDefaults('pos')}
                            className="px-3 py-2 text-xs bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={() => openAddModal('pos')}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
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
                            className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={28} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{tier.tierName}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getColorClass(tier.tierColor)} text-white`}>
                                            Tier {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {tier.minPoints.toLocaleString()} - {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} points
                                    </p>
                                </div>
                                <div className="text-right px-4 border-l border-white/10">
                                    <p className="text-xs text-gray-400">Bonus Pool</p>
                                    <p className="text-lg font-bold text-green-400">
                                        {CURRENCY_SYMBOL}{tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(tier, 'pos')}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTier(tier.id, 'pos')}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Percent className="text-purple-400" size={22} />
                            POS Role Bonus Distribution
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Allocate the bonus pool percentage by employee role. Must total exactly 100%.
                        </p>
                    </div>
                    <button
                        onClick={() => openRoleModal()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Add Role
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {posRoleDistribution.map(role => (
                        <div
                            key={role.id}
                            className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClass(role.color)} flex items-center justify-center shrink-0`}>
                                    <Percent size={20} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white">{role.role}</h4>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Gets {role.percentage}% of store bonus pool
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openRoleModal(role)}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                        title={`Edit ${role.role}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                                        title={`Delete ${role.role}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* POS POINT RULES */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="text-blue-400" size={22} />
                            Store Point Automation Rules
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Configure how stores collectively earn points for bonuses
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleResetDefaults('pos')}
                            className="px-3 py-2 text-xs bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={() => openPointRuleModal()}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                            Add Rule
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="flex-1 bg-black/30 rounded-xl p-4">
                        <p className="text-3xl font-black text-blue-400">
                            {posPointRules.filter(r => r.enabled).length}
                        </p>
                        <p className="text-xs text-gray-400">Active Rules</p>
                    </div>
                    <div className="flex-1 bg-black/30 rounded-xl p-4">
                        <p className="text-3xl font-black text-green-400">
                            {posPointRules.filter(r => r.type === 'category').length}
                        </p>
                        <p className="text-xs text-gray-400">Category Rules</p>
                    </div>
                    <div className="flex-1 bg-black/30 rounded-xl p-4">
                        <p className="text-3xl font-black text-purple-400">
                            {posPointRules.filter(r => r.type === 'product').length}
                        </p>
                        <p className="text-xs text-gray-400">Product Rules</p>
                    </div>
                </div>

                {/* Rules List */}
                <div className="space-y-3">
                    {posPointRules.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(rule => (
                        <div
                            key={rule.id}
                            className={`bg-black/30 border rounded-xl p-4 transition-all group ${
                                rule.enabled ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => togglePointRule(rule.id)}
                                    className={`p-2 rounded-lg transition-all ${
                                        rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'
                                    }`}
                                >
                                    {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>

                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(rule.color || 'blue')} flex items-center justify-center shrink-0`}>
                                    {getRuleTypeIcon(rule.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{rule.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            rule.type === 'category' ? 'bg-blue-500/20 text-blue-400' :
                                            rule.type === 'product' ? 'bg-purple-500/20 text-purple-400' :
                                            rule.type === 'revenue' ? 'bg-green-500/20 text-green-400' :
                                            rule.type === 'quantity' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-pink-500/20 text-pink-400'
                                        }`}>
                                            {rule.type}
                                        </span>
                                        {rule.multiplier && rule.multiplier > 1 && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
                                                {rule.multiplier}x
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                        {rule.description || `${rule.pointsPerUnit} pts per unit`}
                                    </p>
                                    {rule.categoryId && rule.categoryId !== 'all' && (
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            Category: {rule.categoryId}
                                        </p>
                                    )}
                                </div>

                                <div className="text-right px-4 border-l border-white/10">
                                    <p className="text-xs text-gray-400">Points/Unit</p>
                                    <p className="text-xl font-bold text-yellow-400">+{rule.pointsPerUnit}</p>
                                </div>

                                {rule.pointsPerRevenue && (
                                    <div className="text-right px-4 border-l border-white/10">
                                        <p className="text-xs text-gray-400">Per {CURRENCY_SYMBOL}{rule.revenueThreshold}</p>
                                        <p className="text-xl font-bold text-green-400">+{rule.pointsPerRevenue}</p>
                                    </div>
                                )}

                                <div className="text-center px-3">
                                    <p className="text-[10px] text-gray-500">Priority</p>
                                    <p className="text-sm font-bold text-gray-400">{rule.priority || 1}</p>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openPointRuleModal(rule)}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                        title="Edit Rule"
                                        aria-label="Edit Rule"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePointRule(rule.id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                                        title="Delete Rule"
                                        aria-label="Delete Rule"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Point Calculation Preview */}
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Target className="text-yellow-400" size={16} />
                        Example: Selling 5 Electronics + 10 Grocery items = {CURRENCY_SYMBOL}2,500
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(() => {
                            const electronicsRule = posPointRules.find(r => r.enabled && r.categoryId === 'Electronics');
                            const groceryRule = posPointRules.find(r => r.enabled && r.categoryId === 'Groceries');
                            const baseRule = posPointRules.find(r => r.enabled && r.type === 'quantity' && r.categoryId === 'all');
                            const revenueRule = posPointRules.find(r => r.enabled && r.type === 'revenue');

                            const items = [
                                { label: 'Electronics (5)', points: 5 * (electronicsRule?.pointsPerUnit || 0), color: 'purple' },
                                { label: 'Groceries (10)', points: 10 * (groceryRule?.pointsPerUnit || 0), color: 'emerald' },
                                { label: 'Base (15 items)', points: 15 * (baseRule?.pointsPerUnit || 1), color: 'blue' },
                                { label: 'Revenue Bonus', points: revenueRule ? Math.floor(2500 / (revenueRule.revenueThreshold || 100)) * (revenueRule.pointsPerRevenue || 0) : 0, color: 'green' },
                            ];

                            return items.map((item, idx) => (
                                <div key={idx} className="bg-black/30 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-400">{item.label}</p>
                                    <p className={`text-lg font-bold text-${item.color}-400`}>
                                        +{item.points}
                                    </p>
                                </div>
                            ));
                        })()}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        Total:{' '}
                        <span className="text-yellow-400 font-bold">
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
