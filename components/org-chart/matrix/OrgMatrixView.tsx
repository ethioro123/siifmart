import React, { useState, useMemo } from 'react';
import { Employee, Site } from '../../../types';
import { OrgChartFilterState, DEPT_COLORS, ROLE_LABELS } from '../types';
import { getRoleDept, getRoleRank } from '../hooks/useOrgTreeLayout';
import { getRoleReportingMeta, HIERARCHY_LEVEL_CONFIGS } from '../hooks/orgReportingLines';
import {
    FilterX,
    UserPlus,
    Layers,
    Shield,
    MapPin,
    ChevronsUpDown,
    ChevronsDownUp
} from 'lucide-react';
import { OrgMatrixGuide } from './OrgMatrixGuide';
import { OrgMatrixKPIs } from './OrgMatrixKPIs';
import { OrgMatrixSwimlane } from './OrgMatrixSwimlane';
import { getDeptIcon, getTierIcon, STANDARD_DEPTS } from './orgMatrixIcons';

interface OrgMatrixViewProps {
    employees: Employee[];
    sites?: Site[];
    filters: OrgChartFilterState;
    setFilters?: React.Dispatch<React.SetStateAction<OrgChartFilterState>>;
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
    const [groupBy, setGroupBy] = useState<'department' | 'level' | 'site'>('department');
    const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

    const siteMap = useMemo(() => {
        const m = new Map<string, string>();
        sites.forEach(s => m.set(s.id, s.name));
        return m;
    }, [sites]);

