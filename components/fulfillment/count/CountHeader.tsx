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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.operations')}
                        </button>
                        <button
                            onClick={() => setCountViewMode('Reports')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                countViewMode === 'Reports'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
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
        </div>
    );
};

export default CountHeader;
