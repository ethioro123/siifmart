import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface WasteHeaderProps {
    wasteViewMode: 'Log' | 'History';
    setWasteViewMode: (mode: 'Log' | 'History') => void;
}

export const WasteHeader: React.FC<WasteHeaderProps> = ({
    wasteViewMode,
    setWasteViewMode
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 sm:p-5 mb-2 sm:mb-5 shadow-xs">
            {/* Desktop header */}
            <div className="hidden sm:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg tracking-tight">
                        <AlertOctagon className="text-red-500" size={22} />
                        Waste & Spoilage Management
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Log and track inventory write-offs</p>
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
                        Log Waste
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Mobile compact single row */}
            <div className="flex sm:hidden items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <AlertOctagon className="text-red-500 shrink-0" size={14} />
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">Waste</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Write-offs
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
                        Log
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all touch-manipulation cursor-pointer ${
                            wasteViewMode === 'History'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)]'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
    );
};
