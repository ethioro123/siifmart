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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 relative z-10 shadow-sm">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-5">
                    <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5 text-base sm:text-lg tracking-tight">
                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                            <ClipboardList className="text-primary" size={20} />
                        </div>
                        Assign Task
                    </h3>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => autoUnassignJobs()}
                            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors active:scale-[0.98] touch-manipulation"
                            title="Undo all auto-assigned jobs"
                        >
                            <Undo2 size={14} />
                            <span>Undo Auto</span>
                        </button>
                        <button
                            onClick={() => autoAssignJobs()}
                            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors active:scale-[0.98] shadow-sm touch-manipulation"
                        >
                            <Sparkles size={14} />
                            <span>Auto-Assign</span>
                        </button>
                    </div>
                </div>

                {/* Unified Filters */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Intelligence Filter Dropdown (Type + Priority) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAssignFilterDropdownOpen(!isAssignFilterDropdownOpen)}
                            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-colors whitespace-nowrap touch-manipulation"
                        >
                            <Filter size={14} className={assignJobFilter !== 'ALL' || dispatchPriorityFilter !== 'ALL' ? 'text-primary' : 'text-[var(--theme-text-muted)]'} />
                            <span>FILTER: {assignJobFilter === 'ALL' ? 'ALL JOBS' : assignJobFilter} {dispatchPriorityFilter !== 'ALL' ? `(${dispatchPriorityFilter})` : ''}</span>
                            <ChevronDown size={14} className={`text-[var(--theme-text-muted)] transition-transform duration-200 ${isAssignFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isAssignFilterDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsAssignFilterDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3 shadow-xl z-[51] animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="space-y-3">
                                        {/* Type Section */}
                                        <div>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase tracking-wider mb-2 px-1">Job Type</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {['ALL', 'RECEIVE', 'PICK', 'PACK', 'PUTAWAY', 'TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            setAssignJobFilter(type as any);
                                                            setIsAssignFilterDropdownOpen(false);
                                                        }}
                                                        className={`min-h-[36px] text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors touch-manipulation ${
                                                            assignJobFilter === type
                                                                ? 'bg-primary text-white'
                                                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority Section */}
                                        <div className="pt-2 border-t border-[var(--theme-border)]">
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase tracking-wider mb-2 px-1">Priority</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {['ALL', 'Critical', 'High', 'Normal'].map(priority => (
                                                    <button
                                                        key={priority}
                                                        onClick={() => {
                                                            setDispatchPriorityFilter(priority as any);
                                                            setIsAssignFilterDropdownOpen(false);
                                                        }}
                                                        className={`min-h-[36px] text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors touch-manipulation ${
                                                            dispatchPriorityFilter === priority
                                                                ? 'bg-primary text-white'
                                                                : priority === 'Critical'
                                                                    ? 'text-red-500 hover:bg-red-500/10'
                                                                    : priority === 'High'
                                                                        ? 'text-orange-500 hover:bg-orange-500/10'
                                                                        : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
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
                    <div className="flex-1 min-w-[180px]">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={14} className="text-[var(--theme-text-muted)]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Payload ID..."
                                aria-label="Search Payload ID"
                                title="Search Payload ID"
                                value={dispatchSearch}
                                onChange={(e) => setDispatchSearch(e.target.value)}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
