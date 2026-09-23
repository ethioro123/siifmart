import React from 'react';
import { Employee, Site } from '../../../types';
import { OrgChartFilterState, DEPT_COLORS, ROLE_LABELS } from '../types';
import { getRoleDept, getRoleRank } from '../hooks/useOrgTreeLayout';
import { MapPin, Users, Award, ChevronRight, UserPlus, ExternalLink, CreditCard, FilterX } from 'lucide-react';

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

    // All active departments including custom company departments
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

        // Sort employees inside each department by exact role hierarchy rank, then alphabetically by name
        map.forEach((list) => {
            list.sort((a, b) => {
                const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
                if (rankDiff !== 0) return rankDiff;
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        return map;
    }, [filteredEmployees, departments]);

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
        <div className="w-full h-full overflow-y-auto space-y-6 pr-1 pb-12">
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
                                {deptEmps.map(emp => {
                                    const siteName = siteMap.get(emp.siteId || emp.site_id || '') || 'All Sites';
                                    const roleTitle = ROLE_LABELS[emp.role] || emp.role;
                                    const avatar = emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=2C5E3B&color=EAE5D9&size=96`;

                                    const isOnline = onlineIds ? onlineIds.has(emp.id) : false;

                                    return (
                                        <div
                                            key={emp.id}
                                            onClick={() => onSelectEmployee(emp)}
                                            className={`group relative p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                                                isDark
                                                    ? 'bg-[#1E2822] hover:bg-[#25322A] border-[#2C4D35] text-[#FAF8F5]'
                                                    : 'bg-[#FAF8F5] hover:bg-white border-[#E2DCCE] text-[#1E3F27] hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="relative shrink-0">
                                                <img
                                                    src={avatar}
                                                    alt={emp.name}
                                                    className="w-11 h-11 rounded-full object-cover border border-[#2C5E3B]/20"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=2C5E3B&color=EAE5D9&size=96`;
                                                    }}
                                                />
                                                <div
                                                    title={isOnline ? 'Online now' : 'Offline'}
                                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1E2822] transition-colors duration-500 ${
                                                        isOnline
                                                            ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)] animate-pulse'
                                                            : 'bg-stone-300 dark:bg-stone-600'
                                                    }`}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="font-bold text-xs truncate group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                                        {emp.name}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {emp.status === 'On Leave' && (
                                                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                Leave
                                                            </span>
                                                        )}
                                                        {emp.code && (
                                                            <span className="text-[9px] font-mono px-1 py-0.5 rounded font-semibold bg-black/5 dark:bg-black/30 text-stone-500">
                                                                {emp.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-[11px] font-medium text-stone-600 dark:text-stone-300 truncate mt-0.5">
                                                    {roleTitle}
                                                </p>

                                                <div className="flex items-center justify-between gap-1 text-[10px] text-stone-400 dark:text-stone-500 mt-1 truncate">
                                                    <span className="flex items-center gap-1 truncate">
                                                        <MapPin size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                                        <span className="truncate">{siteName}</span>
                                                    </span>

                                                    {/* Quick Action Icons on hover */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {onOpenIdCard && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onOpenIdCard(emp);
                                                                }}
                                                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors"
                                                                title="View ID Badge"
                                                            >
                                                                <CreditCard size={12} />
                                                            </button>
                                                        )}
                                                        {onOpenProfile && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onOpenProfile(emp);
                                                                }}
                                                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors"
                                                                title="Open Full Profile & Edit"
                                                            >
                                                                <ExternalLink size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                        </div>
                                    );
                                })}
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
    );
};

export default OrgMatrixView;
