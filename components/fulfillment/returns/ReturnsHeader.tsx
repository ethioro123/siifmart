import React from 'react';
import { RefreshCw } from 'lucide-react';

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
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[var(--theme-border)] pb-5">
            <div>
                <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg sm:text-xl tracking-tight">
                    <RefreshCw className="text-primary" size={22} />
                    Returns Management (RMA)
                </h3>
                <div className="flex items-center gap-2 mt-3 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] w-fit">
                    <button
                        onClick={() => setReturnViewMode('Process')}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation ${
                            returnViewMode === 'Process'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        Process Return
                    </button>
                    <button
                        onClick={() => setReturnViewMode('History')}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-manipulation ${
                            returnViewMode === 'History'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        Returns History
                    </button>
                </div>
            </div>

            {returnViewMode === 'Process' && (
                <div className="flex items-center gap-2">
                    {['Search', 'Select', 'Review', 'Complete'].map((step, i) => {
                        const currentIndex = ['Search', 'Select', 'Review', 'Complete'].indexOf(returnStep);
                        const isActive = i <= currentIndex;
                        return (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold tabular-nums ${
                                    isActive
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                }`}>
                                    {i + 1}
                                </div>
                                {i < 3 && <div className={`w-6 sm:w-8 h-0.5 mx-1 ${isActive ? 'bg-primary' : 'bg-[var(--theme-border)]'}`} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
