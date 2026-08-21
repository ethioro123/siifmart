import React from 'react';
import { Package, Filter, ChevronDown, CheckCircle, AlertTriangle, Clock, List, Search, X } from 'lucide-react';
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
        <div className="glass-panel rounded-2xl md:rounded-3xl px-3 py-3 md:p-7 mb-2 md:mb-0">
            {/* Desktop title row */}
            <div className="hidden md:flex items-center gap-5 mb-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                    <Package size={30} className="text-gray-500 dark:text-gray-300" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{t('warehouse.tabs.pack')}</h2>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('warehouse.packDesc')}</p>
                </div>
            </div>

            {/* Row 1: Tabs + Filter + Sort */}
            <div className="flex items-center gap-2 w-full">
                {/* View mode toggle */}
                <div className="bg-[#EAE5D9] dark:bg-[#1C2620]/60 p-1 rounded-xl border border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex gap-1 shadow-inner shrink-0">
                    <button onClick={() => setViewMode('Process')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] text-white shadow-md' : 'text-gray-400 dark:text-[#A9CBA2]/60 hover:text-gray-900 dark:hover:text-[#EAE5D9]'}`}>{t('warehouse.process')}</button>
                    <button onClick={() => setViewMode('History')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] text-white shadow-md' : 'text-gray-400 dark:text-[#A9CBA2]/60 hover:text-gray-900 dark:hover:text-[#EAE5D9]'}`}>{t('warehouse.history')}</button>
                </div>

                {/* Filter dropdown */}
                <div className="relative shrink-0">
                    <button onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/10 text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest transition-all h-full">
                        <Filter size={12} className={packJobFilter !== 'all' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''} />
                        <span className="hidden sm:inline truncate max-w-[70px]">{packJobFilter === 'all' ? t('warehouse.allStatus') : packJobFilter}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPackFilterDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                    <button key={status} onClick={() => { setPackJobFilter(status as any); setIsPackFilterDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-between ${packJobFilter === status ? 'bg-[#2C5E3B] text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
                                        {status === 'all' ? t('warehouse.allStatus') : status}
                                        {packJobFilter === status && <CheckCircle size={12} />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sort — desktop only */}
                <div className="hidden md:block shrink-0">
                    <SortDropdown label={t('warehouse.sortByLabel')} options={[{ id: 'priority', label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> }, { id: 'date', label: t('warehouse.timeSort'), icon: <Clock size={12} /> }, { id: 'items', label: t('warehouse.itemPlural'), icon: <List size={12} /> }]} value={packSortBy} onChange={(val: any) => setPackSortBy(val)} isOpen={isPackSortDropdownOpen} setIsOpen={setIsPackSortDropdownOpen} />
                </div>

                {/* Search — grows to fill */}
                <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search SKU, barcode, order..."
                        aria-label="Search product, SKU, barcode, order"
                        title="Search product, SKU, barcode, order"
                        value={packSearch}
                        onChange={(e) => setPackSearch(e.target.value)}
                        className="w-full bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-gray-900 dark:text-white text-xs font-bold focus:border-[#2C5E3B]/50 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                    />
                    {packSearch && (
                        <button onClick={() => setPackSearch('')} aria-label="Clear search" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
