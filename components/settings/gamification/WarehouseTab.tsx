import React from 'react';
import { Gift, Calendar, DollarSign, Package, ToggleRight, ToggleLeft, Users, UserCheck, Zap, Plus, Star, Medal, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const WarehouseTab: React.FC = () => {
    const {
        settings,
        bonusEnabled,
        setBonusEnabled,
        payoutFrequency,
        setPayoutFrequency,
        sites,
        toggleStoreBonusEligibility,
        warehousePointsRoles,
        setWarehousePointsRoles,
        warehousePointRules,
        setWarehousePointRules,
        setEditingWarehouseRule,
        setEditedWarehouseRule,
        setIsWarehouseRuleModalOpen,
        handleResetDefaults,
        bonusTiers,
        openAddModal,
        getColorClass,
        openEditModal,
        handleDeleteTier,
        calculateExampleBonus
    } = useGamification();

    const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');

    return (
        <>
            {/* MAIN CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                {/* Enable/Disable */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyber-primary flex items-center justify-center">
                                <Gift size={20} className="text-black" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Bonus System</h4>
                                <p className="text-[10px] text-gray-400">Enable worker bonuses</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" title="Toggle warehouse bonuses">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={bonusEnabled}
                                onChange={(e) => setBonusEnabled(e.target.checked)}
                                title="Enable warehouse worker bonuses"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Payout Frequency */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Calendar size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Payout Frequency</h4>
                            <p className="text-[10px] text-gray-400">How often bonuses are calculated</p>
                        </div>
                    </div>
                    <select
                        title="Select payout frequency"
                        value={payoutFrequency}
                        onChange={(e) => setPayoutFrequency(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {/* Currency */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                            <DollarSign size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Bonus Currency</h4>
                            <p className="text-[10px] text-gray-400">Uses store currency</p>
                        </div>
                    </div>
                    <div className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400">
                        {settings.currency || 'ETB'} ({CURRENCY_SYMBOL})
                    </div>
                </div>
            </div>

            {/* WAREHOUSE ELIGIBILITY SECTION */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Package className="text-cyber-primary" size={22} />
                            Warehouse Eligibility
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Control which warehouses participate in worker bonus program
                        </p>
                    </div>
                </div>

                {warehouses.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No warehouses configured</p>
                        <p className="text-xs text-gray-500">Add warehouses in Settings → Locations</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {warehouses.map(warehouse => {
                            const isEnabled = warehouse.warehouseBonusEnabled !== false;
                            return (
                                <div
                                    key={warehouse.id}
                                    className={`bg-black/30 border rounded-xl p-4 transition-all ${
                                        isEnabled
                                            ? 'border-cyber-primary/30 hover:border-cyber-primary/50'
                                            : 'border-white/5 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                isEnabled ? 'bg-cyber-primary' : 'bg-gray-700'
                                            }`}>
                                                <Package size={20} className={isEnabled ? 'text-black' : 'text-white'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{warehouse.name}</h4>
                                                <p className="text-[10px] text-gray-400">
                                                    {warehouse.type} • {warehouse.code}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleStoreBonusEligibility(warehouse, 'warehouseBonusEnabled')}
                                            title={isEnabled ? `Disable bonus for ${warehouse.name}` : `Enable bonus for ${warehouse.name}`}
                                            className={`p-2 rounded-lg transition-all ${
                                                isEnabled
                                                    ? 'bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/30'
                                                    : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                                            }`}
                                        >
                                            {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        <p className={`text-xs ${isEnabled ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                            {isEnabled ? '✓ Workers earn bonuses' : '✗ Not participating'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                <div className="mt-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-2 text-cyber-primary">
                        <div className="w-3 h-3 rounded-full bg-cyber-primary"></div>
                        {warehouses.filter(w => w.warehouseBonusEnabled !== false).length} warehouses enabled
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        {warehouses.filter(w => w.warehouseBonusEnabled === false).length} warehouses disabled
                    </div>
                </div>
            </div>

            {/* ROLE ELIGIBILITY SECTION */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="text-purple-400" size={22} />
                            Role Eligibility
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Control which warehouse roles can earn points and bonuses
                        </p>
                    </div>
                    <div className="text-xs text-gray-400">
                        {warehousePointsRoles.filter(r => r.enabled).length} of {warehousePointsRoles.length} roles enabled
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {warehousePointsRoles.map((roleConfig) => (
                        <div
                            key={roleConfig.role}
                            className={`bg-black/30 border rounded-xl p-4 transition-all cursor-pointer ${
                                roleConfig.enabled
                                    ? 'border-purple-500/30 hover:border-purple-500/50'
                                    : 'border-white/5 opacity-60'
                            }`}
                            onClick={() => {
                                setWarehousePointsRoles(prev =>
                                    prev.map(r =>
                                        r.role === roleConfig.role
                                            ? { ...r, enabled: !r.enabled }
                                            : r
                                    )
                                );
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        roleConfig.enabled
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                            : 'bg-gray-700'
                                    }`}>
                                        <UserCheck size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{roleConfig.label}</h4>
                                        <p className="text-[10px] text-gray-500">{roleConfig.role}</p>
                                    </div>
                                </div>
                                <div className={`p-2 rounded-lg transition-all ${
                                    roleConfig.enabled
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-gray-500/20 text-gray-500'
                                }`}>
                                    {roleConfig.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-xs text-purple-300">
                        💡 <strong>Tip:</strong> Only enabled roles will earn points when completing jobs. Disable roles that shouldn't participate in the bonus program.
                    </p>
                </div>
            </div>

            {/* WAREHOUSE POINT RULES SECTION */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="text-cyber-primary" size={22} />
                            Warehouse Point Rules
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Configure how many points workers earn for different activities
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
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
                            className="px-4 py-2 bg-gradient-to-r from-cyber-primary to-cyber-accent text-black rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                            Add Rule
                        </button>
                        <button
                            onClick={() => handleResetDefaults('warehouse')}
                            className="px-3 py-2 text-xs bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all"
                        >
                            Reset Defaults
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {warehousePointRules.map((rule) => (
                        <div
                            key={rule.id}
                            className={`bg-black/30 border rounded-xl p-4 transition-all group ${
                                rule.enabled
                                    ? 'border-cyber-primary/30 hover:border-cyber-primary/50'
                                    : 'border-white/5 opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        rule.enabled ? 'bg-cyber-primary' : 'bg-gray-700'
                                    }`}>
                                        {rule.action.includes('STREAK')
                                            ? <TrendingUp size={18} className={rule.enabled ? 'text-black' : 'text-white'} />
                                            : <Package size={18} className={rule.enabled ? 'text-black' : 'text-white'} />
                                        }
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{rule.action}</h4>
                                        <p className="text-[10px] text-gray-400">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <p className="text-xs text-gray-400">Points</p>
                                        <p className={`text-sm font-bold ${rule.enabled ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                            +{rule.points}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingWarehouseRule(rule);
                                            setEditedWarehouseRule({ ...rule });
                                            setIsWarehouseRuleModalOpen(true);
                                        }}
                                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                        title={`Edit points for ${rule.action}`}
                                        aria-label={`Edit points for ${rule.action}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setWarehousePointRules(prev =>
                                                prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)
                                            );
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            rule.enabled ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-gray-500/20 text-gray-500'
                                        }`}
                                        title={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                        aria-label={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                    >
                                        {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button
                                        onClick={() => setWarehousePointRules(prev => prev.filter(r => r.id !== rule.id))}
                                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title={`Delete ${rule.action} rule`}
                                        aria-label={`Delete ${rule.action} rule`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BONUS TIERS SECTION */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Star className="text-yellow-400" size={22} />
                            Bonus Tiers
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Define point ranges and corresponding bonus amounts
                        </p>
                    </div>
                    <button
                        onClick={() => openAddModal('warehouse')}
                        className="px-4 py-2 bg-cyber-primary text-black rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Add Tier
                    </button>
                </div>

                {/* Tiers Grid */}
                <div className="space-y-3">
                    {bonusTiers.sort((a, b) => a.minPoints - b.minPoints).map((tier, index) => (
                        <div
                            key={tier.id}
                            className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Tier Badge */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={28} className="text-white" />
                                </div>

                                {/* Tier Info */}
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

                                {/* Bonus Info */}
                                <div className="text-right px-4 border-l border-white/10">
                                    <p className="text-xs text-gray-400">Base Bonus</p>
                                    <p className="text-lg font-bold text-green-400">
                                        {CURRENCY_SYMBOL}{tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right px-4 border-l border-white/10">
                                    <p className="text-xs text-gray-400">Per Point</p>
                                    <p className="text-lg font-bold text-cyan-400">
                                        +{CURRENCY_SYMBOL}{(tier.bonusPerPoint || 0).toFixed(2)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(tier, 'warehouse')}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTier(tier.id, 'warehouse')}
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

            {/* BONUS CALCULATOR PREVIEW */}
            <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-green-400" size={20} />
                    Bonus Calculator Preview
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    See how bonuses are calculated at different point levels
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[100, 300, 600, 1000, 1500, 2000, 3000, 5000].map(points => {
                        const bonus = calculateExampleBonus(points);
                        const tier = bonusTiers.find(t =>
                            points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
                        );
                        return (
                            <div key={points} className="bg-black/30 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400">{points.toLocaleString()} pts</p>
                                <p className="text-lg font-bold text-green-400">
                                    {CURRENCY_SYMBOL}{bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                                {tier && (
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r ${getColorClass(tier.tierColor)} text-white`}>
                                        {tier.tierName}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
export default WarehouseTab;
