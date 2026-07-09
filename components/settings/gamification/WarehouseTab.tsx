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
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center">
                                <Gift size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">Bonus System</h4>
                                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83]">Enable worker bonuses</p>
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
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2C5E3B] dark:peer-checked:bg-[#A9CBA2]"></div>
                        </label>
                    </div>
                </div>

                {/* Payout Frequency */}
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center">
                            <Calendar size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">Payout Frequency</h4>
                            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83]">How often bonuses are calculated</p>
                        </div>
                    </div>
                    <select
                        title="Select payout frequency"
                        value={payoutFrequency}
                        onChange={(e) => setPayoutFrequency(e.target.value as any)}
                        className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#1E3F27] dark:text-[#EAE5D9] focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {/* Currency */}
                <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600/10 dark:bg-amber-500/10 flex items-center justify-center">
                            <DollarSign size={20} className="text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">Bonus Currency</h4>
                            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83]">Uses store currency</p>
                        </div>
                    </div>
                    <div className="w-full bg-[#FAF8F5] dark:bg-[#0B0F0D]/40 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#1E3F27] dark:text-[#EAE5D9] rounded-lg px-3 py-2 text-sm">
                        {settings.currency || 'ETB'} ({CURRENCY_SYMBOL})
                    </div>
                </div>
            </div>

            {/* WAREHOUSE ELIGIBILITY SECTION */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Package className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                            Warehouse Eligibility
                        </h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-1">
                            Control which warehouses participate in worker bonus program
                        </p>
                    </div>
                </div>

                {warehouses.length === 0 ? (
                    <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No warehouses configured</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">Add warehouses in Settings → Locations</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {warehouses.map(warehouse => {
                            const isEnabled = warehouse.warehouseBonusEnabled !== false;
                            return (
                                <div
                                    key={warehouse.id}
                                    className={`bg-stone-50/50 dark:bg-black/25 border rounded-xl p-4 transition-all ${
                                        isEnabled
                                            ? 'border-[#2C5E3B]/30 hover:border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 dark:hover:border-[#A9CBA2]/50'
                                            : 'border-transparent opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                isEnabled ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-stone-200 dark:bg-stone-800'
                                            }`}>
                                                <Package size={20} className={isEnabled ? 'text-white dark:text-[#0B0F0D]' : 'text-stone-600 dark:text-stone-400'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">{warehouse.name}</h4>
                                                <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">
                                                    {warehouse.type} • {warehouse.code}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleStoreBonusEligibility(warehouse, 'warehouseBonusEnabled')}
                                            title={isEnabled ? `Disable bonus for ${warehouse.name}` : `Enable bonus for ${warehouse.name}`}
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
                                            {isEnabled ? '✓ Workers earn bonuses' : '✗ Not participating'}
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
                        {warehouses.filter(w => w.warehouseBonusEnabled !== false).length} warehouses enabled
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 dark:text-[#7A9E83]">
                        <div className="w-3 h-3 rounded-full bg-stone-400 dark:bg-stone-600"></div>
                        {warehouses.filter(w => w.warehouseBonusEnabled === false).length} warehouses disabled
                    </div>
                </div>
            </div>

            {/* ROLE ELIGIBILITY SECTION */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Users className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                            Role Eligibility
                        </h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-1">
                            Control which warehouse roles can earn points and bonuses
                        </p>
                    </div>
                    <div className="text-xs text-[#4D6E56] dark:text-[#7A9E83] font-semibold">
                        {warehousePointsRoles.filter(r => r.enabled).length} of {warehousePointsRoles.length} roles enabled
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {warehousePointsRoles.map((roleConfig) => (
                        <div
                            key={roleConfig.role}
                            className={`bg-stone-50/50 dark:bg-black/25 border rounded-xl p-4 transition-all cursor-pointer ${
                                roleConfig.enabled
                                    ? 'border-[#2C5E3B]/30 hover:border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 dark:hover:border-[#A9CBA2]/50'
                                    : 'border-transparent opacity-60'
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
                                            ? 'bg-gradient-to-br from-[#2C5E3B] to-[#4A855A] dark:from-[#A9CBA2] dark:to-emerald-950'
                                            : 'bg-stone-200 dark:bg-stone-800'
                                    }`}>
                                        <UserCheck size={20} className={roleConfig.enabled ? 'text-white' : 'text-stone-600 dark:text-stone-400'} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">{roleConfig.label}</h4>
                                        <p className="text-[10px] text-stone-400 dark:text-[#7A9E83]">{roleConfig.role}</p>
                                    </div>
                                </div>
                                <div className={`p-2 rounded-lg transition-all ${
                                    roleConfig.enabled
                                        ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]'
                                        : 'bg-stone-200/50 text-stone-500 dark:bg-stone-800/50 dark:text-stone-400'
                                }`}>
                                    {roleConfig.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-[#2C5E3B]/10 border border-[#E2DCCE]/40 dark:border-emerald-950/20 rounded-xl">
                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2]">
                        💡 <strong>Tip:</strong> Only enabled roles will earn points when completing jobs. Disable roles that shouldn't participate in the bonus program.
                    </p>
                </div>
            </div>

            {/* WAREHOUSE POINT RULES SECTION */}
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Zap className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                            Warehouse Point Rules
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
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
                            className="px-4 py-2 bg-[#2C5E3B] text-white hover:bg-[#1E3F27] dark:bg-[#A9CBA2] dark:text-[#0B0F0D] dark:hover:bg-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            Add Rule
                        </button>
                        <button
                            onClick={() => handleResetDefaults('warehouse')}
                            className="px-3 py-2 text-xs bg-stone-200/50 hover:bg-stone-200/80 text-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-800/80 dark:text-stone-300 rounded-lg transition-all cursor-pointer"
                        >
                            Reset Defaults
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {warehousePointRules.map((rule) => (
                        <div
                            key={rule.id}
                            className={`bg-stone-50/50 dark:bg-black/25 border rounded-xl p-4 transition-all group ${
                                rule.enabled
                                    ? 'border-[#2C5E3B]/30 hover:border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 dark:hover:border-[#A9CBA2]/50'
                                    : 'border-transparent opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        rule.enabled ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-stone-200 dark:bg-stone-800'
                                    }`}>
                                        {rule.action.includes('STREAK')
                                            ? <TrendingUp size={18} className={rule.enabled ? 'text-white dark:text-[#0B0F0D]' : 'text-stone-600 dark:text-stone-400'} />
                                            : <Package size={18} className={rule.enabled ? 'text-white dark:text-[#0B0F0D]' : 'text-stone-600 dark:text-stone-400'} />
                                        }
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">{rule.action}</h4>
                                        <p className="text-[10px] text-stone-500 dark:text-[#7A9E83]">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <p className="text-xs text-stone-400 dark:text-[#7A9E83]">Points</p>
                                        <p className={`text-sm font-bold ${rule.enabled ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'}`}>
                                            +{rule.points}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingWarehouseRule(rule);
                                            setEditedWarehouseRule({ ...rule });
                                            setIsWarehouseRuleModalOpen(true);
                                        }}
                                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
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
                                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                            rule.enabled ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'bg-stone-200/50 text-stone-500 dark:bg-stone-800/50 dark:text-stone-400'
                                        }`}
                                        title={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                        aria-label={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                    >
                                        {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button
                                        onClick={() => setWarehousePointRules(prev => prev.filter(r => r.id !== rule.id))}
                                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-500 dark:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
            <div className="bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                            <Star className="text-amber-600 dark:text-amber-400" size={22} />
                            Bonus Tiers
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                            Define point ranges and corresponding bonus amounts
                        </p>
                    </div>
                    <button
                        onClick={() => openAddModal('warehouse')}
                        className="px-4 py-2 bg-[#2C5E3B] text-white hover:bg-[#1E3F27] dark:bg-[#A9CBA2] dark:text-[#0B0F0D] dark:hover:bg-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
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
                            className="bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 rounded-xl p-4 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Tier Badge */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                    <Medal size={28} className="text-white" />
                                </div>

                                {/* Tier Info */}
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

                                {/* Bonus Info */}
                                <div className="text-right px-4 border-l border-[#E2DCCE] dark:border-emerald-950/20">
                                    <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Base Bonus</p>
                                    <p className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
                                        {CURRENCY_SYMBOL}{tier.bonusAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right px-4 border-l border-[#E2DCCE] dark:border-emerald-950/20">
                                    <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Per Point</p>
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-500">
                                        +{CURRENCY_SYMBOL}{(tier.bonusPerPoint || 0).toFixed(2)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(tier, 'warehouse')}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                                        title={`Edit ${tier.tierName}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTier(tier.id, 'warehouse')}
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

            {/* BONUS CALCULATOR PREVIEW */}
            <div className="bg-gradient-to-r from-[#2C5E3B]/5 to-amber-600/5 border border-[#2C5E3B]/20 dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-4 flex items-center gap-2 select-none">
                    <TrendingUp className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                    Bonus Calculator Preview
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#7A9E83] mb-4">
                    See how bonuses are calculated at different point levels
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[100, 300, 600, 1000, 1500, 2000, 3000, 5000].map(points => {
                        const bonus = calculateExampleBonus(points);
                        const tier = bonusTiers.find(t =>
                            points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
                        );
                        return (
                            <div key={points} className="bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE]/50 dark:border-[#18201B] rounded-xl p-3 text-center">
                                <p className="text-xs text-stone-500 dark:text-[#7A9E83]">{points.toLocaleString()} pts</p>
                                <p className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
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
