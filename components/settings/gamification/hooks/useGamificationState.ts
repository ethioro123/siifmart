import { useState } from 'react';
import { useStore } from '../../../../contexts/CentralStore';
import { useData } from '../../../../contexts/DataContext';
import {
    BonusTier, DEFAULT_BONUS_TIERS, POSRoleDistribution, DEFAULT_POS_ROLE_DISTRIBUTION,
    DEFAULT_POS_BONUS_TIERS, StorePointRule, DEFAULT_STORE_POINT_RULES, Site,
    DEFAULT_WAREHOUSE_POINTS_ROLES, WarehousePointRule, DEFAULT_WAREHOUSE_POINT_RULES
} from '../../../../types';
import { getColorClass, calculateExampleBonus } from '../utils';

export const useGamificationState = () => {
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
    const [ruleNameError, setRuleNameError] = useState(false);

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
        const totalPercentage = posRoleDistribution.reduce((sum, r) => sum + r.percentage, 0);
        if (totalPercentage !== 100) {
            showToast(`Role percentages must total 100% (currently ${totalPercentage}%)`, 'error');
            return;
        }

        try {
            setIsSaving(true);
            await new Promise(resolve => setTimeout(resolve, 800));

            await updateSettings({
                bonusEnabled,
                bonusTiers,
                bonusPayoutFrequency: payoutFrequency,
                warehousePointsEligibleRoles: warehousePointsRoles,
                warehousePointRules,

                posBonusEnabled,
                posBonusTiers,
                posBonusPayoutFrequency: posPayoutFrequency,
                posRoleDistribution,
                posPointRules,
            }, 'Current User');
            showToast('Settings saved successfully', 'success');
        } catch (error) {
            showToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = (tier: BonusTier, mode: 'warehouse' | 'pos' = 'warehouse') => {
        setModalMode(mode);
        setEditingTier(tier);
        setEditedTier({ ...tier });
        setIsModalOpen(true);
    };

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

    const openRoleModal = (role?: POSRoleDistribution) => {
        if (role) {
            setEditingRole(role);
            setEditedRole({ ...role });
        } else {
            setEditingRole(null);
            setEditedRole({
                id: `role-${Date.now()}`,
                role: 'New Role',
                percentage: 0,
                color: 'gray'
            });
        }
        setIsRoleModalOpen(true);
    };

    const handleSaveTier = () => {
        if (!editedTier.tierName || editedTier.minPoints === undefined) {
            showToast('Tier Name and Min Points are required', 'error');
            return;
        }

        const completeTier: BonusTier = {
            id: editedTier.id || `${modalMode}-tier-${Date.now()}`,
            tierName: editedTier.tierName,
            minPoints: editedTier.minPoints,
            maxPoints: editedTier.maxPoints !== undefined ? editedTier.maxPoints : null,
            bonusAmount: editedTier.bonusAmount || 0,
            bonusPerPoint: editedTier.bonusPerPoint || 0,
            tierColor: editedTier.tierColor || 'gray',
        };

        const setTiers = modalMode === 'warehouse' ? setBonusTiers : setPosBonusTiers;

        if (editingTier) {
            setTiers(prev => prev.map(t => t.id === editingTier.id ? completeTier : t));
            showToast('Tier updated', 'success');
        } else {
            setTiers(prev => [...prev, completeTier]);
            showToast('Tier added', 'success');
        }
        setIsModalOpen(false);
    };

    const handleSaveRole = () => {
        if (!editedRole.role || editedRole.percentage === undefined) {
            showToast('Role name and percentage are required', 'error');
            return;
        }

        const completeRole: POSRoleDistribution = {
            id: editedRole.id || `role-${Date.now()}`,
            role: editedRole.role,
            percentage: editedRole.percentage,
            color: editedRole.color || 'gray'
        };

        if (editingRole) {
            setPosRoleDistribution(prev => prev.map(r => r.id === editingRole.id ? completeRole : r));
            showToast('Role distribution updated', 'success');
        } else {
            setPosRoleDistribution(prev => [...prev, completeRole]);
            showToast('Role distribution added', 'success');
        }

        setIsRoleModalOpen(false);
    };

    const handleDeleteTier = (tierId: string, mode: 'warehouse' | 'pos' = 'warehouse') => {
        const setTiers = mode === 'warehouse' ? setBonusTiers : setPosBonusTiers;
        setTiers(prev => prev.filter(t => t.id !== tierId));
        showToast('Tier deleted', 'success');
    };

    const handleDeleteRole = (roleId: string) => {
        setPosRoleDistribution(prev => prev.filter(r => r.id !== roleId));
        showToast('Role deleted', 'success');
    };

    const handleResetDefaults = (mode: 'warehouse' | 'pos' = 'warehouse') => {
        if (mode === 'warehouse') {
            setBonusTiers(DEFAULT_BONUS_TIERS);
            setWarehousePointRules(DEFAULT_WAREHOUSE_POINT_RULES);
            showToast('Warehouse tiers & rules reset to defaults', 'success');
        } else {
            setPosBonusTiers(DEFAULT_POS_BONUS_TIERS);
            setPosRoleDistribution(DEFAULT_POS_ROLE_DISTRIBUTION);
            setPosPointRules(DEFAULT_STORE_POINT_RULES);
            showToast('POS tiers, roles & rules reset to defaults', 'success');
        }
    };

    const openPointRuleModal = (rule?: StorePointRule) => {
        if (rule) {
            setEditingPointRule(rule);
            setEditedPointRule({ ...rule });
        } else {
            setEditingPointRule(null);
            setEditedPointRule({
                name: '',
                type: 'category',
                pointsPerUnit: 0,
                description: '',
                color: 'blue',
                priority: 5,
                enabled: true
            });
        }
        setRuleNameError(false);
        setIsPointRuleModalOpen(true);
    };

    const handleSavePointRule = () => {
        if (!editedPointRule.name) {
            setRuleNameError(true);
            showToast('Rule name is required', 'error');
            return;
        }

        const completeRule: StorePointRule = {
            id: editedPointRule.id || `rule-${Date.now()}`,
            name: editedPointRule.name,
            type: editedPointRule.type || 'category',
            pointsPerUnit: editedPointRule.pointsPerUnit || 0,
            categoryId: editedPointRule.categoryId,
            productSku: editedPointRule.productSku,
            pointsPerRevenue: editedPointRule.pointsPerRevenue,
            revenueThreshold: editedPointRule.revenueThreshold,
            minQuantity: editedPointRule.minQuantity,
            multiplier: editedPointRule.multiplier,
            maxPointsPerTransaction: editedPointRule.maxPointsPerTransaction,
            enabled: editedPointRule.enabled ?? true,
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

        if (editingWarehouseRule) {
            setWarehousePointRules(prev => prev.map(r => r.id === editingWarehouseRule.id ? completeRule : r));
            showToast('Rule updated', 'success');
        } else {
            setWarehousePointRules(prev => [...prev, completeRule]);
            showToast('Rule added', 'success');
        }
        setIsWarehouseRuleModalOpen(false);
    };

    const handleDeletePointRule = (ruleId: string) => {
        setPosPointRules(prev => prev.filter(r => r.id !== ruleId));
        showToast('Rule deleted', 'success');
    };

    const togglePointRule = (ruleId: string) => {
        setPosPointRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    };

    const toggleStoreBonusEligibility = async (site: Site, field: 'bonusEnabled' | 'warehouseBonusEnabled') => {
        try {
            const currentValue = site[field] ?? true;
            await updateSite({ ...site, [field]: !currentValue }, 'Current User');
            showToast(`${site.name} bonus ${!currentValue ? 'enabled' : 'disabled'}`, 'success');
        } catch (error) {
            showToast('Failed to update store settings', 'error');
        }
    };

    const openWarehouseRuleModal = (rule?: WarehousePointRule) => {
        if (rule) {
            setEditingWarehouseRule(rule);
            setEditedWarehouseRule({ ...rule });
        } else {
            setEditingWarehouseRule(null);
            setEditedWarehouseRule({
                action: 'PICK',
                points: 0,
                description: '',
                enabled: true
            });
        }
        setIsWarehouseRuleModalOpen(true);
    };

    const handleDeleteWarehouseRule = (ruleId: string) => {
        setWarehousePointRules(prev => prev.filter(r => r.id !== ruleId));
        showToast('Rule deleted', 'success');
    };

    const toggleWarehouseRule = (ruleId: string) => {
        setWarehousePointRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    };

    const boundGetColorClass = (colorValue: string) => getColorClass(colorValue);
    const boundCalculateExampleBonus = (points: number) => calculateExampleBonus(points, bonusTiers);

    return {
        showToast,
        settings,
        updateSettings,
        sites,
        updateSite,

        activeTab,
        setActiveTab,
        isSaving,
        setIsSaving,

        bonusEnabled,
        setBonusEnabled,
        bonusTiers,
        setBonusTiers,
        payoutFrequency,
        setPayoutFrequency,
        warehousePointsRoles,
        setWarehousePointsRoles,
        warehousePointRules,
        setWarehousePointRules,

        isWarehouseRuleModalOpen,
        setIsWarehouseRuleModalOpen,
        editingWarehouseRule,
        setEditingWarehouseRule,
        editedWarehouseRule,
        setEditedWarehouseRule,

        posBonusEnabled,
        setPosBonusEnabled,
        posBonusTiers,
        setPosBonusTiers,
        posPayoutFrequency,
        setPosPayoutFrequency,
        posRoleDistribution,
        setPosRoleDistribution,
        posPointRules,
        setPosPointRules,

        isPointRuleModalOpen,
        setIsPointRuleModalOpen,
        editingPointRule,
        setEditingPointRule,
        editedPointRule,
        setEditedPointRule,
        ruleNameError,
        setRuleNameError,

        editingTier,
        setEditingTier,
        isModalOpen,
        setIsModalOpen,
        modalMode,
        setModalMode,
        editedTier,
        setEditedTier,

        isRoleModalOpen,
        setIsRoleModalOpen,
        editingRole,
        setEditingRole,
        editedRole,
        setEditedRole,

        handleSave,
        openEditModal,
        openAddModal,
        openRoleModal,
        handleSaveTier,
        handleSaveRole,
        handleDeleteTier,
        handleDeleteRole,
        handleResetDefaults,
        openPointRuleModal,
        handleSavePointRule,
        handleSaveWarehouseRule,
        handleDeletePointRule,
        togglePointRule,
        toggleStoreBonusEligibility,
        openWarehouseRuleModal,
        handleDeleteWarehouseRule,
        toggleWarehouseRule,

        calculateExampleBonus: boundCalculateExampleBonus,
        getColorClass: boundGetColorClass
    };
};
