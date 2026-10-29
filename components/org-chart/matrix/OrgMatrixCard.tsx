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
    const roleKey = employee.role || 'cashier';
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
                'bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:shadow-md'
            }`}
        >
            {/* Top row: Avatar, Info & Quick Actions */}
            <div>
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <img
                            src={avatar}
                            alt={employee.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[var(--theme-border)]/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=96`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-border)] dark:border-[var(--theme-border)] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-[var(--theme-status-success)] animate-pulse'
                                    : 'bg-[var(--theme-bg-card-hover)] bg-[var(--theme-bg-card-hover)]'
                            }`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate group-hover:text-[var(--theme-primary)] dark:group-hover:text-[var(--theme-text-secondary)] transition-colors">
                                {employee.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {employee.status === 'On Leave' && (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                        Leave
                                    </span>
                                )}
                                {employee.code && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] text-[var(--theme-text-secondary)]">
                                        {formatDisplayEmployeeId(employee)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Role & Hierarchy Tag */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-medium text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] truncate">
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
                        <div className="flex items-center gap-1 text-[10px] text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] mt-1 truncate">
                            <MapPin size={10} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shrink-0" />
                            <span className="truncate">{siteName}</span>
                        </div>
                    </div>
                </div>

                {/* Reporting Line Badges */}
                <div className="mt-3 pt-2.5 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] space-y-1.5 text-[10px]">
                    {/* Solid Line Reporting */}
                    <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                        <span className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-bold shrink-0">↳</span>
                        <span className="text-[var(--theme-text-muted)] shrink-0">Reports to:</span>
                        <span className="font-semibold truncate text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                            {primaryManager ? primaryManager.name : (employee.reportsToEmployeeId || employee.reports_to_employee_id) ? 'Manager unavailable in current view' : `Unassigned · expected ${meta.reportsToLabel}`}
                        </span>
                    </div>

                    {/* Dotted Line Functional Compliance (if applicable) */}
                    {(functionalManager || employee.functionalManagerEmployeeId || employee.functional_manager_employee_id || meta.dottedLineLabel) && (
                        <div className="flex items-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                            <span className="font-bold shrink-0">⤑</span>
                            <span className="text-[var(--theme-text-muted)] shrink-0">Functional:</span>
                            <span className="font-medium truncate">
                                {functionalManager ? functionalManager.name : (employee.functionalManagerEmployeeId || employee.functional_manager_employee_id) ? 'Manager unavailable in current view' : `Expected role: ${meta.dottedLineLabel}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer: Span & Hover Actions */}
            <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-[var(--theme-text-muted)] border-t border-dashed border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                <div className="flex items-center gap-1.5">
                    {meta.isManagerial && meta.managesRoles.length > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary)]/20 px-1.5 py-0.5 rounded">
                            <Users size={11} />
                            <span>Span: {meta.managesRoles.length} roles</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[var(--theme-text-muted)]">
                            <ShieldCheck size={11} className="text-[var(--theme-status-info-text)]" />
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
                                className="p-1 rounded hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] dark:hover:text-[var(--theme-text-secondary)] transition-colors"
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
                                className="p-1 rounded hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] dark:hover:text-[var(--theme-text-secondary)] transition-colors"
                                title="Open Full Profile & Edit"
                            >
                                <ExternalLink size={12} />
                            </button>
                        )}
                    </div>
                    <ChevronRight size={13} className="text-[var(--theme-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
};
