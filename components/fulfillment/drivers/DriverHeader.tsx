import React from 'react';
import { Truck, MapPin, RefreshCw } from 'lucide-react';
import { User, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

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
    employees,
    activeSite,
    viewMode,
    setViewMode,
    isSubmitting,
    refreshData
}) => {
    return (
        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-2xl p-3 shadow-xl flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl border border-cyan-500/20 dark:border-cyan-500/30 shrink-0">
                    <Truck className="text-cyan-600 dark:text-cyan-400" size={18} />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">Driver Hub</h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                    </div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate leading-tight">
                        {user?.name || 'Driver'} • {activeSite?.name || 'Central'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="bg-gray-100 dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/5 flex gap-1 shadow-inner">
                    <button
                        onClick={() => setViewMode('Active')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'Active' ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        CMD
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        LOG
                    </button>
                </div>
                <button
                    onClick={() => refreshData()}
                    disabled={isSubmitting}
                    aria-label="Refresh Data"
                    title="Refresh Data"
                    className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-cyan-500 hover:text-black rounded-lg text-cyan-600 dark:text-cyan-400 transition-all border border-gray-200 dark:border-white/5 shadow-sm"
                >
                    <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
    );
};
