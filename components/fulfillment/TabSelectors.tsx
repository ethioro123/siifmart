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
        <div className="md:hidden relative z-[60] mb-2">
            <button
                onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
                className="w-full glass-panel p-3.5 flex items-center justify-between active:scale-[0.98] transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2C5E3B] to-[#1E3F27] dark:from-[#A9CBA2]/20 dark:to-[#A9CBA2]/5 flex items-center justify-center text-white dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/10 shrink-0">
                        <Layout size={20} />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-[0.2em]">Current Section</p>
                        <p className="text-lg font-black text-stone-900 dark:text-[#EAE5D9] uppercase tracking-tighter truncate">
                            {t(`warehouse.tabs.${activeTab.toLowerCase()}`)}
                        </p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-stone-100/60 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/10 flex items-center justify-center transition-transform duration-300 shrink-0 ${isMobileTabMenuOpen ? 'rotate-180 bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/30' : 'text-stone-400'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {/* Mobile Dropdown Grid */}
            {isMobileTabMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-[65]" onClick={() => setIsMobileTabMenuOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-3 glass-panel p-4 grid grid-cols-2 gap-3 z-[70] animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {visibleTabs.map((tab) => {
                            const isActive = activeTab === tab;
                            // Discrepancy Logic
                            const hasTransferDiscrepancies = tab === 'TRANSFER' && filteredJobs
                                .filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status))
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
                                        ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-[#2C5E3B] dark:border-[#EAE5D9] shadow-sm'
                                        : 'bg-stone-50/50 dark:bg-[#18201B]/50 text-stone-700 dark:text-stone-400 border-[#E2DCCE]/50 dark:border-[#A9CBA2]/[0.04] hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 hover:text-[#1E3F27] dark:hover:text-white'
                                        }`}
                                 >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">{t(`warehouse.tabs.${tab.toLowerCase()}`)}</span>
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
                        .filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status))
                        .some(j => (j.lineItems || []).some((item: any) =>
                            item.receivedQty !== undefined &&
                            item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
                            !['Resolved', 'Completed'].includes(item.status)
                        ));
                    const discrepancyCount = tab === 'TRANSFER'
                        ? filteredJobs.filter(j => j.type === 'TRANSFER' &&
                            ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status) &&
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
                            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap min-h-[40px] md:min-h-0 select-none relative ${activeTab === tab
                                ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm'
                                : hasTransferDiscrepancies
                                    ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
                                    : 'text-stone-500 dark:text-stone-400 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#EAE5D9]/10 hover:text-[#2C5E3B] dark:hover:text-[#EAE5D9]'
                                } `}
                        >
                            {t(`warehouse.tabs.${tab.toLowerCase()}`)}
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
