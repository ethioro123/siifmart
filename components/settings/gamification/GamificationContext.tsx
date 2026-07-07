import React, { createContext, useContext } from 'react';
import type { BonusTier, POSRoleDistribution, StorePointRule, WarehousePointRule, Site } from '../../../types';

export interface GamificationContextType {
    // Context hook values
    showToast: (msg: string, type?: 'success' | 'error') => void;
    settings: any;
    updateSettings: (s: any, user: string) => Promise<void>;
    sites: Site[];
    updateSite: (s: Site, user: string) => Promise<void>;

    // State & Setters
    activeTab: 'warehouse' | 'pos';
    setActiveTab: (tab: 'warehouse' | 'pos') => void;
    isSaving: boolean;
    setIsSaving: (s: boolean) => void;

    // Warehouse settings
    bonusEnabled: boolean;
    setBonusEnabled: (b: boolean) => void;
    bonusTiers: BonusTier[];
    setBonusTiers: React.Dispatch<React.SetStateAction<BonusTier[]>>;
    payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
    setPayoutFrequency: (f: 'weekly' | 'biweekly' | 'monthly') => void;
    warehousePointsRoles: { role: string; enabled: boolean; label: string }[];
    setWarehousePointsRoles: React.Dispatch<React.SetStateAction<{ role: string; enabled: boolean; label: string }[]>>;
    warehousePointRules: WarehousePointRule[];
    setWarehousePointRules: React.Dispatch<React.SetStateAction<WarehousePointRule[]>>;

    isWarehouseRuleModalOpen: boolean;
    setIsWarehouseRuleModalOpen: (o: boolean) => void;
    editingWarehouseRule: WarehousePointRule | null;
    setEditingWarehouseRule: (r: WarehousePointRule | null) => void;
    editedWarehouseRule: Partial<WarehousePointRule>;
    setEditedWarehouseRule: React.Dispatch<React.SetStateAction<Partial<WarehousePointRule>>>;

    // POS settings
    posBonusEnabled: boolean;
    setPosBonusEnabled: (b: boolean) => void;
    posBonusTiers: BonusTier[];
    setPosBonusTiers: React.Dispatch<React.SetStateAction<BonusTier[]>>;
    posPayoutFrequency: 'weekly' | 'biweekly' | 'monthly';
    setPosPayoutFrequency: (f: 'weekly' | 'biweekly' | 'monthly') => void;
    posRoleDistribution: POSRoleDistribution[];
    setPosRoleDistribution: React.Dispatch<React.SetStateAction<POSRoleDistribution[]>>;
    posPointRules: StorePointRule[];
    setPosPointRules: React.Dispatch<React.SetStateAction<StorePointRule[]>>;

    // Point rule modal
    isPointRuleModalOpen: boolean;
    setIsPointRuleModalOpen: (o: boolean) => void;
    editingPointRule: StorePointRule | null;
    setEditingPointRule: (r: StorePointRule | null) => void;
    editedPointRule: Partial<StorePointRule>;
    setEditedPointRule: React.Dispatch<React.SetStateAction<Partial<StorePointRule>>>;
    ruleNameError: boolean;
    setRuleNameError: (e: boolean) => void;

    // Tier modal
    editingTier: BonusTier | null;
    setEditingTier: (t: BonusTier | null) => void;
    isModalOpen: boolean;
    setIsModalOpen: (o: boolean) => void;
    modalMode: 'warehouse' | 'pos';
    setModalMode: (m: 'warehouse' | 'pos') => void;
    editedTier: Partial<BonusTier>;
    setEditedTier: React.Dispatch<React.SetStateAction<Partial<BonusTier>>>;

    // Role modal
    isRoleModalOpen: boolean;
    setIsRoleModalOpen: (o: boolean) => void;
    editingRole: POSRoleDistribution | null;
    setEditingRole: (r: POSRoleDistribution | null) => void;
    editedRole: Partial<POSRoleDistribution>;
    setEditedRole: React.Dispatch<React.SetStateAction<Partial<POSRoleDistribution>>>;

    // Handlers
    handleSave: () => Promise<void>;
    openEditModal: (tier: BonusTier, mode: 'warehouse' | 'pos') => void;
    openAddModal: (mode: 'warehouse' | 'pos') => void;
    openRoleModal: (role?: POSRoleDistribution) => void;
    handleSaveTier: () => void;
    handleSaveRole: () => void;
    handleDeleteTier: (id: string, mode: 'warehouse' | 'pos') => void;
    handleDeleteRole: (id: string) => void;
    handleResetDefaults: (mode: 'warehouse' | 'pos') => void;
    openPointRuleModal: (rule?: StorePointRule) => void;
    handleSavePointRule: () => void;
    handleSaveWarehouseRule: () => void;
    handleDeletePointRule: (id: string) => void;
    togglePointRule: (id: string) => void;
    toggleStoreBonusEligibility: (site: Site, field: 'bonusEnabled' | 'warehouseBonusEnabled') => Promise<void>;

    // Utils
    calculateExampleBonus: (points: number) => number;
    getColorClass: (colorValue: string) => string;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamification = () => {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
    return ctx;
};

export const GamificationProvider: React.FC<{
    value: GamificationContextType;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <GamificationContext.Provider value={value}>
        {children}
    </GamificationContext.Provider>
);