    // Filter employees according to filter state
    const filteredEmployees = useMemo(() => {
        // Selective loading: initially only load managers and level 1 & 2 & 3.
        // When user filters for a facility/store/warehouse or searches, bring up all employees at that location.
        const isLocationFiltered = Boolean(filters.siteId && filters.siteId !== 'All');
        const isSearchActive = Boolean(filters.searchTerm && filters.searchTerm.trim() !== '');
        const isSpecificTier = Boolean(filters.hierarchyLevel);
        const onlyManagers = !isLocationFiltered && !isSearchActive && !isSpecificTier;

        return employees.filter(emp => {
            const role = emp.role || 'cashier';
            const dept = getRoleDept(role, emp.department);
            const siteId = emp.siteId || emp.site_id;
            const meta = getRoleReportingMeta(role);

            if (onlyManagers && meta.level > 8) return false;
            if (filters.siteId && siteId !== filters.siteId) return false;
            if (filters.department && dept !== filters.department) return false;
            if (filters.status && emp.status !== filters.status) return false;
            if (filters.hierarchyLevel && meta.level !== filters.hierarchyLevel) return false;

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
    const departments = useMemo(() => {
        const set = new Set(STANDARD_DEPTS.map(d => d.key));
        const extra: { key: string; label: string }[] = [];
        filteredEmployees.forEach(e => {
            const d = getRoleDept(e.role, e.department);
            if (!set.has(d)) {
                set.add(d);
                extra.push({
                    key: d,
                    label: d.charAt(0).toUpperCase() + d.slice(1)
                });
            }
        });
        return [...STANDARD_DEPTS, ...extra];
    }, [filteredEmployees]);

    // Group employees by department
    const deptGroups = useMemo(() => {
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

    // Group employees by hierarchy level (L1 to L10)
    const levelGroups = useMemo(() => {
        const map = new Map<number, Employee[]>();
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(l => map.set(l, []));

        filteredEmployees.forEach(emp => {
            const meta = getRoleReportingMeta(emp.role || 'cashier');
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

    // Group employees by site / location
    const siteGroups = useMemo(() => {
        const map = new Map<string, Employee[]>();
        sites.forEach(s => map.set(s.id, []));
        map.set('unassigned', []);

        filteredEmployees.forEach(emp => {
            const sId = emp.siteId || emp.site_id || 'unassigned';
            const list = map.get(sId) || [];
            list.push(emp);
            map.set(sId, list);
        });

        map.forEach((list) => {
            list.sort((a, b) => {
                const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
                if (rankDiff !== 0) return rankDiff;
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        return map;
    }, [filteredEmployees, sites]);

    // Executive Metrics KPI calculation
    const metrics = useMemo(() => {
        const total = filteredEmployees.length;
        const active = filteredEmployees.filter(e => e.status === 'Active').length;
        const onLeave = filteredEmployees.filter(e => e.status === 'On Leave').length;
        let l1 = 0, l2 = 0, l3 = 0, l4 = 0;

        filteredEmployees.forEach(e => {
            const meta = getRoleReportingMeta(e.role || 'cashier');
            if (meta.level <= 2) l1++;
            else if (meta.level <= 5) l2++;
            else if (meta.level <= 8) l3++;
            else l4++;
        });

        return { total, active, onLeave, l1, l2, l3, l4 };
    }, [filteredEmployees]);

    const toggleSwimlane = (key: string) => {
        setCollapsedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleExpandAll = () => setCollapsedKeys(new Set());
    const handleCollapseAll = () => {
        if (groupBy === 'department') setCollapsedKeys(new Set(departments.map(d => d.key)));
        else if (groupBy === 'level') setCollapsedKeys(new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));
        else setCollapsedKeys(new Set([...sites.map(s => s.id), 'unassigned']));
    };

    const hasActiveFilters = Boolean(
        filters.searchTerm ||
        filters.siteId ||
        filters.department ||
        filters.status ||
        filters.hierarchyLevel
    );

    if (filteredEmployees.length === 0) {
        return (
            <div className={`w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border text-center ${
                isDark ? 'bg-[#18201B] border-[#2C4D35] text-stone-300' : 'bg-white border-[#E2DCCE] text-stone-600'
            }`}>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                    <FilterX size={28} />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
                    No Matrix Personnel Found
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4">
                    No active personnel match your current filter parameters. Try clearing your search keyword, site selection, or hierarchy level.
                </p>
                {hasActiveFilters && onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2C5E3B] hover:bg-[#1E3F27] text-white shadow-sm transition-all cursor-pointer"
                    >
                        Reset All Matrix Filters
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto pr-1 pb-12 space-y-4">
            {/* Top Governance & Chain-of-Command Guide */}
            <OrgMatrixGuide isDark={isDark} />

            {/* Matrix Executive Summary Strip */}
            <OrgMatrixKPIs metrics={metrics} isDark={isDark} />

            {/* Matrix View Toolbar: Grouping Switch & Fold Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Matrix Dimension:
                    </span>
                    <div className={`flex items-center p-0.5 rounded-xl border ${
                        isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-[#FAF8F5] border-[#E2DCCE]'
                    }`}>
                        <button
                            type="button"
                            onClick={() => setGroupBy('department')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                groupBy === 'department'
                                    ? 'bg-[#2C5E3B] text-white shadow-xs'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                        >
                            <Layers size={13} />
                            <span>Departments</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroupBy('level')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                groupBy === 'level'
                                    ? 'bg-[#2C5E3B] text-white shadow-xs'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                        >
                            <Shield size={13} />
                            <span>Hierarchy Tiers (L1-L10)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroupBy('site')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                groupBy === 'site'
                                    ? 'bg-[#2C5E3B] text-white shadow-xs'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                        >
                            <MapPin size={13} />
                            <span>Facilities</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={collapsedKeys.size > 0 ? handleExpandAll : handleCollapseAll}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#1E2822] hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                        title={collapsedKeys.size > 0 ? 'Expand all swimlanes' : 'Collapse all swimlanes'}
                    >
                        {collapsedKeys.size > 0 ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
                        <span>{collapsedKeys.size > 0 ? 'Expand All' : 'Collapse All'}</span>
                    </button>
                </div>
            </div>

            {/* Department Swimlanes Grouping */}
            {groupBy === 'department' && (
                <div className="space-y-4">
                    {departments.map(dept => {
                        const deptEmps = deptGroups.get(dept.key) || [];
                        if (deptEmps.length === 0 && filters.department && filters.department !== dept.key) {
                            return null;
                        }

                        const colors = DEPT_COLORS[dept.key] || DEPT_COLORS.support;

                        return (
                            <OrgMatrixSwimlane
                                key={dept.key}
                                id={dept.key}
                                title={dept.label}
                                count={deptEmps.length}
                                activeCount={deptEmps.filter(e => e.status === 'Active').length}
                                icon={
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{
                                            backgroundColor: isDark ? colors.bgDark : colors.bg,
                                            color: isDark ? colors.textDark : colors.text,
                                            border: `1px solid ${isDark ? colors.borderDark : colors.border}`
                                        }}
                                    >
                                        {getDeptIcon(dept.key, 17)}
                                    </div>
                                }
                                isCollapsed={collapsedKeys.has(dept.key)}
                                onToggle={() => toggleSwimlane(dept.key)}
                                isDark={isDark}
                                action={
                                    onOpenAddEmployee ? (
                                        <button
                                            type="button"
                                            onClick={onOpenAddEmployee}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 transition-colors cursor-pointer"
                                            title={`Add new member to ${dept.label}`}
                                        >
                                            <UserPlus size={13} />
                                            <span>Add Member</span>
                                        </button>
                                    ) : null
                                }
                                employees={deptEmps}
                                allEmployees={employees}
                                siteMap={siteMap}
                                onlineIds={onlineIds}
                                onSelectEmployee={onSelectEmployee}
                                onOpenProfile={onOpenProfile}
                                onOpenIdCard={onOpenIdCard}
                                emptyMessage="No employees assigned to this department matching current filter criteria."
                            />
                        );
                    })}
                </div>
            )}

            {/* Hierarchy Level Grouping (L1 to L10) */}
            {groupBy === 'level' && (
                <div className="space-y-4">
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(lvl => {
                        const levelEmps = levelGroups.get(lvl) || [];
                        const cfg = HIERARCHY_LEVEL_CONFIGS[lvl];

                        return (
                            <OrgMatrixSwimlane
                                key={lvl}
                                id={String(lvl)}
                                title={cfg.title}
                                subtitle={`${cfg.subtitle} • ${levelEmps.length} appointed (${levelEmps.filter(e => e.status === 'Active').length} active)`}
                                count={levelEmps.length}
                                badge={
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: isDark ? cfg.bgDark : cfg.bgLight,
                                            color: cfg.color,
                                            border: `1px solid ${isDark ? cfg.borderDark : cfg.borderLight}`
                                        }}
                                    >
                                        {cfg.badge}
                                    </span>
                                }
                                icon={
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{
                                            backgroundColor: isDark ? cfg.bgDark : cfg.bgLight,
                                            color: cfg.color,
                                            border: `1px solid ${isDark ? cfg.borderDark : cfg.borderLight}`
                                        }}
                                    >
                                        {getTierIcon(lvl, 17)}
                                    </div>
                                }
                                isCollapsed={collapsedKeys.has(String(lvl))}
                                onToggle={() => toggleSwimlane(String(lvl))}
                                isDark={isDark}
                                employees={levelEmps}
                                allEmployees={employees}
                                siteMap={siteMap}
                                onlineIds={onlineIds}
                                onSelectEmployee={onSelectEmployee}
                                onOpenProfile={onOpenProfile}
                                emptyMessage={
                                    lvl >= 9 && !filters.siteId && !filters.searchTerm.trim()
                                        ? "Frontline staff hidden by default to minimize egress. Filter by Facility or search in toolbar to load frontline personnel."
                                        : "No active personnel positioned at this hierarchy tier matching current filters."
                                }
                            />
                        );
                    })}
                </div>
            )}

            {/* Facility / Site Grouping */}
            {groupBy === 'site' && (
                <div className="space-y-4">
                    {Array.from(siteGroups.entries()).map(([siteId, siteEmps]) => {
                        if (siteEmps.length === 0 && filters.siteId && filters.siteId !== siteId) {
                            return null;
                        }

                        const siteObj = sites.find(s => s.id === siteId);
                        const siteLabel = siteObj ? siteObj.name : 'Central Headquarters / Enterprise Shared';

                        return (
                            <OrgMatrixSwimlane
                                key={siteId}
                                id={siteId}
                                title={siteLabel}
                                subtitle={`${siteEmps.filter(e => e.status === 'Active').length} active personnel`}
                                count={siteEmps.length}
                                icon={
                                    <div className="w-9 h-9 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 flex items-center justify-center shrink-0">
                                        <MapPin size={17} />
                                    </div>
                                }
                                isCollapsed={collapsedKeys.has(siteId)}
                                onToggle={() => toggleSwimlane(siteId)}
                                isDark={isDark}
                                employees={siteEmps}
                                allEmployees={employees}
                                siteMap={siteMap}
                                onlineIds={onlineIds}
                                onSelectEmployee={onSelectEmployee}
                                onOpenProfile={onOpenProfile}
                                onOpenIdCard={onOpenIdCard}
                                emptyMessage="No personnel assigned to this facility matching current filters."
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrgMatrixView;
