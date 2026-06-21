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
        <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 text-lg">
                        <AlertOctagon className="text-red-600 dark:text-red-400" size={24} />
                        Waste & Spoilage Management
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Log and track inventory write-offs</p>
                </div>

                <div className="flex bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-xl p-1 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                    <button
                        onClick={() => setWasteViewMode('Log')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${wasteViewMode === 'Log' ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-stone-900 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'} `}
                    >
                        Log Waste
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${wasteViewMode === 'History' ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-stone-900 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'} `}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
    );
};
