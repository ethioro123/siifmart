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
        <div className="bg-gradient-to-br from-black/60 via-cyber-black/40 to-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem] p-5 lg:p-8 shadow-2xl relative overflow-hidden group">
            {/* Dynamic Background Effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] -mr-48 -mt-48 rounded-full animate-pulse-slow" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                        <div className="relative p-5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-3xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <Truck className="text-cyan-400 group-hover:scale-110 transition-transform duration-500" size={32} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase mb-1">
                                Driver <span className="text-cyan-400">Hub</span>
                            </h2>
                            <div className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30">
                                <p className="text-[8px] lg:text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">V4.0</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('warehouse.docks.welcome')?.replace('{name}', user?.name || 'Driver') || `Welcome, ${user?.name || 'Driver'} `}</p>
                            </div>
                            <div className="h-4 w-px bg-white/10 hidden sm:block" />
                            {(() => {
                                const currentEmployee = employees.find(e => e.email === user?.email);
                                const driverType = currentEmployee?.driverType || 'internal';
                                return (
                                    <span className={`text-[10px] px-3 py-1 rounded-2xl font-black uppercase tracking-[0.1em] border shadow-sm ${driverType === 'internal' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        driverType === 'subcontracted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        } `}>
                                        {driverType === 'internal' ? 'Unit: Internal Fleet' : driverType === 'subcontracted' ? 'Unit: Contractor' : 'Unit: Partner'}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 flex gap-1">
                        <button
                            onClick={() => setViewMode('Active')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'Active' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Command
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                    <div className="flex-1 lg:flex-none bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 flex items-center justify-between lg:justify-end gap-6 shadow-inner">
                        <div className="text-right">
                            <p className="text-lg font-black text-white font-mono tracking-tighter">{formatDateTime(new Date(), { showTime: true })}</p>
                            <div className="flex items-center justify-end gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                                <MapPin size={10} className="text-cyan-500" />
                                {activeSite?.name || 'Central Ops Area'}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <button
                            onClick={() => refreshData()}
                            disabled={isSubmitting}
                            title="REFRESH MISSION DATA"
                            className="p-3 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-xl text-cyan-400 transition-all duration-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] group"
                        >
                            <RefreshCw size={20} className={`${isSubmitting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} `} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
