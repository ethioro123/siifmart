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

export default function GamificationSettings() {
    const contextValue = useGamificationState();
    const {
        activeTab,
        setActiveTab,
        isSaving,
        handleSave
    } = contextValue;

    return (
        <GamificationProvider value={contextValue}>
            <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
                {/* HEADER BANNER with SAVE BUTTON */}
                <div className="p-5 bg-white/85 dark:bg-[#18201B]/65 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[24px] shadow-sm backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center shadow-inner">
                            <Trophy className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                        </div>
                        <div>
                            <h4 className="text-[#1E3F27] dark:text-[#EAE5D9] font-black text-lg select-none">Gamification & Bonuses</h4>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-1">
                                Configure performance-based incentives for warehouse workers (individual) and POS staff (team-based).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm shadow-sm select-none cursor-pointer transform hover:scale-[1.03] active:scale-95 ${isSaving
                            ? 'bg-stone-300 dark:bg-[#18201B] text-stone-500 dark:text-stone-600 cursor-not-allowed border border-[#E2DCCE] dark:border-emerald-950/20'
                            : activeTab === 'warehouse'
                                ? 'bg-[#2C5E3B] text-white hover:bg-[#1E3F27] dark:bg-[#A9CBA2] dark:text-[#0B0F0D] dark:hover:bg-white'
                                : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-[#0B0F0D] dark:hover:bg-amber-400'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save All Settings
                            </>
                        )}
                    </button>
                </div>

                {/* TABS: Warehouse vs POS */}
                <div className="flex gap-2 bg-white/80 dark:bg-[#18201B]/55 p-1.5 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-xl shadow-sm">
                    <button
                        onClick={() => setActiveTab('warehouse')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 cursor-pointer ${activeTab === 'warehouse'
                            ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#0B0F0D] shadow-sm'
                            : 'text-[#4D6E56] dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-[#EAE5D9] hover:bg-stone-200/50 dark:hover:bg-black/35'
                            }`}
                    >
                        <Trophy size={18} />
                        Warehouse Operations
                    </button>
                    <button
                        onClick={() => setActiveTab('pos')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 cursor-pointer ${activeTab === 'pos'
                            ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-[#0B0F0D] shadow-sm'
                            : 'text-[#4D6E56] dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-[#EAE5D9] hover:bg-stone-200/50 dark:hover:bg-black/35'
                            }`}
                    >
                        <ShoppingBag size={18} />
                        POS Team Rewards
                    </button>
                </div>

                {activeTab === 'warehouse' && <WarehouseTab />}
                {activeTab === 'pos' && <POSTab />}

                {/* BOTTOM SAVE BAR */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-7 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm cursor-pointer transform hover:scale-[1.03] active:scale-95 ${isSaving
                            ? 'bg-stone-300 dark:bg-[#18201B] text-stone-500 dark:text-stone-600 cursor-not-allowed border border-[#E2DCCE] dark:border-emerald-950/20'
                            : activeTab === 'warehouse'
                                ? 'bg-[#2C5E3B] text-white hover:bg-[#1E3F27] dark:bg-[#A9CBA2] dark:text-[#0B0F0D] dark:hover:bg-white'
                                : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-[#0B0F0D] dark:hover:bg-amber-400'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Commit Settings
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
