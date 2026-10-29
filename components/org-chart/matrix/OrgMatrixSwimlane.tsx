import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Employee } from '../../../types';
import { OrgMatrixCard } from './OrgMatrixCard';

interface OrgMatrixSwimlaneProps {
    id: string;
    title: string;
    subtitle?: string;
    count: number;
    activeCount?: number;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    isCollapsed: boolean;
    onToggle: () => void;
    isDark: boolean;
    action?: React.ReactNode;
    employees: Employee[];
    allEmployees: Employee[];
    siteMap: Map<string, string>;
    onlineIds?: Set<string>;
    onSelectEmployee: (employee: Employee) => void;
    onOpenProfile?: (employee: Employee) => void;
    onOpenIdCard?: (employee: Employee) => void;
    emptyMessage?: string;
}

export const OrgMatrixSwimlane: React.FC<OrgMatrixSwimlaneProps> = ({
    id: _id,
    title,
    subtitle,
    count,
    activeCount,
    icon,
    badge,
    isCollapsed,
    onToggle,
    isDark,
    action,
    employees,
    allEmployees,
    siteMap,
    onlineIds,
    onSelectEmployee,
    onOpenProfile,
    onOpenIdCard,
    emptyMessage = 'No personnel found matching current filter criteria.'
}) => {
    return (
        <div
            className={`rounded-2xl border transition-all ${
                'bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xs'
            }`}
        >
            {/* Swimlane Header */}
            <div
                onClick={onToggle}
                className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer select-none border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]"
            >
                <div className="flex items-center gap-3">
                    <div className="shrink-0">{icon}</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">
                                {title}
                            </h3>
                            {badge}
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] text-[var(--theme-text-secondary)]">
                                {count}
                            </span>
                        </div>
                        {subtitle ? (
                            <p className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                {subtitle}
                            </p>
                        ) : activeCount !== undefined ? (
                            <p className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                {activeCount} active on-duty
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {action}
                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-muted)]"
                        aria-label={`Toggle ${title} swimlane`}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Swimlane Body / Personnel Grid */}
            {!isCollapsed && (
                <div className="p-4">
                    {employees.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                            {employees.map(emp => (
                                <OrgMatrixCard
                                    key={emp.id}
                                    employee={emp}
                                    allEmployees={allEmployees}
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
                        <p className="text-xs text-[var(--theme-text-muted)] italic py-2">
                            {emptyMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
