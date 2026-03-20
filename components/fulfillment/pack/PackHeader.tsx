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
    viewMode,
    setViewMode,
    packJobFilter,
    setPackJobFilter,
    isPackFilterDropdownOpen,
    setIsPackFilterDropdownOpen,
    packSortBy,
    setPackSortBy,
    isPackSortDropdownOpen,
    setIsPackSortDropdownOpen,
    packSearch,
    setPackSearch,
    t
}) => {
    return (
        <div className="bg-cyber-gray border border-white/5 md:rounded-2xl p-3 md:p-6 mb-2 md:mb-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                {/* Title & Description (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                        <Package size={28} className="text-gray-300" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('warehouse.tabs.pack')}</h2>
                        <p className="text-sm text-gray-400">{t('warehouse.packDesc')}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
                    {/* Top Row on Mobile: Toggle & Filter */}
                    <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
                        <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg md:rounded-xl border border-white/5 flex gap-1">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                Process
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                History
                            </button>
                        </div>

                        {/* Pack Intelligence Filter (Status) - Icon only on very small screens, full text on md */}
                        <div className="relative flex-1 md:flex-none">
                            <button
                                onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)}
                                className="flex items-center justify-between md:justify-start gap-2 w-full px-3 md:px-4 py-1.5 md:py-2 bg-black/40 backdrop-blur-md rounded-lg md:rounded-xl border border-white/10 text-[10px] md:text-xs font-black text-gray-400 hover:text-white transition-all whitespace-nowrap h-full"
                            >
                                <div className="flex items-center gap-1.5 max-w-[120px] md:max-w-none truncate">
                                    <Filter size={12} className={`shrink-0 md:w-3.5 md:h-3.5 ${packJobFilter !== 'all' ? 'text-cyber-primary' : ''}`} />
                                    <span className="truncate">STATUS: {packJobFilter === 'all' ? 'ALL' : packJobFilter.toUpperCase()}</span>
                                </div>
                                <ChevronDown size={12} className={`shrink-0 md:w-3.5 md:h-3.5 transition-transform duration-300 ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPackFilterDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                                    <div className="absolute top-full right-0 md:left-0 mt-2 w-48 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                        {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setPackJobFilter(status as any);
                                                    setIsPackFilterDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all flex items-center justify-between group ${packJobFilter === status
                                                    ? 'bg-cyber-primary text-black'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                {(status === 'all' ? 'ALL ARCHIVES' : status.toUpperCase())}
                                                {packJobFilter === status && <CheckCircle size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row on Mobile: Sort & Search */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Pack Sort Dropdown */}
                        <div className="shrink-0">
                            <SortDropdown
                                label="Sort"
                                options={[
                                    { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                    { id: 'date', label: 'Date', icon: <Clock size={12} /> },
                                    { id: 'items', label: 'Items', icon: <List size={12} /> }
                                ]}
                                value={packSortBy}
                                onChange={(val: any) => setPackSortBy(val)}
                                isOpen={isPackSortDropdownOpen}
                                setIsOpen={setIsPackSortDropdownOpen}
                            />
                        </div>

                        {/* Pack Search Input */}
                        <div className="flex-1 min-w-[120px]">
                            <div className="relative group h-full">
                                <div className="absolute inset-y-0 left-0 pl-2.5 md:pl-3 flex items-center pointer-events-none">
                                    <Search size={12} className="text-gray-600 md:w-3 md:h-3 group-focus-within:text-cyber-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search Payload IDs..."
                                    value={packSearch}
                                    onChange={(e) => setPackSearch(e.target.value)}
                                    className="w-full h-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl pl-8 md:pl-9 pr-3 py-1.5 md:py-2 text-white text-[10px] md:text-xs font-bold tracking-tight focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
