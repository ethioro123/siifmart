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
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 flex items-center justify-center">
                            <Trophy className="text-cyber-primary" size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Gamification & Bonuses</h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Configure bonuses for warehouse workers (individual) and POS staff (team-based).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm ${isSaving
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
                                <Save size={16} />
                                Save All
                            </>
                        )}
                    </button>
                </div>

                {/* TABS: Warehouse vs POS */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('warehouse')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'warehouse'
                            ? 'bg-cyber-primary text-black'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Trophy size={18} />
                        Warehouse
                    </button>
                    <button
                        onClick={() => setActiveTab('pos')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${activeTab === 'pos'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ShoppingBag size={18} />
                        POS Team
                    </button>
                </div>

                {activeTab === 'warehouse' && <WarehouseTab />}
                {activeTab === 'pos' && <POSTab />}

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

                {/* Modals */}
                <BonusTierModal />
                <POSRoleModal />
                <PointRuleModal />
                <WarehouseRuleModal />
            </div>
        </GamificationProvider>
    );
}
