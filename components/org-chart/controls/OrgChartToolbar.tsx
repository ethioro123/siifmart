import React from 'react';
import { Site } from '../../../types';
import { OrgChartFilterState, OrgViewMode } from '../types';
import {
    Search,
    LayoutGrid,
    Printer,
    Users,
    RotateCcw,
    Shield,
    X
} from 'lucide-react';

interface OrgChartToolbarProps {
    filters: OrgChartFilterState;
    setFilters: React.Dispatch<React.SetStateAction<OrgChartFilterState>>;
    viewMode?: OrgViewMode;
    setViewMode?: (mode: OrgViewMode) => void;
    sites?: Site[];
    customDepartments?: { id: string; label: string }[];
    totalCount: number;
    activeCount?: number;
    isDark: boolean;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onPrint?: () => void;
    onResetFilters?: () => void;
}

export const OrgChartToolbar: React.FC<OrgChartToolbarProps> = ({
    filters,
    setFilters,
    sites = [],
    customDepartments = [],
    totalCount,
    activeCount,
    isDark,
    onPrint,
    onResetFilters
}) => {
    const departments = React.useMemo(() => {
        const base = [
            { id: '', label: 'All Departments' },
            { id: 'executive', label: 'Executive' },
            { id: 'store', label: 'Store Operations' },
            { id: 'warehouse', label: 'Warehouse & Logistics' },
            { id: 'finance', label: 'Finance & Accounts' },
            { id: 'hr', label: 'Human Resources' },
            { id: 'procurement', label: 'Procurement & Supply' },
            { id: 'support', label: 'IT & Loss Prevention' },
        ];
        customDepartments.forEach(cd => {
            if (!base.some(d => d.id === cd.id)) {
                base.push(cd);
            }
        });
        return base;
    }, [customDepartments]);

    const hasActiveFilters = Boolean(
        filters.searchTerm ||
        filters.siteId ||
        filters.department ||
        filters.status ||
        filters.hierarchyLevel
    );

    const handleClearSearch = () => {
        setFilters(prev => ({ ...prev, searchTerm: '' }));
    };

    const handleReset = () => {
        if (onResetFilters) {
            onResetFilters();
        } else {
            setFilters({
                searchTerm: '',
                siteId: '',
                department: '',
                status: '',
                hierarchyLevel: null
            });
        }
    };

    return (
        <div className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[var(--theme-bg-panel)] border-[#2C4D35]' : 'bg-white border-[var(--theme-border)] shadow-xs'
        }`}>
            {/* Left: Matrix Branding & Headcount Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary-muted)]/15 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] border border-[var(--theme-border)]/20">
                    <LayoutGrid size={15} />
                    <span className="text-xs font-black uppercase tracking-wider">Enterprise Matrix</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[var(--theme-bg-app)] dark:bg-[#1E2822] text-xs font-semibold text-stone-700 dark:text-stone-300">
                    <Users size={13} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                    <span>{totalCount} Personnel</span>
                </div>

                {typeof activeCount === 'number' && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)] text-xs font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
                        <span>{activeCount} Active</span>
                    </div>
                )}
            </div>

            {/* Right: Search & Matrix Filtering Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-56 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        placeholder="Search name, role, code..."
                        className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                            isDark
                                ? 'bg-[#1E2822] border-[#2C4D35] text-white placeholder-stone-500 focus:border-[var(--theme-border)]'
                                : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-stone-900 placeholder-stone-400 focus:border-[var(--theme-border)]'
                        }`}
                    />
                    {filters.searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                            title="Clear search"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Facility / Site Filter */}
                <select
                    value={filters.siteId}
                    onChange={(e) => setFilters(prev => ({ ...prev, siteId: e.target.value }))}
                    title="Filter by facility or operational site"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[var(--theme-border)]'
                            : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-stone-700 focus:border-[var(--theme-border)]'
                    }`}
                >
                    <option value="">All Facilities / Sites</option>
                    {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                {/* Department Filter */}
                <select
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    title="Filter by department swimlane"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[var(--theme-border)]'
                            : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-stone-700 focus:border-[var(--theme-border)]'
                    }`}
                >
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                </select>

                {/* Hierarchy Level Filter (L1 - L10) */}
                <select
                    value={filters.hierarchyLevel ? String(filters.hierarchyLevel) : ''}
                    onChange={(e) => setFilters(prev => ({
                        ...prev,
                        hierarchyLevel: e.target.value ? Number(e.target.value) : null
                    }))}
                    title="Filter by command hierarchy level"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[var(--theme-border)]'
                            : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-stone-700 focus:border-[var(--theme-border)]'
                    }`}
                >
                    <option value="">All Hierarchy Tiers</option>
                    <option value="1">L1: Global Executive</option>
                    <option value="2">L2: Country Executive</option>
                    <option value="3">L3: Corporate HQ Directors</option>
                    <option value="4">L4: Regional Operations Manager</option>
                    <option value="5">L5: Area & Regional Managers</option>
                    <option value="6">L6: Facility Captains</option>
                    <option value="7">L7: Department Managers</option>
                    <option value="8">L8: Shift Supervisors</option>
                    <option value="9">L9: Functional Specialists</option>
                    <option value="10">L10: Frontline Staff</option>
                </select>

                {/* Status Filter */}
                <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    title="Filter by employee operational status"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[var(--theme-border)]'
                            : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-stone-700 focus:border-[var(--theme-border)]'
                    }`}
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                </select>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-xs font-semibold transition-colors cursor-pointer"
                        title="Reset all active filters"
                    >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                    </button>
                )}

                {/* Print button */}
                {onPrint && (
                    <button
                        type="button"
                        onClick={onPrint}
                        className="p-1.5 rounded-xl border border-stone-200 dark:border-[#2C4D35] hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                        title="Print Organizational Matrix"
                    >
                        <Printer size={15} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrgChartToolbar;
