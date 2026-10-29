import React from 'react';
import { Truck, RefreshCw } from 'lucide-react';
import { User, Site } from '../../../types';

interface DriverHeaderProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    user: User | null;
    employees: any[];
    activeSite: Site | null;
    viewMode: 'Active' | 'History';
    setViewMode: (mode: 'Active' | 'History') => void;
    isSubmitting: boolean;
    refreshData: () => Promise<void>;
    activeCount?: number;
    onDispatch?: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    t,
    user,
    activeSite,
    viewMode,
    setViewMode,
    isSubmitting,
    refreshData,
    activeCount,
    onDispatch
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between sticky top-0 z-40 gap-2 sm:gap-3 mb-2">
            <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                        <Truck size={15} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <h2 className="text-xs sm:text-base font-bold text-[var(--theme-text-primary)] tracking-tight leading-tight truncate">
                                {t('warehouse.driverHub.driverTitle')} {t('warehouse.driverHub.hubTitle')}
                            </h2>
                            {activeCount !== undefined ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)]" />
                                    {t('warehouse.driverHub.activeCountSuffix', { count: activeCount })}
                                </span>
                            ) : (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--theme-status-success-bg)] shrink-0" />
                            )}
                        </div>
                        <p className="hidden sm:block text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5 truncate">
                            {user?.name || t('warehouse.driverFallback')} • {activeSite?.name || t('warehouse.centralOpsArea')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refreshData()}
                    disabled={isSubmitting}
                    aria-label="Refresh Data"
                    title="Refresh Data"
                    className="sm:hidden min-h-[34px] min-w-[34px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs flex items-center justify-center shrink-0 touch-manipulation"
                >
                    <RefreshCw size={14} className={isSubmitting ? 'animate-spin text-[var(--theme-primary)]' : ''} />
                </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {onDispatch && <button type="button" onClick={onDispatch} className="min-h-11 shrink-0 rounded-xl border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-primary)]">{t('warehouse.driverHub.outboundDispatch')}</button>}
                <div className="bg-[var(--theme-bg-subtle)] p-0.5 sm:p-1 rounded-full border border-[var(--theme-border)] flex gap-1 w-full sm:w-auto flex-1 sm:flex-initial">
                    <button
                        onClick={() => setViewMode('Active')}
                        className={`flex-1 sm:flex-initial min-h-[34px] sm:min-h-[44px] px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-semibold transition-all touch-manipulation flex items-center justify-center whitespace-nowrap cursor-pointer ${
                            viewMode === 'Active'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        {t('warehouse.driverHub.activeDeliveries')}
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`flex-1 sm:flex-initial min-h-[34px] sm:min-h-[44px] px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-semibold transition-all touch-manipulation flex items-center justify-center whitespace-nowrap cursor-pointer ${
                            viewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        {t('warehouse.driverHub.history')}
                    </button>
                </div>
                <button
                    onClick={() => refreshData()}
                    disabled={isSubmitting}
                    aria-label="Refresh Data"
                    title="Refresh Data"
                    className="hidden sm:flex min-h-[44px] min-w-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs items-center justify-center shrink-0 touch-manipulation"
                >
                    <RefreshCw size={16} className={isSubmitting ? 'animate-spin text-[var(--theme-primary)]' : ''} />
                </button>
            </div>
        </div>
    );
};
