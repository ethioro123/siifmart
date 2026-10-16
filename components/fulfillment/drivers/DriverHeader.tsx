import React from 'react';
import { Truck, RefreshCw } from 'lucide-react';
import { User, Site } from '../../../types';

interface DriverHeaderProps {
    t: (key: string) => string;
    user: User | null;
    employees: any[];
    activeSite: Site | null;
    viewMode: 'Active' | 'History';
    setViewMode: (mode: 'Active' | 'History') => void;
    isSubmitting: boolean;
    refreshData: () => Promise<void>;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    t,
    user,
    activeSite,
    viewMode,
    setViewMode,
    isSubmitting,
    refreshData
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between sticky top-0 z-40 gap-3">
            <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shrink-0 text-primary">
                        <Truck size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-[var(--theme-text-primary)] tracking-tight leading-tight truncate">
                                {t('warehouse.driverHub.driverTitle')} {t('warehouse.driverHub.hubTitle')}
                            </h2>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider mt-0.5 truncate">
                            {user?.name || t('warehouse.driverFallback')} • {activeSite?.name || t('warehouse.centralOpsArea')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refreshData()}
                    disabled={isSubmitting}
                    aria-label="Refresh Data"
                    title="Refresh Data"
                    className="sm:hidden min-h-[40px] min-w-[40px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs flex items-center justify-center shrink-0 touch-manipulation"
                >
                    <RefreshCw size={16} className={isSubmitting ? 'animate-spin text-primary' : ''} />
                </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] flex gap-1 w-full sm:w-auto flex-1 sm:flex-initial">
                    <button
                        onClick={() => setViewMode('Active')}
                        className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation flex items-center justify-center whitespace-nowrap ${
                            viewMode === 'Active'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        {t('warehouse.driverHub.activeDeliveries')}
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation flex items-center justify-center whitespace-nowrap ${
                            viewMode === 'History'
                                ? 'bg-primary text-white shadow-xs'
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
                    className="hidden sm:flex min-h-[44px] min-w-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs items-center justify-center shrink-0 touch-manipulation"
                >
                    <RefreshCw size={16} className={isSubmitting ? 'animate-spin text-primary' : ''} />
                </button>
            </div>
        </div>
    );
};
