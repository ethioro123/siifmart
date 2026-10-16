import React, { useState } from 'react';
import { Layout, ChevronDown } from 'lucide-react';
import { WMSJob } from '../../types';
import { OpTab } from './FulfillmentContext';
import WorkerPointsDisplay, { PointsEarnedPopup } from '../WorkerPointsDisplay';
import { useStore } from '../../contexts/CentralStore';
import { useGamification } from '../../contexts/GamificationContext';

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

    const getTabActiveCount = (tab: OpTab) => {
        switch (tab) {
            case 'PICK':
                return filteredJobs.filter(j => j.type === 'PICK' && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'PACK':
                return filteredJobs.filter(j => j.type === 'PACK' && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'PUTAWAY':
                return filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'TRANSFER':
                return filteredJobs.filter(j => j.type === 'TRANSFER' && j.status !== 'Cancelled' && j.transferStatus !== 'Received').length;
            case 'DRIVER':
                return filteredJobs.filter(j => (j.type === 'DISPATCH' || j.type === 'DRIVER') && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'RECEIVE':
                return filteredJobs.filter(j => j.type === 'RECEIVE' && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'REPLENISH':
                return filteredJobs.filter(j => j.type === 'REPLENISH' && j.status !== 'Completed').length;
            case 'COUNT':
                return filteredJobs.filter(j => j.type === 'COUNT' && j.status !== 'Completed').length;
            case 'WASTE':
                return filteredJobs.filter(j => j.type === 'WASTE' && j.status !== 'Completed').length;
            case 'RETURNS':
                return filteredJobs.filter(j => j.type === 'RETURNS' && j.status !== 'Completed').length;
            case 'ASSIGN':
                return filteredJobs.filter(j => !j.assignedTo && j.status !== 'Completed' && j.status !== 'Cancelled').length;
            case 'DOCKS':
                return filteredJobs.filter(j => (j.type === 'RECEIVE' || j.type === 'DISPATCH') && j.status !== 'Completed').length;
            default:
                return 0;
        }
    };
    const currentActiveCount = getTabActiveCount(activeTab);

    return (
        <div className="md:hidden relative z-[60] mb-1.5">
            <button
                onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 min-h-[38px] flex items-center justify-between shadow-xs touch-manipulation active:scale-[0.99] transition-all"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 flex items-center justify-center text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                        <Layout size={13} />
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate">
                        {t(`warehouse.tabs.${activeTab.toLowerCase()}`)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-mono text-[10px] font-bold border border-[var(--theme-accent)]/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)] animate-pulse" />
                        {currentActiveCount}
                    </span>
                </div>
                <div className={`w-6 h-6 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center transition-transform duration-200 shrink-0 ml-2 ${isMobileTabMenuOpen ? 'rotate-180 text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`}>
                    <ChevronDown size={13} />
                </div>
            </button>

            {/* Mobile Dropdown Grid */}
            {isMobileTabMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[65]" onClick={() => setIsMobileTabMenuOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 z-[70] animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto custom-scrollbar shadow-2xl">
                        {visibleTabs.map((tab) => {
                            const isActive = activeTab === tab;
                            const count = getTabActiveCount(tab);
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
                                    className={`p-2.5 min-h-[44px] rounded-xl flex items-center justify-between gap-1.5 transition-colors active:scale-95 border relative touch-manipulation ${isActive
                                        ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)] shadow-xs font-semibold'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    <span className="text-xs font-medium leading-tight truncate px-1">{t(`warehouse.tabs.${tab.toLowerCase()}`)}</span>
                                    {count > 0 && (
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20'}`}>
                                            {count}
                                        </span>
                                    )}
                                    {hasTransferDiscrepancies && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
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
    const { user } = useStore();
    const { getWorkerPoints } = useGamification();
    const userPoints = user ? getWorkerPoints(user.id) : undefined;

    return (
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-0 -mx-0 px-0 bg-[var(--theme-bg-subtle)] p-1 rounded-2xl border border-[var(--theme-border)] shrink-0 no-scrollbar touch-pan-x">
            <div className="flex gap-1 min-w-max">
                {visibleTabs.map((tab) => {
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

                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as OpTab)}
                            className={`px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap min-h-[40px] select-none relative touch-manipulation active:scale-[0.98] cursor-pointer ${isActive
                                ? 'bg-[var(--theme-accent)] text-white font-semibold shadow-xs'
                                : hasTransferDiscrepancies
                                    ? 'bg-red-600 text-white animate-pulse border border-red-500 font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card)] hover:text-[var(--theme-text-primary)] font-medium'
                                } `}
                        >
                            {t(`warehouse.tabs.${tab.toLowerCase()}`)}
                            {hasTransferDiscrepancies && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-white text-[11px] text-red-600 rounded-full font-bold min-w-[18px] text-center border border-red-500 font-mono tabular-nums">
                                    {discrepancyCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Worker Points Widget */}
            {userPoints && (
                <div className="hidden md:flex items-center gap-3 pl-2 shrink-0">
                    <WorkerPointsDisplay points={userPoints} compact={true} />
                </div>
            )}

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
