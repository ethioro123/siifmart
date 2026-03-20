import React, { useState } from 'react';
import { Layout, ChevronDown } from 'lucide-react';
import { WMSJob } from '../../types';
import { OpTab } from './FulfillmentContext';
import { PointsEarnedPopup } from '../WorkerPointsDisplay';

interface TabSelectorProps {
    activeTab: OpTab;
    setActiveTab: (tab: OpTab) => void;
    visibleTabs: OpTab[];
    t: (key: string) => string;
    filteredJobs: WMSJob[];
}

interface DesktopTabSelectorProps extends TabSelectorProps {
    showPointsPopup: boolean;
    setShowPointsPopup: (v: boolean) => void;
    earnedPoints: { points: number; message: string; bonuses: { label: string; points: number }[] };
}

export const MobileTabSelector: React.FC<TabSelectorProps> = ({
    activeTab,
    setActiveTab,
    visibleTabs,
    t,
    filteredJobs
}) => {
    const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);

    return (
        <div className="md:hidden relative z-40 mb-2">
            <button
                onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg active:scale-[0.98] transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Layout size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Current Section</p>
                        <p className="text-lg font-black text-white uppercase tracking-tighter">
                            {activeTab === 'ASSIGN' ? 'ASSIGN TASK' : t(`warehouse.tabs.${activeTab.toLowerCase()}`)}
                        </p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-300 ${isMobileTabMenuOpen ? 'rotate-180 bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'text-gray-400'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {/* Mobile Dropdown Grid */}
            {isMobileTabMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setIsMobileTabMenuOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#121212] border border-white/10 rounded-3xl p-4 grid grid-cols-2 gap-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10">
                        {visibleTabs.map((tab) => {
                            const isActive = activeTab === tab;
                            // Discrepancy Logic
                            const hasTransferDiscrepancies = tab === 'TRANSFER' && filteredJobs
                                .filter(j => j.type === 'TRANSFER')
                                .some(j => (j.lineItems || []).some((item: any) =>
                                    item.receivedQty !== undefined &&
                                    item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
                                    !['Resolved', 'Completed'].includes(item.status)
                                ));

                            return (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setIsMobileTabMenuOpen(false);
                                    }}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border relative ${isActive
                                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">{tab === 'ASSIGN' ? 'ASSIGN TASK' : t(`warehouse.tabs.${tab.toLowerCase()}`)}</span>
                                    {hasTransferDiscrepancies && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export const DesktopTabSelector: React.FC<DesktopTabSelectorProps> = ({
    activeTab,
    setActiveTab,
    visibleTabs,
    t,
    filteredJobs,
    showPointsPopup,
    setShowPointsPopup,
    earnedPoints
}) => {
    return (
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-0 -mx-0 px-0 bg-transparent rounded-xl shrink-0 no-scrollbar touch-pan-x">
            <div className="flex gap-2 min-w-max">
                {visibleTabs.map((tab) => {
                    // Check for discrepancies in TRANSFER tab
                    const hasTransferDiscrepancies = tab === 'TRANSFER' && filteredJobs
                        .filter(j => j.type === 'TRANSFER')
                        .some(j => (j.lineItems || []).some((item: any) =>
                            item.receivedQty !== undefined &&
                            item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
                            !['Resolved', 'Completed'].includes(item.status)
                        ));
                    const discrepancyCount = tab === 'TRANSFER'
                        ? filteredJobs.filter(j => j.type === 'TRANSFER' &&
                            (j.lineItems || []).some((item: any) =>
                                item.receivedQty !== undefined &&
                                item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
                                !['Resolved', 'Completed'].includes(item.status)
                            )).length
                        : 0;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as OpTab)}
                            className={`px-4 py-3 md:py-2 rounded-lg text-sm md:text-xs font-bold transition-all whitespace-nowrap min-h-[44px] md:min-h-0 select-none relative ${activeTab === tab
                                ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                : hasTransferDiscrepancies
                                    ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
                                    : 'text-gray-400 hover:bg-white/5'
                                } `}
                        >
                            {tab === 'ASSIGN' ? 'ASSIGN TASK' : t(`warehouse.tabs.${tab.toLowerCase()}`)}
                            {hasTransferDiscrepancies && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-white text-[10px] text-red-600 rounded-full font-black min-w-[18px] text-center border border-red-500">
                                    {discrepancyCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Worker Points Widget */}
            <div className="hidden md:flex items-center gap-3 pl-2">
            </div>

            {/* Points Earned Popup */}
            {showPointsPopup && (
                <PointsEarnedPopup
                    points={earnedPoints.points}
                    message={earnedPoints.message}
                    bonuses={earnedPoints.bonuses}
                    onClose={() => setShowPointsPopup(false)}
                />
            )}

        </div>
    );
};
