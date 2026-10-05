import React from 'react';
import { Employee, Site } from '../../../types';
import { OrgChartFilterState, DEPT_COLORS, ROLE_LABELS } from '../types';
import { getRoleDept, getRoleRank } from '../hooks/useOrgTreeLayout';
import { getRoleReportingMeta, HIERARCHY_LEVEL_CONFIGS } from '../hooks/orgReportingLines';
import { FilterX, UserPlus, Layers, Network } from 'lucide-react';
import { OrgMatrixCard } from './OrgMatrixCard';
import { OrgMatrixGuide } from './OrgMatrixGuide';

interface OrgMatrixViewProps {
    employees: Employee[];
    sites?: Site[];
    filters: OrgChartFilterState;
    isDark: boolean;
    onlineIds?: Set<string>;
    onSelectEmployee: (employee: Employee) => void;
    onOpenProfile?: (employee: Employee) => void;
    onOpenIdCard?: (employee: Employee) => void;
    onOpenAddEmployee?: () => void;
    onResetFilters?: () => void;
}

export const OrgMatrixView: React.FC<OrgMatrixViewProps> = ({
    employees,
    sites = [],
    filters,
    isDark,
    onlineIds,
    onSelectEmployee,
    onOpenProfile,
    onOpenIdCard,
    onOpenAddEmployee,
    onResetFilters
}) => {
    const [groupBy, setGroupBy] = React.useState<'department' | 'level'>('department');

    const siteMap = React.useMemo(() => {
        const m = new Map<string, string>();
        sites.forEach(s => m.set(s.id, s.name));
        return m;
    }, [sites]);

    const standardDepts = [
        { key: 'executive', label: 'Executive Leadership', icon: '👑' },
        { key: 'store', label: 'Store Operations', icon: '🏪' },
        { key: 'warehouse', label: 'Warehouse & Logistics', icon: '📦' },
        { key: 'finance', label: 'Finance & Accounts', icon: '💰' },
        { key: 'hr', label: 'Human Resources', icon: '👥' },
        { key: 'procurement', label: 'Procurement & Supply', icon: '🔗' },
        { key: 'support', label: 'IT & Loss Prevention', icon: '🛠️' },
    ];

    // Filter employees according to filter state
    const filteredEmployees = React.useMemo(() => {
        return employees.filter(emp => {
            const role = emp.role || 'pos';
            const dept = getRoleDept(role, emp.department);
            const siteId = emp.siteId || emp.site_id;

            if (filters.siteId && siteId !== filters.siteId) return false;
            if (filters.department && dept !== filters.department) return false;
            if (filters.status && emp.status !== filters.status) return false;

            if (filters.searchTerm.trim()) {
                const q = filters.searchTerm.trim().toLowerCase();
                const matchName = emp.name?.toLowerCase().includes(q);
                const matchRole = emp.role?.toLowerCase().includes(q) || (ROLE_LABELS[emp.role] || '').toLowerCase().includes(q);
                const matchCode = emp.code?.toLowerCase().includes(q);
                if (!matchName && !matchRole && !matchCode) return false;
            }

            return true;
        });
    }, [employees, filters]);

    // Active departments including dynamic custom departments
    const departments = React.useMemo(() => {
        const set = new Set(standardDepts.map(d => d.key));
        const extra: { key: string; label: string; icon: string }[] = [];
        filteredEmployees.forEach(e => {
            const d = getRoleDept(e.role, e.department);
            if (!set.has(d)) {
                set.add(d);
                extra.push({
                    key: d,
                    label: d.charAt(0).toUpperCase() + d.slice(1),
                    icon: '📁'
                });
            }
        });
        return [...standardDepts, ...extra];
    }, [filteredEmployees]);

    // Group employees by department
    const deptGroups = React.useMemo(() => {
        const map = new Map<string, Employee[]>();
        departments.forEach(d => map.set(d.key, []));

        filteredEmployees.forEach(emp => {
            const dept = getRoleDept(emp.role, emp.department);
            const list = map.get(dept) || [];
            list.push(emp);
            map.set(dept, list);
        });

        // Sort employees by hierarchy rank, then name
        map.forEach((list) => {
            list.sort((a, b) => {
                const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
                if (rankDiff !== 0) return rankDiff;
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        return map;
    }, [filteredEmployees, departments]);

    // Group employees by hierarchy level (L1 to L4)
    const levelGroups = React.useMemo(() => {
        const map = new Map<number, Employee[]>();
        [1, 2, 3, 4].forEach(l => map.set(l, []));

        filteredEmployees.forEach(emp => {
            const meta = getRoleReportingMeta(emp.role || 'pos');
            const list = map.get(meta.level) || [];
            list.push(emp);
            map.set(meta.level, list);
        });

        map.forEach((list) => {
            list.sort((a, b) => {
                const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
                if (rankDiff !== 0) return rankDiff;
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        return map;
    }, [filteredEmployees]);

    const hasActiveFilters = Boolean(filters.searchTerm || filters.siteId || filters.department || filters.status);

    if (filteredEmployees.length === 0) {
        return (
            <div className={`w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border text-center ${
                isDark ? 'bg-[#18201B] border-[#2C4D35] text-stone-300' : 'bg-white border-[#E2DCCE] text-stone-600'
            }`}>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                    <FilterX size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1">
                    No Team Members Found
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4">
                    No active employees match your filter criteria. Try adjusting your search query, site filter, or department selection.
                </p>
                {hasActiveFilters && onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2C5E3B] hover:bg-[#1E3F27] text-white shadow-sm transition-all cursor-pointer"
                    >
                        Reset All Filters
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto pr-1 pb-12">
            {/* Top Governance & Chain-of-Command Guide */}
            <OrgMatrixGuide isDark={isDark} />

            {/* Matrix View Toolbar: Grouping Switch & Quick Count */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        Matrix Grouping:
                    </span>
                    <div className={`flex items-center p-0.5 rounded-xl border ${
                        isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-[#FAF8F5] border-[#E2DCCE]'
                    }`}>
                        <button
                            type="button"
                            onClick={() => setGroupBy('department')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                groupBy === 'department'
                                    ? 'bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                        >
                            <Layers size={13} />
                            <span>Department Swimlanes</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroupBy('level')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                groupBy === 'level'
                                    ? 'bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                        >
                            <Network size={13} />
                            <span>Hierarchy Levels (L1-L4)</span>
                        </button>
                    </div>
                </div>

                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    Showing <span className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{filteredEmployees.length}</span> staff members
                </div>
            </div>

            {/* Department Swimlanes Grouping */}
            {groupBy === 'department' && (
                <div className="space-y-6">
                    {departments.map(dept => {
                        const deptEmps = deptGroups.get(dept.key) || [];
                        if (deptEmps.length === 0 && filters.department && filters.department !== dept.key) {
                            return null;
                        }

                        const colors = DEPT_COLORS[dept.key] || DEPT_COLORS.support;

                        return (
                            <div
                                key={dept.key}
                                className={`rounded-2xl border p-5 transition-all ${
                                    isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-white border-[#E2DCCE]'
                                }`}
                            >
                                {/* Department Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">{dept.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-base text-[#1E3F27] dark:text-[#EAE5D9]">
                                                {dept.label}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                                {deptEmps.length} team {deptEmps.length === 1 ? 'member' : 'members'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {onOpenAddEmployee && (
                                            <button
                                                type="button"
                                                onClick={onOpenAddEmployee}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 transition-colors cursor-pointer"
                                                title={`Add new recruit to ${dept.label}`}
                                            >
                                                <UserPlus size={13} />
                                                <span>Add Member</span>
                                            </button>
                                        )}

                                        <span
                                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                            style={{
                                                backgroundColor: isDark ? colors.bgDark : colors.bg,
                                                color: isDark ? colors.textDark : colors.text,
                                                border: `1px solid ${isDark ? colors.borderDark : colors.border}`
                                            }}
                                        >
                                            {deptEmps.filter(e => e.status === 'Active').length} Active
                                        </span>
                                    </div>
                                </div>

                                {/* Employee Cards Grid */}
                                {deptEmps.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                        {deptEmps.map(emp => (
                                            <OrgMatrixCard
                                                key={emp.id}
                                                employee={emp}
                                                siteName={siteMap.get(emp.siteId || emp.site_id || '') || 'All Sites'}
                                                isDark={isDark}
                                                isOnline={onlineIds ? onlineIds.has(emp.id) : false}
                                                onSelectEmployee={onSelectEmployee}
                                                onOpenProfile={onOpenProfile}
                                                onOpenIdCard={onOpenIdCard}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-400 italic py-2">
                                        No employees assigned to this department matching current filters.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hierarchy Level Grouping (L1 to L4) */}
            {groupBy === 'level' && (
                <div className="space-y-6">
                    {([1, 2, 3, 4] as const).map(lvl => {
                        const levelEmps = levelGroups.get(lvl) || [];
                        const cfg = HIERARCHY_LEVEL_CONFIGS[lvl];

                        return (
                            <div
                                key={lvl}
                                className={`rounded-2xl border p-5 transition-all ${
                                    isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-white border-[#E2DCCE]'
                                }`}
                            >
                                {/* Level Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-2xl">{cfg.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-base text-[#1E3F27] dark:text-[#EAE5D9]">
                                                    {cfg.title}
                                                </h3>
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: isDark ? cfg.bgDark : cfg.bgLight,
                                                        color: cfg.color,
                                                        border: `1px solid ${isDark ? cfg.borderDark : cfg.borderLight}`
                                                    }}
                                                >
                                                    {cfg.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                {cfg.subtitle} • {levelEmps.length} appointed
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            {levelEmps.filter(e => e.status === 'Active').length} Active
                                        </span>
                                    </div>
                                </div>

                                {/* Cards Grid */}
                                {levelEmps.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                        {levelEmps.map(emp => (
                                            <OrgMatrixCard
                                                key={emp.id}
                                                employee={emp}
                                                siteName={siteMap.get(emp.siteId || emp.site_id || '') || 'All Sites'}
                                                isDark={isDark}
                                                isOnline={onlineIds ? onlineIds.has(emp.id) : false}
                                                onSelectEmployee={onSelectEmployee}
                                                onOpenProfile={onOpenProfile}
                                                onOpenIdCard={onOpenIdCard}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-400 italic py-2">
                                        No active personnel positioned at this hierarchy level matching current filters.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrgMatrixView;
