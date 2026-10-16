import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CountHeaderProps {
    countViewMode: 'Operations' | 'Reports';
    setCountViewMode: (mode: 'Operations' | 'Reports') => void;
    countSessionStatus: 'Idle' | 'Active' | 'Review';
    setCountSessionStatus: (status: 'Idle' | 'Active' | 'Review') => void;
    setCountSessionItems: (items: any[]) => void;
}

export const CountHeader: React.FC<CountHeaderProps> = ({
    countViewMode,
    setCountViewMode,
    countSessionStatus,
    setCountSessionStatus,
    setCountSessionItems
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 sm:p-5 shadow-xs mb-2">
            {/* Desktop header */}
            <div className="hidden sm:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                        <ClipboardCheck size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-lg tracking-tight uppercase">
                            {t('warehouse.inventoryAuditTitle')}
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            {countViewMode === 'Operations'
                                ? (countSessionStatus === 'Idle' ? t('warehouse.startCountSession') : countSessionStatus === 'Active' ? t('warehouse.blindCountInProgress') : t('warehouse.reviewApproveVariances'))
                                : t('warehouse.historicalAccuracyReports')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* View Toggle Segmented Control */}
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setCountViewMode('Operations')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                countViewMode === 'Operations'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.operations')}
                        </button>
                        <button
                            onClick={() => setCountViewMode('Reports')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                countViewMode === 'Reports'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.reports')}
                        </button>
                    </div>

                    {countSessionStatus !== 'Idle' && countViewMode === 'Operations' && (
                        <button
                            onClick={() => {
                                if (confirm(t('warehouse.cancelCurrentSessionPrompt'))) {
                                    setCountSessionStatus('Idle');
                                    setCountSessionItems([]);
                                }
                            }}
                            className="text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-semibold border border-red-500/20 px-3.5 py-2 rounded-xl transition-colors min-h-[44px]"
                        >
                            {t('warehouse.cancelSession')}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile compact single row */}
            <div className="flex sm:hidden items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <ClipboardCheck size={14} className="text-[var(--theme-accent)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">Audit</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {countSessionStatus}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-0.5 rounded-lg flex items-center">
                        <button
                            onClick={() => setCountViewMode('Operations')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors min-h-[30px] ${
                                countViewMode === 'Operations'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)]'
                            }`}
                        >
                            Ops
                        </button>
                        <button
                            onClick={() => setCountViewMode('Reports')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors min-h-[30px] ${
                                countViewMode === 'Reports'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)]'
                            }`}
                        >
                            Reports
                        </button>
                    </div>

                    {countSessionStatus !== 'Idle' && countViewMode === 'Operations' && (
                        <button
                            onClick={() => {
                                if (confirm(t('warehouse.cancelCurrentSessionPrompt'))) {
                                    setCountSessionStatus('Idle');
                                    setCountSessionItems([]);
                                }
                            }}
                            className="text-red-500 text-[10px] font-semibold border border-red-500/20 px-2 py-1 rounded-lg min-h-[30px]"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CountHeader;
