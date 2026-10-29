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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] p-4 rounded-2xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-xs">
                {/* Week Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigateWeek(-1)}
                        className="p-2 rounded-xl text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] transition-colors border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] cursor-pointer"
                        title="Previous Week"
                        aria-label="Previous Week"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        onClick={onGoToCurrentWeek}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] hover:bg-[var(--theme-primary)]/10 transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Jump to Today"
                    >
                        <RotateCcw size={13} />
                        Today
                    </button>

                    <div className="px-4 py-2 rounded-xl bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] flex items-center gap-2">
                        <Calendar size={16} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                        <span className="font-bold text-sm text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] tracking-wide select-none min-w-[190px] text-center">
                            {weekLabel}
                        </span>
                    </div>

                    <button
                        onClick={() => onNavigateWeek(1)}
                        className="p-2 rounded-xl text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] transition-colors border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] cursor-pointer"
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
                        className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Print Weekly Timetable"
                    >
                        <Printer size={15} />
                        <span className="hidden sm:inline">Print</span>
                    </button>

                    {canEdit && (
                        <>
                            <button
                                onClick={onOpenCopyModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] hover:bg-[var(--theme-primary)]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Copy Last Week's Schedule"
                            >
                                <Copy size={15} />
                                <span className="hidden sm:inline">Copy Last Week</span>
                            </button>

                            <button
                                onClick={onOpenPublishModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Publish and Confirm Roster"
                            >
                                <Send size={15} />
                                <span>Publish</span>
                            </button>

                            <button
                                onClick={onOpenClearModal}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                                        ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-primary)] hover:bg-[#1A3420] ring-2 ring-[var(--theme-status-success-border)]'
                                        : 'bg-[var(--theme-bg-subtle)] bg-[var(--theme-bg-panel)] text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] cursor-not-allowed opacity-75'
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
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search employee or role..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl text-xs font-medium text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
                    />
                </div>

                {/* Site Filter */}
                <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] w-4 h-4 pointer-events-none" />
                    <select
                        value={filterSite}
                        onChange={(e) => onFilterSiteChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 appearance-none cursor-pointer"
                    >
                        <option value="All">All Sites / Facilities</option>
                        {sites.map(site => (
                            <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                        ))}
                    </select>
                </div>

                {/* Department Filter */}
                <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] w-4 h-4 pointer-events-none" />
                    <select
                        value={filterDepartment}
                        onChange={(e) => onFilterDepartmentChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 appearance-none cursor-pointer"
                    >
                        <option value="All">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Shift Type Legend */}
                <div className="flex items-center justify-between sm:justify-end gap-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_60%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] px-3 py-2 rounded-xl border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-status-warning-bg)]"></span> M (Morning)
                    </span>
                    <span className="flex items-center gap-1 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-status-warning-bg)]"></span> E (Evening)
                    </span>
                    <span className="flex items-center gap-1 text-[var(--theme-accent)] text-[var(--theme-accent)]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-accent-muted)]"></span> N (Night)
                    </span>
                    <span className="flex items-center gap-1 text-[var(--theme-text-secondary)]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-bg-card-hover)] bg-[var(--theme-bg-card-hover)]"></span> Off
                    </span>
                </div>
            </div>
        </div>
    );
};
