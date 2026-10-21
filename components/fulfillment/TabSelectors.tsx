import React, { useState } from 'react';
import { Layout, ChevronDown } from 'lucide-react';
import { WMSJob } from '../../types';
import { OpTab } from './FulfillmentContext';
import WorkerPointsDisplay, { PointsEarnedPopup } from '../WorkerPointsDisplay';
import { useStore } from '../../contexts/CentralStore';
import { useGamification } from '../../contexts/GamificationContext';
import { getDriverMissions } from '../../utils/shipmentWorkflow';
import { getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';

interface TabSelectorProps {
    activeTab: OpTab;
    setActiveTab: (tab: OpTab) => void;
    visibleTabs: OpTab[];
    t: (key: string) => string;
    filteredJobs: WMSJob[];
    siteId?: string;
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
    filteredJobs,
    siteId
}) => {
    const { user } = useStore();
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
                return getDriverMissions(filteredJobs, user, user?.employeeId, siteId).length;
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
    const defaultTab = getDefaultFulfillmentTab(user?.role);

    const quickTabs = React.useMemo(() => {
        const primary: OpTab[] = [];
        const leadTab = visibleTabs.includes(activeTab)
            ? activeTab
            : (visibleTabs.includes(defaultTab) ? defaultTab : visibleTabs[0]);
        if (leadTab) primary.push(leadTab);

        if (visibleTabs.includes(defaultTab) && !primary.includes(defaultTab)) {
            primary.push(defaultTab);
        }

        const preferredFillers: OpTab[] = ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'DRIVER'];
        for (const tab of preferredFillers) {
            if (primary.length >= 4) break;
            if (visibleTabs.includes(tab) && !primary.includes(tab)) {
                primary.push(tab);
            }
        }

        for (const tab of visibleTabs) {
            if (primary.length >= 4) break;
            if (!primary.includes(tab)) {
                primary.push(tab);
            }
        }

        return primary;
    }, [visibleTabs, activeTab, defaultTab]);

    const otherTabs = visibleTabs.filter(t => !quickTabs.includes(t));
    const isQuickActive = quickTabs.includes(activeTab);
    const otherActiveCount = otherTabs.reduce((acc, tab) => acc + getTabActiveCount(tab), 0);

    return (
        <div className="md:hidden relative z-[60] mb-1 space-y-1">
            {/* 1-Tap Core Operational Segments */}
            <div role="group" aria-label="Primary fulfillment tabs" className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                {quickTabs.map(tab => {
                    const isActive = activeTab === tab;
                    const count = getTabActiveCount(tab);
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab);
                                setIsMobileTabMenuOpen(false);
                            }}
                            aria-pressed={isActive}
                            className={`flex-1 min-w-[70px] min-h-[44px] border border-transparent px-2 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                isActive
                                    ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] shadow-xs border-[var(--theme-accent)] font-bold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            <span>{t(`warehouse.tabs.${tab.toLowerCase()}`)}</span>
                            {count > 0 && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                    isActive
                                        ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-border)]'
                                        : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* More / Secondary Tabs Pill */}
                {otherTabs.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
                        aria-expanded={isMobileTabMenuOpen}
                        aria-controls="fulfillment-mobile-tab-menu"
                        className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-tight flex items-center justify-center gap-1 transition-colors touch-manipulation active:scale-[0.97] shrink-0 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                            !isQuickActive
                                ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] border-[var(--theme-accent)] shadow-xs font-bold'
                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                        }`}
                        title="More Operations"
                    >
                        <span>{!isQuickActive ? t(`warehouse.tabs.${activeTab.toLowerCase()}`) : 'More'}</span>
                        {otherActiveCount > 0 && isQuickActive && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-bold">
                                {otherActiveCount}
                            </span>
                        )}
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isMobileTabMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* Mobile Dropdown Grid */}
            {isMobileTabMenuOpen && (
                <>
                    <div aria-hidden="true" className="fixed inset-0 bg-black/60 z-[65]" onClick={() => setIsMobileTabMenuOpen(false)} />
                    <div id="fulfillment-mobile-tab-menu" role="group" aria-label="More fulfillment tabs" className="absolute top-full left-0 right-0 mt-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 z-[70] animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto custom-scrollbar shadow-2xl">
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
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setIsMobileTabMenuOpen(false);
                                    }}
                                    aria-pressed={isActive}
                                    aria-label={hasTransferDiscrepancies ? `${t(`warehouse.tabs.${tab.toLowerCase()}`)}, transfer discrepancies` : t(`warehouse.tabs.${tab.toLowerCase()}`)}
                                    className={`p-2.5 min-h-[44px] rounded-xl flex items-center justify-between gap-1.5 transition-colors active:scale-95 border relative touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isActive
                                        ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] border-[var(--theme-accent)] shadow-xs font-semibold'
                                        : hasTransferDiscrepancies
                                            ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    <span className="text-xs font-medium leading-tight truncate px-1">{t(`warehouse.tabs.${tab.toLowerCase()}`)}</span>
                                    {count > 0 && (
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]">
                                            {count}
                                        </span>
                                    )}
                                    {hasTransferDiscrepancies && (
                                        <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning)] shrink-0" />
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
        <div role="group" aria-label="Fulfillment tabs" className="hidden md:flex items-center gap-2 overflow-x-auto pb-0 -mx-0 px-0 bg-[var(--theme-bg-subtle)] p-1 rounded-2xl border border-[var(--theme-border)] shrink-0 no-scrollbar touch-pan-x">
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
                            type="button"
                            onClick={() => setActiveTab(tab as OpTab)}
                            aria-pressed={isActive}
                            aria-label={hasTransferDiscrepancies ? `${t(`warehouse.tabs.${tab.toLowerCase()}`)}, ${discrepancyCount} transfer discrepancies` : t(`warehouse.tabs.${tab.toLowerCase()}`)}
                            className={`px-3.5 py-2 rounded-xl text-xs transition-colors whitespace-nowrap min-h-[44px] border border-transparent select-none relative touch-manipulation active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isActive
                                ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-accent)]'
                                : hasTransferDiscrepancies
                                    ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] border border-transparent hover:bg-[var(--theme-bg-card)] hover:text-[var(--theme-text-primary)] font-medium'
                                } `}
                        >
                            {t(`warehouse.tabs.${tab.toLowerCase()}`)}
                            {hasTransferDiscrepancies && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[var(--theme-status-warning-bg)] text-[11px] text-[var(--theme-status-warning-text)] rounded-full font-bold min-w-[18px] text-center border border-[var(--theme-status-warning-border)] font-mono tabular-nums">
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
