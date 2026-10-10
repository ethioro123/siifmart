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
                isDark ? 'bg-[#18201B] border-[#2C4D35]' : 'bg-white border-[#E2DCCE] shadow-xs'
            }`}
        >
            {/* Swimlane Header */}
            <div
                onClick={onToggle}
                className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer select-none border-b border-black/5 dark:border-white/5"
            >
                <div className="flex items-center gap-3">
                    <div className="shrink-0">{icon}</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                                {title}
                            </h3>
                            {badge}
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-stone-500">
                                {count}
                            </span>
                        </div>
                        {subtitle ? (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                {subtitle}
                            </p>
                        ) : activeCount !== undefined ? (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
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
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
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
                            {emptyMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
