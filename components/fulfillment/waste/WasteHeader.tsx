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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 mb-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation ${
                            wasteViewMode === 'Log'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        Log Waste
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation ${
                            wasteViewMode === 'History'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
    );
};
