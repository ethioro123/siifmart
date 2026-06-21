import React from 'react';
import { Package, Filter, ChevronDown, CheckCircle, AlertTriangle, Clock, List, Search } from 'lucide-react';
import { SortDropdown } from '../../shared';

interface PackHeaderProps {
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    packJobFilter: 'all' | 'pending' | 'in-progress' | 'completed';
    setPackJobFilter: (val: 'all' | 'pending' | 'in-progress' | 'completed') => void;
    isPackFilterDropdownOpen: boolean;
    setIsPackFilterDropdownOpen: (val: boolean) => void;
    packSortBy: 'priority' | 'date' | 'items';
    setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean;
    setIsPackSortDropdownOpen: (val: boolean) => void;
    packSearch: string;
    setPackSearch: (val: string) => void;
    t: (key: string) => string;
}

export const PackHeader: React.FC<PackHeaderProps> = ({
    viewMode, setViewMode, packJobFilter, setPackJobFilter, isPackFilterDropdownOpen, setIsPackFilterDropdownOpen,
    packSortBy, setPackSortBy, isPackSortDropdownOpen, setIsPackSortDropdownOpen, packSearch, setPackSearch, t
}) => {
    return (
        <div className="glass-panel md:rounded-3xl p-4 md:p-7 mb-2 md:mb-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 md:gap-6">
                <div className="hidden md:flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                        <Package size={30} className="text-gray-500 dark:text-gray-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{t('warehouse.tabs.pack')}</h2>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('warehouse.packDesc')}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                        <div className="bg-[#EAE5D9] dark:bg-[#1C2620]/60 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex gap-1 shadow-inner">
                            <button onClick={() => setViewMode('Process')} className={`px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] text-white shadow-xl shadow-[#2C5E3B]/20' : 'text-gray-400 dark:text-[#A9CBA2]/60 hover:text-gray-900 dark:hover:text-[#EAE5D9]'}`}>Process</button>
                            <button onClick={() => setViewMode('History')} className={`px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] text-white shadow-xl shadow-[#2C5E3B]/20' : 'text-gray-400 dark:text-[#A9CBA2]/60 hover:text-gray-900 dark:hover:text-[#EAE5D9]'}`}>History</button>
                        </div>

                        <div className="relative flex-1 md:flex-none">
                            <button onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)} className="flex items-center justify-between md:justify-start gap-4 w-full px-5 py-3 bg-gray-100 dark:bg-black/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 text-[10px] font-black text-gray-500 dark:hover:text-white transition-all shadow-inner h-full uppercase tracking-widest">
                                <div className="flex items-center gap-2 truncate opacity-80">
                                    <Filter size={13} className={`shrink-0 ${packJobFilter !== 'all' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}`} />
                                    <span className="truncate">Status: {packJobFilter === 'all' ? 'All' : packJobFilter}</span>
                                </div>
                                <ChevronDown size={14} className={`shrink-0 transition-transform duration-300 ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPackFilterDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                                    <div className="absolute top-full right-0 md:left-0 mt-3 w-56 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[2rem] p-2.5 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-300">
                                        {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                            <button key={status} onClick={() => { setPackJobFilter(status as any); setIsPackFilterDropdownOpen(false); }} className={`w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-between group ${packJobFilter === status ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-white dark:text-[#1E3B24]' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
                                                {(status === 'all' ? 'All Missions' : status)}
                                                {packJobFilter === status && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
 
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="shrink-0">
                            <SortDropdown label="Sort" options={[{ id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> }, { id: 'date', label: 'Date', icon: <Clock size={12} /> }, { id: 'items', label: 'Items', icon: <List size={12} /> }]} value={packSortBy} onChange={(val: any) => setPackSortBy(val)} isOpen={isPackSortDropdownOpen} setIsOpen={setIsPackSortDropdownOpen} />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <div className="relative group h-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none icon-pulse">
                                    <Search size={14} className="text-gray-400 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors" />
                                </div>
                                <input type="text" placeholder="Search Payload..." value={packSearch} onChange={(e) => setPackSearch(e.target.value)} className="w-full h-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-5 py-3 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest focus:border-[#2C5E3B]/50 focus:bg-white dark:focus:bg-black/60 outline-none transition-all placeholder:text-gray-400 shadow-inner" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
