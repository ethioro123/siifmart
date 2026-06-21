import React from 'react';
import { ClipboardCheck } from 'lucide-react';

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
    return (
        <div className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 text-lg">
                        <ClipboardCheck className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={24} />
                        Inventory Audit & Cycle Counting
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {countViewMode === 'Operations'
                            ? (countSessionStatus === 'Idle' ? 'Start a new count session' : countSessionStatus === 'Active' ? 'BLIND COUNT IN PROGRESS' : 'Review & Approve Variances')
                            : 'Historical accuracy and variance reports'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-xl p-1 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                        <button
                            onClick={() => setCountViewMode('Operations')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${countViewMode === 'Operations' ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-stone-900 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'} `}
                        >
                            Operations
                        </button>
                        <button
                            onClick={() => setCountViewMode('Reports')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${countViewMode === 'Reports' ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-stone-900 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'} `}
                        >
                            Reports
                        </button>
                    </div>

                    {countSessionStatus !== 'Idle' && countViewMode === 'Operations' && (
                        <button
                            onClick={() => {
                                if (confirm('Cancel current session? Progress will be lost.')) {
                                    setCountSessionStatus('Idle');
                                    setCountSessionItems([]);
                                }
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/10"
                        >
                            Cancel Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
