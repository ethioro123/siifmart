import React from 'react';
import { Site } from '../../../types';
import { OrgChartFilterState, OrgViewMode } from '../types';
import {
    Search,
    Filter,
    Network,
    LayoutGrid,
    ChevronsDownUp,
    ChevronsUpDown,
    Printer,
    Users
} from 'lucide-react';

interface OrgChartToolbarProps {
    filters: OrgChartFilterState;
    setFilters: React.Dispatch<React.SetStateAction<OrgChartFilterState>>;
    viewMode: OrgViewMode;
    setViewMode: (mode: OrgViewMode) => void;
    sites?: Site[];
    customDepartments?: { id: string; label: string }[];
    totalCount: number;
    isDark: boolean;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onPrint?: () => void;
}

export const OrgChartToolbar: React.FC<OrgChartToolbarProps> = ({
    filters,
    setFilters,
    viewMode,
    setViewMode,
    sites = [],
    customDepartments = [],
    totalCount,
    isDark,
    onExpandAll,
    onCollapseAll,
    onPrint
}) => {
    const departments = React.useMemo(() => {
        const base = [
            { id: '', label: 'All Departments' },
            { id: 'executive', label: 'Executive' },
            { id: 'store', label: 'Store Ops' },
            { id: 'warehouse', label: 'Warehouse & Logistics' },
            { id: 'finance', label: 'Finance' },
            { id: 'hr', label: 'Human Resources' },
            { id: 'procurement', label: 'Procurement' },
            { id: 'support', label: 'IT & Support' },
        ];
        customDepartments.forEach(cd => {
            if (!base.some(d => d.id === cd.id)) {
                base.push(cd);
            }
        });
        return base;
    }, [customDepartments]);

    return (
        <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-white border-[#E2DCCE] shadow-sm'
        }`}>
            {/* Left: View Mode Switcher + Headcount */}
            <div className="flex items-center gap-2.5">
                <div className="flex bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-[#2C4D35] rounded-xl p-1">
                    <button
                        type="button"
                        onClick={() => setViewMode('tree')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'tree'
                                ? 'bg-[#2C5E3B] text-white shadow-sm'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                        title="Interactive Top-Down Hierarchy Tree"
                    >
                        <Network size={14} />
                        <span>Tree View</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewMode('matrix')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'matrix'
                                ? 'bg-[#2C5E3B] text-white shadow-sm'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                        title="Department & Site Matrix View"
                    >
                        <LayoutGrid size={14} />
                        <span>Matrix</span>
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-[#2C4D35] bg-[#FAF8F5] dark:bg-[#1E2822] text-xs font-semibold text-[#2C5E3B] dark:text-[#A9CBA2]">
                    <Users size={14} />
                    <span>{totalCount} Staff</span>
                </div>
            </div>

            {/* Right: Search, Filters, Branch Folding, Print */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-56">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        placeholder="Search name, role, code..."
                        className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                            isDark
                                ? 'bg-[#1E2822] border-[#2C4D35] text-white placeholder-stone-500 focus:border-[#A9CBA2]'
                                : 'bg-[#FAF8F5] border-[#E2DCCE] text-stone-900 placeholder-stone-400 focus:border-[#2C5E3B]'
                        }`}
                    />
                </div>

                {/* Site Filter */}
                <select
                    value={filters.siteId}
                    onChange={(e) => setFilters(prev => ({ ...prev, siteId: e.target.value }))}
                    title="Filter by site or facility"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[#A9CBA2]'
                            : 'bg-[#FAF8F5] border-[#E2DCCE] text-stone-700 focus:border-[#2C5E3B]'
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
                    title="Filter by corporate department"
                    className={`px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer transition-colors ${
                        isDark
                            ? 'bg-[#1E2822] border-[#2C4D35] text-stone-200 focus:border-[#A9CBA2]'
                            : 'bg-[#FAF8F5] border-[#E2DCCE] text-stone-700 focus:border-[#2C5E3B]'
                    }`}
                >
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                </select>

                {/* Tree Expand/Collapse All (Tree mode only) */}
                {viewMode === 'tree' && (
                    <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-800 pl-2">
                        {onExpandAll && (
                            <button
                                type="button"
                                onClick={onExpandAll}
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-[#2C4D35] hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                                title="Expand All Branches"
                            >
                                <ChevronsUpDown size={15} />
                            </button>
                        )}
                        {onCollapseAll && (
                            <button
                                type="button"
                                onClick={onCollapseAll}
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-[#2C4D35] hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                                title="Collapse All Branches"
                            >
                                <ChevronsDownUp size={15} />
                            </button>
                        )}
                    </div>
                )}

                {/* Print button */}
                {onPrint && (
                    <button
                        type="button"
                        onClick={onPrint}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-[#2C4D35] hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                        title="Print Org Chart"
                    >
                        <Printer size={15} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrgChartToolbar;
