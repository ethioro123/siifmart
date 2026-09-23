import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Save,
    Copy,
    Send,
    Trash2,
    Printer,
    Search,
    Building2,
    Filter,
    RotateCcw
} from 'lucide-react';
import { Site } from '../../types';

interface ShiftPlannerHeaderProps {
    weekLabel: string;
    onNavigateWeek: (delta: number) => void;
    onGoToCurrentWeek: () => void;
    canEdit: boolean;
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onOpenCopyModal: () => void;
    onOpenPublishModal: () => void;
    onOpenClearModal: () => void;
    filterSite: string;
    onFilterSiteChange: (siteId: string) => void;
    sites: Site[];
    filterDepartment: string;
    onFilterDepartmentChange: (dept: string) => void;
    departments: string[];
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onPrint: () => void;
}

export const ShiftPlannerHeader: React.FC<ShiftPlannerHeaderProps> = ({
    weekLabel,
    onNavigateWeek,
    onGoToCurrentWeek,
    canEdit,
    isDirty,
    isSaving,
    onSave,
    onOpenCopyModal,
    onOpenPublishModal,
    onOpenClearModal,
    filterSite,
    onFilterSiteChange,
    sites,
    filterDepartment,
    onFilterDepartmentChange,
    departments,
    searchQuery,
    onSearchQueryChange,
    onPrint
}) => {
    return (
        <div className="space-y-4">
            {/* Top Toolbar: Week Navigator + Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-black/30 p-4 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/30 shadow-xs">
                {/* Week Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigateWeek(-1)}
                        className="p-2 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-stone-100 dark:hover:bg-white/10 transition-colors border border-[#E2DCCE] dark:border-white/10 cursor-pointer"
                        title="Previous Week"
                        aria-label="Previous Week"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    <button
                        onClick={onGoToCurrentWeek}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Jump to Today"
                    >
                        <RotateCcw size={13} />
                        Today
                    </button>

                    <div className="px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 flex items-center gap-2">
                        <Calendar size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9] tracking-wide select-none min-w-[190px] text-center">
                            {weekLabel}
                        </span>
                    </div>

                    <button
                        onClick={() => onNavigateWeek(1)}
                        className="p-2 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-stone-100 dark:hover:bg-white/10 transition-colors border border-[#E2DCCE] dark:border-white/10 cursor-pointer"
                        title="Next Week"
                        aria-label="Next Week"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Manager Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onPrint}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Print Weekly Timetable"
                    >
                        <Printer size={15} />
                        <span className="hidden sm:inline">Print</span>
                    </button>

                    {canEdit && (
                        <>
                            <button
                                onClick={onOpenCopyModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Copy Last Week's Schedule"
                            >
                                <Copy size={15} />
                                <span className="hidden sm:inline">Copy Last Week</span>
                            </button>

                            <button
                                onClick={onOpenPublishModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Publish and Confirm Roster"
                            >
                                <Send size={15} />
                                <span>Publish</span>
                            </button>

                            <button
                                onClick={onOpenClearModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Clear All Shifts for This Week"
                            >
                                <Trash2 size={15} />
                                <span className="hidden sm:inline">Clear</span>
                            </button>

                            <button
                                onClick={onSave}
                                disabled={isSaving || !isDirty}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                                    isDirty
                                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] hover:bg-[#1A3420] ring-2 ring-emerald-500/30'
                                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-75'
                                }`}
                            >
                                <Save size={15} className={isSaving ? 'animate-spin' : ''} />
                                <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes *' : 'Saved'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filter Bar: Site + Department + Search + Legend */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search employee or role..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-medium text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20"
                    />
                </div>

                {/* Site Filter */}
                <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                    <select
                        value={filterSite}
                        onChange={(e) => onFilterSiteChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20 appearance-none cursor-pointer"
                    >
                        <option value="All">All Sites / Facilities</option>
                        {sites.map(site => (
                            <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                        ))}
                    </select>
                </div>

                {/* Department Filter */}
                <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                    <select
                        value={filterDepartment}
                        onChange={(e) => onFilterDepartmentChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20 appearance-none cursor-pointer"
                    >
                        <option value="All">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Shift Type Legend */}
                <div className="flex items-center justify-between sm:justify-end gap-2 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-xl border border-[#E2DCCE] dark:border-white/10 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> M (Morning)
                    </span>
                    <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> E (Evening)
                    </span>
                    <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> N (Night)
                    </span>
                    <span className="flex items-center gap-1 text-stone-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600"></span> Off
                    </span>
                </div>
            </div>
        </div>
    );
};
