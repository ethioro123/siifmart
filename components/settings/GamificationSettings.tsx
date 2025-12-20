import React, { useState } from 'react';
import {
    Trophy, Gift, DollarSign, Star, Plus, Trash2, Edit2, Save,
    Target, TrendingUp, Calendar, ChevronRight, Sparkles, Medal,
    ShoppingBag, Users, Percent, Store, UserCheck, Zap, Package,
    Tag, ToggleLeft, ToggleRight, Hash, Layers, Clock
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { BonusTier, DEFAULT_BONUS_TIERS, POSRoleDistribution, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_POS_BONUS_TIERS, StorePointRule, DEFAULT_STORE_POINT_RULES, PointRuleType, Site, DEFAULT_WAREHOUSE_POINTS_ROLES, WarehousePointRule, DEFAULT_WAREHOUSE_POINT_RULES } from '../../types';
import Modal from '../Modal';
import { CURRENCY_SYMBOL, GROCERY_CATEGORIES } from '../../constants';

// Tier color options
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

export default function GamificationSettings() {
    const { showToast } = useStore();
    const { settings, updateSettings, sites, updateSite } = useData();

    // Tab state
    const [activeTab, setActiveTab] = useState<'warehouse' | 'pos'>('warehouse');
    const [isSaving, setIsSaving] = useState(false);

    // Local state for WAREHOUSE bonus settings
    const [bonusEnabled, setBonusEnabled] = useState(settings.bonusEnabled ?? true);
    const [bonusTiers, setBonusTiers] = useState<BonusTier[]>(settings.bonusTiers ?? DEFAULT_BONUS_TIERS);
    const [payoutFrequency, setPayoutFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(
        settings.bonusPayoutFrequency ?? 'monthly'
    );
    const [warehousePointsRoles, setWarehousePointsRoles] = useState<{ role: string; enabled: boolean; label: string }[]>(
        settings.warehousePointsEligibleRoles ?? DEFAULT_WAREHOUSE_POINTS_ROLES
    );
    const [warehousePointRules, setWarehousePointRules] = useState<WarehousePointRule[]>(
        settings.warehousePointRules ?? DEFAULT_WAREHOUSE_POINT_RULES
    );
    const [isWarehouseRuleModalOpen, setIsWarehouseRuleModalOpen] = useState(false);
    const [editingWarehouseRule, setEditingWarehouseRule] = useState<WarehousePointRule | null>(null);
    const [editedWarehouseRule, setEditedWarehouseRule] = useState<Partial<WarehousePointRule>>({});

    // Local state for POS bonus settings
    const [posBonusEnabled, setPosBonusEnabled] = useState(settings.posBonusEnabled ?? true);
    const [posBonusTiers, setPosBonusTiers] = useState<BonusTier[]>(settings.posBonusTiers ?? DEFAULT_POS_BONUS_TIERS);
    const [posPayoutFrequency, setPosPayoutFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(
        settings.posBonusPayoutFrequency ?? 'monthly'
    );
    const [posRoleDistribution, setPosRoleDistribution] = useState<POSRoleDistribution[]>(
        settings.posRoleDistribution ?? DEFAULT_POS_ROLE_DISTRIBUTION
    );
    const [posPointRules, setPosPointRules] = useState<StorePointRule[]>(
        settings.posPointRules ?? DEFAULT_STORE_POINT_RULES
    );

    // Point rule modal state
    const [isPointRuleModalOpen, setIsPointRuleModalOpen] = useState(false);
    const [editingPointRule, setEditingPointRule] = useState<StorePointRule | null>(null);
    const [editedPointRule, setEditedPointRule] = useState<Partial<StorePointRule>>({});

    // Modal state for editing tier
    const [editingTier, setEditingTier] = useState<BonusTier | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'warehouse' | 'pos'>('warehouse');

    // Edited tier state
    const [editedTier, setEditedTier] = useState<Partial<BonusTier>>({});

    // Role distribution modal
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<POSRoleDistribution | null>(null);
    const [editedRole, setEditedRole] = useState<Partial<POSRoleDistribution>>({});

    // Save all settings
    const handleSave = async () => {
        // Validate POS role distribution totals to 100%
        const totalPercentage = posRoleDistribution.reduce((sum, r) => sum + r.percentage, 0);
        if (totalPercentage !== 100) {
            showToast(`Role percentages must total 100% (currently ${totalPercentage}%)`, 'error');
            return;
        }

        try {
            setIsSaving(true);
            // Simulate a short delay for UX
            await new Promise(resolve => setTimeout(resolve, 800));

            await updateSettings({
                // Warehouse settings
                bonusEnabled,
                bonusTiers,
                bonusPayoutFrequency: payoutFrequency,
                warehousePointsEligibleRoles: warehousePointsRoles,
                warehousePointRules,
                // POS settings
                posBonusEnabled,
                posBonusTiers,
                posBonusPayoutFrequency: posPayoutFrequency,
                posRoleDistribution,
                posPointRules,
            }, 'Current User'); // Pass user context if available, or handle inside DataContext

            showToast('Gamification settings saved successfully!', 'success');
        } catch (error) {
            console.error('Save error:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Open edit modal for warehouse tier
    const openEditModal = (tier: BonusTier, mode: 'warehouse' | 'pos' = 'warehouse') => {
        setModalMode(mode);
        setEditingTier(tier);
        setEditedTier({ ...tier });
        setIsModalOpen(true);
    };

    // Open add modal
    const openAddModal = (mode: 'warehouse' | 'pos' = 'warehouse') => {
        setModalMode(mode);
        const tiers = mode === 'warehouse' ? bonusTiers : posBonusTiers;
        const maxMinPoints = Math.max(...tiers.map(t => t.minPoints), 0);
        setEditingTier(null);
        setEditedTier({
            id: `${mode}-tier-${Date.now()}`,
            tierName: 'New Tier',
            minPoints: maxMinPoints + 100,
            maxPoints: null,
            bonusAmount: 0,
            bonusPerPoint: 0,
            tierColor: 'gray',
        });
        setIsModalOpen(true);
    };

    // Open role edit modal
    const openRoleModal = (role?: POSRoleDistribution) => {
        if (role) {
            setEditingRole(role);
            setEditedRole({ ...role });
        } else {
            setEditingRole(null);
            setEditedRole({
                id: `role-${Date.now()}`,
                role: '',
                percentage: 0,
                color: 'gray',
            });
        }
        setIsRoleModalOpen(true);
    };

    // Save tier changes
    const handleSaveTier = () => {
        if (!editedTier.tierName || editedTier.minPoints === undefined) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const completeTier: BonusTier = {
            id: editedTier.id || `${modalMode}-tier-${Date.now()}`,
            tierName: editedTier.tierName,
            minPoints: editedTier.minPoints,
            maxPoints: editedTier.maxPoints ?? null,
            bonusAmount: editedTier.bonusAmount || 0,
            bonusPerPoint: editedTier.bonusPerPoint || 0,
            tierColor: editedTier.tierColor || 'gray',
        };

        const setTiers = modalMode === 'warehouse' ? setBonusTiers : setPosBonusTiers;

        if (editingTier) {
            // Update existing tier
            setTiers(prev => prev.map(t => t.id === editingTier.id ? completeTier : t));
        } else {
            // Add new tier
            setTiers(prev => [...prev, completeTier].sort((a, b) => a.minPoints - b.minPoints));
        }

        setIsModalOpen(false);
        showToast(editingTier ? 'Tier updated' : 'New tier added', 'success');
    };

    // Save role distribution
    const handleSaveRole = () => {
        if (!editedRole.role || editedRole.percentage === undefined) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const completeRole: POSRoleDistribution = {
            id: editedRole.id || `role-${Date.now()}`,
            role: editedRole.role,
            percentage: editedRole.percentage,
            color: editedRole.color || 'gray',
        };

        if (editingRole) {
            setPosRoleDistribution(prev => prev.map(r => r.id === editingRole.id ? completeRole : r));
        } else {
            setPosRoleDistribution(prev => [...prev, completeRole]);
        }

        setIsRoleModalOpen(false);
        showToast(editingRole ? 'Role updated' : 'Role added', 'success');
    };

    // Delete tier
    const handleDeleteTier = (tierId: string, mode: 'warehouse' | 'pos' = 'warehouse') => {
        const tiers = mode === 'warehouse' ? bonusTiers : posBonusTiers;
        const setTiers = mode === 'warehouse' ? setBonusTiers : setPosBonusTiers;

        if (tiers.length <= 1) {
            showToast('You must have at least one tier', 'error');
            return;
        }
        setTiers(prev => prev.filter(t => t.id !== tierId));
        showToast('Tier removed', 'success');
    };

    // Delete role
    const handleDeleteRole = (roleId: string) => {
        if (posRoleDistribution.length <= 1) {
            showToast('You must have at least one role', 'error');
            return;
        }
        setPosRoleDistribution(prev => prev.filter(r => r.id !== roleId));
        showToast('Role removed', 'success');
    };

    // Reset to defaults
    const handleResetDefaults = (mode: 'warehouse' | 'pos' = 'warehouse') => {
        if (window.confirm(`Are you sure you want to reset all ${mode} tiers and rules to defaults?`)) {
            if (mode === 'warehouse') {
                setBonusTiers(DEFAULT_BONUS_TIERS);
                setWarehousePointRules(DEFAULT_WAREHOUSE_POINT_RULES);
                setWarehousePointsRoles(DEFAULT_WAREHOUSE_POINTS_ROLES);
            } else {
                setPosBonusTiers(DEFAULT_POS_BONUS_TIERS);
                setPosPointRules(DEFAULT_STORE_POINT_RULES);
                setPosRoleDistribution(DEFAULT_POS_ROLE_DISTRIBUTION);
            }
            showToast(`${mode.toUpperCase()} settings reset to defaults`, 'success');
        }
    };

    // Point rule management
    const openPointRuleModal = (rule?: StorePointRule) => {
        if (rule) {
            setEditingPointRule(rule);
            setEditedPointRule({ ...rule });
        } else {
            setEditingPointRule(null);
            setEditedPointRule({
                id: `rule-${Date.now()}`,
                name: '',
                type: 'category',
                enabled: true,
                categoryId: 'all',
                pointsPerUnit: 1,
                color: 'blue',
                priority: 5,
            });
        }
        setIsPointRuleModalOpen(true);
    };

    const handleSavePointRule = () => {
        if (!editedPointRule.name) {
            showToast('Please provide a rule name', 'error');
            return;
        }

        const completeRule: StorePointRule = {
            id: editedPointRule.id || `rule-${Date.now()}`,
            name: editedPointRule.name,
            type: editedPointRule.type || 'category',
            enabled: editedPointRule.enabled ?? true,
            categoryId: editedPointRule.categoryId,
            productId: editedPointRule.productId,
            productSku: editedPointRule.productSku,
            pointsPerUnit: editedPointRule.pointsPerUnit || 0,
            pointsPerRevenue: editedPointRule.pointsPerRevenue,
            revenueThreshold: editedPointRule.revenueThreshold,
            minQuantity: editedPointRule.minQuantity,
            maxPointsPerTransaction: editedPointRule.maxPointsPerTransaction,
            multiplier: editedPointRule.multiplier,
            description: editedPointRule.description,
            color: editedPointRule.color || 'blue',
            priority: editedPointRule.priority || 5,
        };

        if (editingPointRule) {
            setPosPointRules(prev => prev.map(r => r.id === editingPointRule.id ? completeRule : r));
        } else {
            setPosPointRules(prev => [...prev, completeRule]);
        }

        setIsPointRuleModalOpen(false);
        showToast(editingPointRule ? 'Rule updated' : 'Rule added', 'success');
    };

    const handleSaveWarehouseRule = () => {
        if (editedWarehouseRule.points === undefined) {
            showToast('Please provide a points value', 'error');
            return;
        }

        const completeRule: WarehousePointRule = {
            id: editedWarehouseRule.id || `wpr-${Date.now()}`,
            action: editedWarehouseRule.action as any,
            points: editedWarehouseRule.points,
            description: editedWarehouseRule.description || '',
            enabled: editedWarehouseRule.enabled ?? true,
        };

        setWarehousePointRules(prev => prev.map(r => r.id === editedWarehouseRule.id ? completeRule : r));
        setIsWarehouseRuleModalOpen(false);
        showToast('Rule updated', 'success');
    };

    const handleDeletePointRule = (ruleId: string) => {
        setPosPointRules(prev => prev.filter(r => r.id !== ruleId));
        showToast('Rule deleted', 'success');
    };

    const togglePointRule = (ruleId: string) => {
        setPosPointRules(prev => prev.map(r =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
        ));
    };

    // Toggle store bonus eligibility
    const toggleStoreBonusEligibility = async (site: Site, field: 'bonusEnabled' | 'warehouseBonusEnabled') => {
        try {
            const currentValue = site[field] ?? true; // Default to true if not set
            await updateSite({ ...site, [field]: !currentValue }, 'Current User');
            showToast(`${site.name} bonus ${!currentValue ? 'enabled' : 'disabled'}`, 'success');
        } catch (error) {
            showToast('Failed to update store settings', 'error');
        }
    };

    // Get stores and warehouses
    const stores = sites.filter(s => s.type === 'Store' || s.type === 'Dark Store');
    const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');

    // Get rule type icon
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

    // Get all categories from constants
    const allCategories = ['all', ...Object.keys(GROCERY_CATEGORIES)];

    // Get color class
    const getColorClass = (colorValue: string) => {
        return TIER_COLORS.find(c => c.value === colorValue)?.class || 'from-gray-400 to-gray-500';
    };

    // Calculate example bonus
    const calculateExampleBonus = (points: number) => {
        const tier = bonusTiers.find(t =>
            points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
        );
        if (!tier) return 0;
        return tier.bonusAmount + (points * (tier.bonusPerPoint || 0));
    };

    // Calculate total percentage for display
    const totalRolePercentage = posRoleDistribution.reduce((sum, r) => sum + r.percentage, 0);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
                <Trophy className="text-purple-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-purple-400 font-bold text-sm">Gamification & Bonus Settings</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure bonuses for warehouse workers (individual) and POS staff (team-based).
                    </p>
                </div>
            </div>

            {/* TABS: Warehouse vs POS */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'warehouse'
                        ? 'bg-gradient-to-r from-cyber-primary to-green-400 text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Trophy size={18} />
                    Warehouse (Individual)
                </button>
                <button
                    onClick={() => setActiveTab('pos')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'pos'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <ShoppingBag size={18} />
                    POS (Team-Based)
                </button>
            </div>

            {/* ===================== WAREHOUSE TAB ===================== */}
            {activeTab === 'warehouse' && (
                <>
                    {/* MAIN CONTROLS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Enable/Disable */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                                        <Gift size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Bonus System</h4>
                                        <p className="text-[10px] text-gray-400">Enable worker bonuses</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={bonusEnabled}
                                        onChange={(e) => setBonusEnabled(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>

                        {/* Payout Frequency */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                    <Calendar size={20} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Payout Frequency</h4>
                                    <p className="text-[10px] text-gray-400">How often bonuses are calculated</p>
                                </div>
                            </div>
                            <select
                                value={payoutFrequency}
                                onChange={(e) => setPayoutFrequency(e.target.value as any)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
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
                                            className={`bg-black/30 border rounded-xl p-4 transition-all ${isEnabled
                                                ? 'border-cyber-primary/30 hover:border-cyber-primary/50'
                                                : 'border-white/5 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled
                                                        ? 'bg-gradient-to-br from-cyber-primary to-green-400'
                                                        : 'bg-gray-700'
                                                        }`}>
                                                        <Package size={20} className="text-white" />
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
                                                    className={`p-2 rounded-lg transition-all ${isEnabled
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
                                    className={`bg-black/30 border rounded-xl p-4 transition-all cursor-pointer ${roleConfig.enabled
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
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleConfig.enabled
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
                                        <div className={`p-2 rounded-lg transition-all ${roleConfig.enabled
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
                            <button
                                onClick={() => handleResetDefaults('warehouse')}
                                className="px-3 py-2 text-xs bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all"
                            >
                                Reset Defaults
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {warehousePointRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className={`bg-black/30 border rounded-xl p-4 transition-all group ${rule.enabled
                                        ? 'border-cyber-primary/30 hover:border-cyber-primary/50'
                                        : 'border-white/5 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.enabled
                                                ? 'bg-gradient-to-br from-cyber-primary to-green-400'
                                                : 'bg-gray-700'
                                                }`}>
                                                {rule.action.includes('STREAK') ? <TrendingUp size={18} className="text-white" /> : <Package size={18} className="text-white" />}
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
                                                className={`p-1.5 rounded-lg transition-all ${rule.enabled
                                                    ? 'bg-cyber-primary/20 text-cyber-primary'
                                                    : 'bg-gray-500/20 text-gray-500'
                                                    }`}
                                                title={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                                aria-label={rule.enabled ? `Disable ${rule.action}` : `Enable ${rule.action}`}
                                            >
                                                {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleResetDefaults('warehouse')}
                                    className="px-3 py-2 text-xs bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all"
                                >
                                    Reset Defaults
                                </button>
                                <button
                                    onClick={() => openAddModal('warehouse')}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <Plus size={16} />
                                    Add Tier
                                </button>
                            </div>
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
                                                onClick={() => openEditModal(tier)}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTier(tier.id)}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
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
            )}

            {/* ===================== POS TAB ===================== */}
            {activeTab === 'pos' && (
                <>
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
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                        <ShoppingBag size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">POS Team Bonus</h4>
                                        <p className="text-[10px] text-gray-400">Enable store bonuses</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={posBonusEnabled}
                                        onChange={(e) => setPosBonusEnabled(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>

                        {/* Payout Frequency */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                                    <Calendar size={20} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Payout Frequency</h4>
                                    <p className="text-[10px] text-gray-400">When bonuses are calculated</p>
                                </div>
                            </div>
                            <select
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
                                            className={`bg-black/30 border rounded-xl p-4 transition-all ${isEnabled
                                                ? 'border-green-500/30 hover:border-green-500/50'
                                                : 'border-white/5 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled
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
                                                    className={`p-2 rounded-lg transition-all ${isEnabled
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

                        {/* POS Tiers Grid */}
                        <div className="space-y-3">
                            {posBonusTiers.sort((a, b) => a.minPoints - b.minPoints).map((tier, index) => (
                                <div
                                    key={tier.id}
                                    className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Tier Badge */}
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getColorClass(tier.tierColor)} flex items-center justify-center shrink-0`}>
                                            <Store size={28} className="text-white" />
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
                                                {tier.minPoints.toLocaleString()} - {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} store points
                                            </p>
                                        </div>

                                        {/* Pool Info */}
                                        <div className="text-right px-4 border-l border-white/10">
                                            <p className="text-xs text-gray-400">Pool Amount</p>
                                            <p className="text-lg font-bold text-blue-400">
                                                {CURRENCY_SYMBOL}{tier.bonusAmount.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="text-right px-4 border-l border-white/10">
                                            <p className="text-xs text-gray-400">Per Point</p>
                                            <p className="text-lg font-bold text-purple-400">
                                                +{CURRENCY_SYMBOL}{(tier.bonusPerPoint || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(tier, 'pos')}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTier(tier.id, 'pos')}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ROLE DISTRIBUTION SECTION */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="text-purple-400" size={22} />
                                    Role-Based Distribution
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Define what percentage of the store bonus pool each role receives
                                </p>
                            </div>
                            <button
                                onClick={() => openRoleModal()}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                Add Role
                            </button>
                        </div>

                        {/* Role Distribution Visual */}
                        <div className="mb-6">
                            <div className="h-4 bg-black/30 rounded-full overflow-hidden flex">
                                {posRoleDistribution.sort((a, b) => b.percentage - a.percentage).map(role => (
                                    <div
                                        key={role.id}
                                        className={`h-full bg-gradient-to-r ${getColorClass(role.color)} transition-all`}
                                        style={{ width: `${role.percentage}%` }}
                                        title={`${role.role}: ${role.percentage}%`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Role Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {posRoleDistribution.sort((a, b) => b.percentage - a.percentage).map(role => (
                                <div
                                    key={role.id}
                                    className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(role.color)} flex items-center justify-center`}>
                                                <UserCheck size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{role.role}</h4>
                                                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                                    {role.percentage}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openRoleModal(role)}
                                                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRole(role.id)}
                                                className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Example Calculation */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <TrendingUp className="text-blue-400" size={16} />
                                Example: How a {CURRENCY_SYMBOL}10,000 bonus pool is distributed
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {posRoleDistribution.sort((a, b) => b.percentage - a.percentage).slice(0, 4).map(role => (
                                    <div key={role.id} className="bg-black/30 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-gray-400 truncate">{role.role}</p>
                                        <p className="text-lg font-bold text-green-400">
                                            {CURRENCY_SYMBOL}{((10000 * role.percentage) / 100).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{role.percentage}% share</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ==================== POINT RULES SECTION ==================== */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className="text-yellow-400" size={22} />
                                    Point Earning Rules
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Configure how products and categories earn points for your store
                                </p>
                            </div>
                            <button
                                onClick={() => openPointRuleModal()}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                Add Rule
                            </button>
                        </div>

                        {/* Active Rules Count */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 bg-black/30 rounded-xl p-4">
                                <p className="text-3xl font-black text-white">
                                    {posPointRules.filter(r => r.enabled).length}
                                </p>
                                <p className="text-xs text-gray-400">Active Rules</p>
                            </div>
                            <div className="flex-1 bg-black/30 rounded-xl p-4">
                                <p className="text-3xl font-black text-gray-500">
                                    {posPointRules.filter(r => !r.enabled).length}
                                </p>
                                <p className="text-xs text-gray-400">Disabled</p>
                            </div>
                            <div className="flex-1 bg-black/30 rounded-xl p-4">
                                <p className="text-3xl font-black text-yellow-400">
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
                                    className={`bg-black/30 border rounded-xl p-4 transition-all group ${rule.enabled
                                        ? 'border-white/10 hover:border-white/20'
                                        : 'border-white/5 opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Enable Toggle */}
                                        <button
                                            onClick={() => togglePointRule(rule.id)}
                                            className={`p-2 rounded-lg transition-all ${rule.enabled
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-500'
                                                }`}
                                        >
                                            {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>

                                        {/* Rule Type Icon */}
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(rule.color || 'blue')} flex items-center justify-center shrink-0`}>
                                            {getRuleTypeIcon(rule.type)}
                                        </div>

                                        {/* Rule Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-white">{rule.name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.type === 'category' ? 'bg-blue-500/20 text-blue-400' :
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

                                        {/* Points Display */}
                                        <div className="text-right px-4 border-l border-white/10">
                                            <p className="text-xs text-gray-400">Points/Unit</p>
                                            <p className="text-xl font-bold text-yellow-400">
                                                +{rule.pointsPerUnit}
                                            </p>
                                        </div>

                                        {rule.pointsPerRevenue && (
                                            <div className="text-right px-4 border-l border-white/10">
                                                <p className="text-xs text-gray-400">Per {CURRENCY_SYMBOL}{rule.revenueThreshold}</p>
                                                <p className="text-xl font-bold text-green-400">
                                                    +{rule.pointsPerRevenue}
                                                </p>
                                            </div>
                                        )}

                                        {/* Priority Badge */}
                                        <div className="text-center px-3">
                                            <p className="text-[10px] text-gray-500">Priority</p>
                                            <p className="text-sm font-bold text-gray-400">{rule.priority || 1}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openPointRuleModal(rule)}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePointRule(rule.id)}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {posPointRules.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <Zap size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No point rules configured</p>
                                    <p className="text-xs text-gray-500">Add rules to start earning store points</p>
                                </div>
                            )}
                        </div>

                        {/* Point Calculation Preview */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20">
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Target className="text-yellow-400" size={16} />
                                Example: Selling 5 Electronics + 10 Grocery items = {CURRENCY_SYMBOL}2,500
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(() => {
                                    // Example calculation
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
                                Total: <span className="text-yellow-400 font-bold">
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
                                </span> points for this transaction
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* SAVE BUTTON */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isSaving
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : activeTab === 'warehouse'
                            ? 'bg-gradient-to-r from-cyber-primary to-green-400 text-black hover:shadow-[0_0_30px_rgba(0,255,157,0.3)]'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-[0_0_30px_rgba(100,100,255,0.3)]'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save All Settings
                        </>
                    )}
                </button>
            </div>

            {/* EDIT TIER MODAL */}
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
                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${editedTier.tierColor === color.value
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

            {/* EDIT ROLE MODAL */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? 'Edit Role Distribution' : 'Add New Role'}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Role Name */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Role Name *
                        </label>
                        <input
                            type="text"
                            value={editedRole.role || ''}
                            onChange={(e) => setEditedRole({ ...editedRole, role: e.target.value })}
                            placeholder="e.g., Store Manager, Cashier"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* Percentage */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Bonus Percentage (%) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={editedRole.percentage || 0}
                            onChange={(e) => setEditedRole({ ...editedRole, percentage: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Share of the store bonus pool this role receives. All roles must total 100%.
                        </p>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                            Role Color
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {TIER_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => setEditedRole({ ...editedRole, color: color.value })}
                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${editedRole.color === color.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-gray scale-110'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                    title={color.label}
                                >
                                    {editedRole.color === color.value && (
                                        <Sparkles size={16} className="text-white" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Example Calculation */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-xs text-blue-400 font-bold mb-2">Example: {CURRENCY_SYMBOL}10,000 Store Bonus</p>
                        <p className="text-2xl font-bold text-green-400">
                            {CURRENCY_SYMBOL}{((10000 * (editedRole.percentage || 0)) / 100).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            This role would receive {editedRole.percentage || 0}% of the bonus pool
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setIsRoleModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveRole}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                        >
                            <Save size={18} />
                            {editingRole ? 'Update Role' : 'Add Role'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* POINT RULE MODAL */}
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
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, name: e.target.value })}
                                placeholder="e.g., Premium Electronics"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                                Rule Type
                            </label>
                            <select
                                value={editedPointRule.type || 'category'}
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
                                onChange={(e) => setEditedPointRule({ ...editedPointRule, categoryId: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                            >
                                <option value="all">All Categories</option>
                                {Object.keys(GROCERY_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
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
                                    value={editedPointRule.revenueThreshold || 100}
                                    onChange={(e) => setEditedPointRule({ ...editedPointRule, revenueThreshold: parseInt(e.target.value) || 100 })}
                                    className="w-full bg-black/40 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                                />
                            </div>
                            <p className="col-span-2 text-[10px] text-gray-400">
                                Example: 1 point per {CURRENCY_SYMBOL}{editedPointRule.revenueThreshold || 100} = {Math.floor(1000 / (editedPointRule.revenueThreshold || 100)) * (editedPointRule.pointsPerRevenue || 0)} points for a {CURRENCY_SYMBOL}1,000 sale
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
                                    value={editedPointRule.multiplier || 1}
                                    onChange={(e) => setEditedPointRule({ ...editedPointRule, multiplier: parseFloat(e.target.value) || 1 })}
                                    className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <p className="col-span-2 text-[10px] text-gray-400">
                                When selling {editedPointRule.minQuantity || 1}+ items, multiply all points by {editedPointRule.multiplier || 1}x
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
                            value={editedPointRule.maxPointsPerTransaction || ''}
                            onChange={(e) => setEditedPointRule({
                                ...editedPointRule,
                                maxPointsPerTransaction: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                            placeholder="No limit"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Leave empty for no cap. Useful for preventing abuse.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Description
                        </label>
                        <textarea
                            value={editedPointRule.description || ''}
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
                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} flex items-center justify-center transition-all ${editedPointRule.color === color.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-gray scale-110'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                    title={color.label}
                                >
                                    {editedPointRule.color === color.value && (
                                        <Sparkles size={16} className="text-white" />
                                    )}
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

            {/* EDIT WAREHOUSE RULE MODAL */}
            <Modal
                isOpen={isWarehouseRuleModalOpen}
                onClose={() => setIsWarehouseRuleModalOpen(false)}
                title="Edit Warehouse Point Rule"
            >
                <div className="space-y-4 pr-2">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Action
                        </label>
                        <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400">
                            {editedWarehouseRule.action}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Actions are system-defined and cannot be changed.</p>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Points *
                        </label>
                        <input
                            type="number"
                            value={editedWarehouseRule.points || 0}
                            onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, points: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyber-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                            Description
                        </label>
                        <textarea
                            value={editedWarehouseRule.description || ''}
                            onChange={(e) => setEditedWarehouseRule({ ...editedWarehouseRule, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyber-primary focus:outline-none h-24"
                            placeholder="Describe how these points are earned..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsWarehouseRuleModalOpen(false)}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveWarehouseRule}
                            className="px-6 py-2 bg-gradient-to-r from-cyber-primary to-green-400 text-black rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

