import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReturnsHeaderProps {
    returnViewMode: 'Process' | 'History';
    setReturnViewMode: (mode: 'Process' | 'History') => void;
    returnStep: 'Search' | 'Select' | 'Review' | 'Complete';
}

export const ReturnsHeader: React.FC<ReturnsHeaderProps> = ({
    returnViewMode,
    setReturnViewMode,
    returnStep
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 border-b border-[var(--theme-border)] pb-2.5 sm:pb-5">
            {/* Desktop title + toggle */}
            <div className="hidden sm:block">
                <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg sm:text-xl tracking-tight">
                    <RefreshCw className="text-primary" size={22} />
                    {t('warehouse.returnsManagementRMA')}
                </h3>
                <div className="flex items-center gap-2 mt-3 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] w-fit">
                    <button
                        onClick={() => setReturnViewMode('Process')}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            returnViewMode === 'Process'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        {t('warehouse.processReturn')}
                    </button>
                    <button
                        onClick={() => setReturnViewMode('History')}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            returnViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        {t('warehouse.returnsHistory')}
                    </button>
                </div>
            </div>

            {/* Mobile compact single row */}
            <div className="flex sm:hidden items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                    <RefreshCw className="text-primary shrink-0" size={14} />
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                        {t('warehouse.returns')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {returnStep}
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] p-0.5 rounded-lg border border-[var(--theme-border)] shrink-0">
                    <button
                        onClick={() => setReturnViewMode('Process')}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all touch-manipulation cursor-pointer ${
                            returnViewMode === 'Process'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)]'
                        }`}
                    >
                        {t('warehouse.processShort')}
                    </button>
                    <button
                        onClick={() => setReturnViewMode('History')}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all touch-manipulation cursor-pointer ${
                            returnViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)]'
                        }`}
                    >
                        {t('warehouse.historyShort')}
                    </button>
                </div>
            </div>

            {returnViewMode === 'Process' && (
                <div className="flex items-center gap-1.5 sm:gap-2 self-center sm:self-auto">
                    {['Search', 'Select', 'Review', 'Complete'].map((step, i) => {
                        const currentIndex = ['Search', 'Select', 'Review', 'Complete'].indexOf(returnStep);
                        const isActive = i <= currentIndex;
                        return (
                            <div key={step} className="flex items-center">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold tabular-nums ${
                                    isActive
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                        : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                }`}>
                                    {i + 1}
                                </div>
                                {i < 3 && <div className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${isActive ? 'bg-primary' : 'bg-[var(--theme-border)]'}`} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
