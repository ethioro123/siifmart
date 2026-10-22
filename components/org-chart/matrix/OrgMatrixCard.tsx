import React from 'react';
import { Employee } from '../../../types';
import { getRoleReportingMeta, HIERARCHY_LEVEL_CONFIGS } from '../hooks/orgReportingLines';
import { MapPin, Users, CreditCard, ExternalLink, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { getEmployeeJobTitle } from '../../../utils/roles';

interface OrgMatrixCardProps {
    employee: Employee;
    allEmployees: Employee[];
    siteName: string;
    isDark: boolean;
    isOnline: boolean;
    onSelectEmployee: (employee: Employee) => void;
    onOpenProfile?: (employee: Employee) => void;
    onOpenIdCard?: (employee: Employee) => void;
}

export const OrgMatrixCard: React.FC<OrgMatrixCardProps> = ({
    employee,
    allEmployees,
    siteName,
    isDark,
    isOnline,
    onSelectEmployee,
    onOpenProfile,
    onOpenIdCard
}) => {
    const roleKey = employee.role || 'pos';
    const roleTitle = getEmployeeJobTitle(employee);
    const meta = getRoleReportingMeta(roleKey);
    const levelConfig = HIERARCHY_LEVEL_CONFIGS[meta.level];

    const primaryManager = allEmployees.find(item => item.id === (employee.reportsToEmployeeId || employee.reports_to_employee_id));
    const functionalManager = allEmployees.find(item => item.id === (employee.functionalManagerEmployeeId || employee.functional_manager_employee_id));
    const avatar = employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=96`;

    return (
        <div
            onClick={() => onSelectEmployee(employee)}
            className={`group relative p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                isDark
                    ? 'bg-[#1E2822] hover:bg-[#25322A] border-[#2C4D35] text-[#FAF8F5] hover:border-[#3d6b49]'
                    : 'bg-[#FAF8F5] hover:bg-white border-[#E2DCCE] text-[#1E3F27] hover:border-[#2C5E3B]/30 hover:shadow-md'
            }`}
        >
            {/* Top row: Avatar, Info & Quick Actions */}
            <div>
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <img
                            src={avatar}
                            alt={employee.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#2C5E3B]/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=96`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1E2822] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                                    : 'bg-stone-300 dark:bg-stone-600'
                            }`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                {employee.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {employee.status === 'On Leave' && (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        Leave
                                    </span>
                                )}
                                {employee.code && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold bg-black/5 dark:bg-black/30 text-stone-500">
                                        {formatDisplayEmployeeId(employee)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Role & Hierarchy Tag */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300 truncate">
                                {roleTitle}
                            </span>
                            <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-full tracking-wider"
                                style={{
                                    backgroundColor: isDark ? levelConfig.bgDark : levelConfig.bgLight,
                                    color: levelConfig.color,
                                    border: `1px solid ${isDark ? levelConfig.borderDark : levelConfig.borderLight}`
                                }}
                            >
                                {meta.levelTag}
                            </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500 mt-1 truncate">
                            <MapPin size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                            <span className="truncate">{siteName}</span>
                        </div>
                    </div>
                </div>

                {/* Reporting Line Badges */}
                <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 space-y-1.5 text-[10px]">
                    {/* Solid Line Reporting */}
                    <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold shrink-0">↳</span>
                        <span className="text-stone-400 shrink-0">Reports to:</span>
                        <span className="font-semibold truncate text-[#1E3F27] dark:text-[#EAE5D9]">
                            {primaryManager ? primaryManager.name : (employee.reportsToEmployeeId || employee.reports_to_employee_id) ? 'Manager unavailable in current view' : `Unassigned · expected ${meta.reportsToLabel}`}
                        </span>
                    </div>

                    {/* Dotted Line Functional Compliance (if applicable) */}
                    {(functionalManager || employee.functionalManagerEmployeeId || employee.functional_manager_employee_id || meta.dottedLineLabel) && (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300/90">
                            <span className="font-bold shrink-0">⤑</span>
                            <span className="text-stone-400 shrink-0">Functional:</span>
                            <span className="font-medium truncate">
                                {functionalManager ? functionalManager.name : (employee.functionalManagerEmployeeId || employee.functional_manager_employee_id) ? 'Manager unavailable in current view' : `Expected role: ${meta.dottedLineLabel}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer: Span & Hover Actions */}
            <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-stone-400 border-t border-dashed border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                    {meta.isManagerial && meta.managesRoles.length > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 px-1.5 py-0.5 rounded">
                            <Users size={11} />
                            <span>Span: {meta.managesRoles.length} roles</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-stone-400">
                            <ShieldCheck size={11} className="text-sky-500" />
                            <span>Frontline Operator</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* Hover actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onOpenIdCard && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenIdCard(employee);
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
                                    onOpenProfile(employee);
                                }}
                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors"
                                title="Open Full Profile & Edit"
                            >
                                <ExternalLink size={12} />
                            </button>
                        )}
                    </div>
                    <ChevronRight size={13} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
};
