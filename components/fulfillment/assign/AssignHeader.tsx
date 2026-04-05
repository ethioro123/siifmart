import React from 'react';
import { Filter, ChevronDown, List, AlertTriangle, Clock, Search, ClipboardList, Sparkles, Undo2 } from 'lucide-react';
import { SortDropdown } from '../../shared';
import { useFulfillmentData } from '../FulfillmentDataProvider';

interface AssignHeaderProps {
    assignJobFilter: string;
    setAssignJobFilter: (val: string) => void;
    dispatchPriorityFilter: string;
    setDispatchPriorityFilter: (val: string) => void;
    assignSortBy: string;
    setAssignSortBy: (val: string) => void;
    dispatchSearch: string;
    setDispatchSearch: (val: string) => void;
    isAssignFilterDropdownOpen: boolean;
    setIsAssignFilterDropdownOpen: (val: boolean) => void;
    isAssignSortDropdownOpen: boolean;
    setIsAssignSortDropdownOpen: (val: boolean) => void;
}

export const AssignHeader: React.FC<AssignHeaderProps> = ({
    assignJobFilter,
    setAssignJobFilter,
    dispatchPriorityFilter,
    setDispatchPriorityFilter,
    assignSortBy,
    setAssignSortBy,
    dispatchSearch,
    setDispatchSearch,
    isAssignFilterDropdownOpen,
    setIsAssignFilterDropdownOpen,
    isAssignSortDropdownOpen,
    setIsAssignSortDropdownOpen
}) => {
    const { autoAssignJobs, autoUnassignJobs } = useFulfillmentData();
    return (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/40 relative z-10 group transition-colors duration-300">
            {/* Decorative Gradient Background Wrapper */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyber-primary/10 blur-[120px] rounded-full group-hover:bg-cyan-500/10 dark:group-hover:bg-cyber-primary/20 transition-colors duration-700" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-3 text-xl tracking-tight">
                        <div className="p-2 bg-cyan-500/10 dark:bg-cyber-primary/20 rounded-xl">
                            <ClipboardList className="text-cyan-600 dark:text-cyber-primary" size={24} />
                        </div>
                        Assign Task
                    </h3>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => autoUnassignJobs()}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-105 active:scale-95 transition-all group/btn"
                            title="Undo all auto-assigned jobs"
                        >
                            <Undo2 size={14} className="group-hover/btn:animate-spin-slow" />
                            <span>Undo Auto</span>
                        </button>
                        <button
                            onClick={() => autoAssignJobs()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-cyber-primary text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-[0_0_20px_rgba(0,255,157,0.3)] group/btn"
                        >
                            <Sparkles size={14} className="group-hover/btn:animate-spin-slow" />
                            <span>Auto-Assign</span>
                        </button>
                    </div>
                </div>

                {/* Simplified Unified Filters */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    {/* Intelligence Filter Dropdown (Type + Priority) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAssignFilterDropdownOpen(!isAssignFilterDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-black/40 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-xs font-black text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap"
                        >
                            <Filter size={14} className={assignJobFilter !== 'ALL' || dispatchPriorityFilter !== 'ALL' ? 'text-cyan-600 dark:text-cyber-primary' : ''} />
                            <span>FILTER: {assignJobFilter === 'ALL' ? 'ALL JOBS' : assignJobFilter} {dispatchPriorityFilter !== 'ALL' ? `(${dispatchPriorityFilter})` : ''}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isAssignFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isAssignFilterDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsAssignFilterDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-200 dark:ring-white/5">
                                    <div className="space-y-4">
                                        {/* Type Section */}
                                        <div>
                                            <p className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest mb-2 px-2">Job Intelligence Type</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {['ALL', 'RECEIVE', 'PICK', 'PACK', 'PUTAWAY', 'TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            setAssignJobFilter(type as any);
                                                            setIsAssignFilterDropdownOpen(false);
                                                        }}
                                                        className={`text-left px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${assignJobFilter === type
                                                            ? 'bg-slate-900 dark:bg-cyber-primary text-white dark:text-black'
                                                            : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority Section */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                            <p className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest mb-2 px-2">Operational Priority</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {['ALL', 'Critical', 'High', 'Normal'].map(priority => (
                                                    <button
                                                        key={priority}
                                                        onClick={() => {
                                                            setDispatchPriorityFilter(priority as any);
                                                            setIsAssignFilterDropdownOpen(false);
                                                        }}
                                                        className={`text-left px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${dispatchPriorityFilter === priority
                                                            ? 'bg-slate-900 dark:bg-cyber-primary text-white dark:text-black'
                                                            : priority === 'Critical' ? 'text-red-500/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5' :
                                                                priority === 'High' ? 'text-orange-500/60 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/5' :
                                                                    'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        {priority.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort By Dropdown */}
                    <SortDropdown
                        label="Sort"
                        options={[
                            { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                            { id: 'date', label: 'Date', icon: <Clock size={12} /> },
                            { id: 'items', label: 'Items', icon: <List size={12} /> }
                        ]}
                        value={assignSortBy}
                        onChange={(val) => setAssignSortBy(val)}
                        isOpen={isAssignSortDropdownOpen}
                        setIsOpen={setIsAssignSortDropdownOpen}
                    />

                    {/* ID Search Input */}
                    <div className="flex-1 min-w-[150px]">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={12} className="text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyber-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Payload ID Intelligence..."
                                value={dispatchSearch}
                                onChange={(e) => setDispatchSearch(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-slate-900 dark:text-white text-[10px] font-bold tracking-tight focus:border-cyan-500/50 dark:focus:border-cyber-primary/50 focus:bg-white dark:focus:bg-black/60 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
