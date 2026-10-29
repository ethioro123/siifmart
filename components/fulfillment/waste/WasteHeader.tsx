import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface WasteHeaderProps {
    wasteViewMode: 'Log' | 'History';
    setWasteViewMode: (mode: 'Log' | 'History') => void;
}

export const WasteHeader: React.FC<WasteHeaderProps> = ({
    wasteViewMode,
    setWasteViewMode
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 sm:p-5 mb-2 sm:mb-5 shadow-xs">
            {/* Desktop header */}
            <div className="hidden sm:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg tracking-tight">
                        <AlertOctagon className="text-[var(--theme-status-danger-text)]" size={22} />
                        {t('warehouse.wasteManagementTitle')}
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        {t('warehouse.wasteSubtitle')}
                    </p>
                </div>

                <div className="flex bg-[var(--theme-bg-subtle)] rounded-xl p-1 border border-[var(--theme-border)] shrink-0">
                    <button
                        onClick={() => setWasteViewMode('Log')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'Log'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        {t('warehouse.logWaste')}
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        {t('warehouse.historyShort')}
                    </button>
                </div>
            </div>

            {/* Mobile compact single row */}
            <div className="flex sm:hidden items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <AlertOctagon className="text-[var(--theme-status-danger-text)] shrink-0" size={14} />
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                        {t('warehouse.waste')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-danger-bg)]" />
                        {t('warehouse.writeOffsBadge')}
                    </span>
                </div>

                <div className="flex bg-[var(--theme-bg-subtle)] rounded-lg p-0.5 border border-[var(--theme-border)] shrink-0">
                    <button
                        onClick={() => setWasteViewMode('Log')}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'Log'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)]'
                        }`}
                    >
                        {t('warehouse.logShort')}
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)]'
                        }`}
                    >
                        {t('warehouse.historyShort')}
                    </button>
                </div>
            </div>
        </div>
    );
};
