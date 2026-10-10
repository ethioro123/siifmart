import React from 'react';
import { Trophy, ShoppingBag, Save } from 'lucide-react';
import { GamificationProvider } from './gamification/GamificationContext';
import { WarehouseTab } from './gamification/WarehouseTab';
import { POSTab } from './gamification/POSTab';
import { BonusTierModal } from './gamification/BonusTierModal';
import { POSRoleModal } from './gamification/POSRoleModal';
import { PointRuleModal } from './gamification/PointRuleModal';
import { WarehouseRuleModal } from './gamification/WarehouseRuleModal';
import { useGamificationState } from './gamification/hooks/useGamificationState';
import { useData } from '../../contexts/DataContext';
import { Country, getCountryProfile } from '../../utils/localization';

export default function GamificationSettings() {
    const contextValue = useGamificationState();
    const {
        activeTab,
        setActiveTab,
        isSaving,
        handleSave
    } = contextValue;

    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    return (
        <GamificationProvider value={contextValue}>
            <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
                {/* HEADER BANNER with SAVE BUTTON */}
                <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Gamification & Performance Bonuses</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                                    {countryProfile.name} ({activeCountry})
                                </span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Configure performance-based incentives for warehouse workers (individual) and POS staff (team-based).
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-9 px-4 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>

                {/* TABS: Warehouse vs POS */}
                <div className="flex gap-1.5 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('warehouse')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'warehouse'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <Trophy size={15} className={activeTab === 'warehouse' ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} />
                        <span>Warehouse Operations</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pos')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'pos'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <ShoppingBag size={15} className={activeTab === 'pos' ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} />
                        <span>POS Team Rewards</span>
                    </button>
                </div>

                {activeTab === 'warehouse' && <WarehouseTab />}
                {activeTab === 'pos' && <POSTab />}

                {/* BOTTOM SAVE BAR */}
                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-9 px-4 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Commit Settings</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Modals */}
                <BonusTierModal />
                <POSRoleModal />
                <PointRuleModal />
                <WarehouseRuleModal />
            </div>
        </GamificationProvider>
    );
}
