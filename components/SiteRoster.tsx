import React, { useMemo } from 'react';
import {
    Users, User, Award, TrendingUp
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { useRoster } from '../contexts/RosterContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SiteRosterProps {
    layout?: 'grid' | 'list';
    limit?: number;
    highlightUser?: string;
    className?: string;
}

export default function SiteRoster({
    layout = 'grid',
    limit,
    highlightUser,
    className = ""
}: SiteRosterProps) {
    const { employees, activeSite } = useData();
    const { getWorkerPoints } = useGamification();
    const { schedules } = useRoster();
    const { t } = useLanguage();

    const siteEmployees = useMemo(() => {
        if (!activeSite) return [];
        return employees.filter(e => e.siteId === activeSite.id || (e as any).site_id === activeSite.id);
    }, [employees, activeSite]);

    const sortedEmployees = useMemo(() => {
        return siteEmployees.map(emp => {
            const points = getWorkerPoints(emp.id);
            return {
                ...emp,
                points: points?.totalPoints || 0,
                weeklyPoints: points?.weeklyPoints || 0,
                level: points?.level || 1,
                levelTitle: points?.levelTitle || 'Rookie',
                rank: points?.rank || 0,
                isRostered: schedules.some(s => s.employeeId === emp.id && s.date === new Date().toISOString().split('T')[0] && s.status !== 'Cancelled' && (s.siteId === activeSite?.id || !s.siteId))
            };
        }).sort((a, b) => b.points - a.points);
    }, [siteEmployees, getWorkerPoints, schedules, activeSite]);

    const displayEmployees = limit ? sortedEmployees.slice(0, limit) : sortedEmployees;

    if (!activeSite) return null;

    const siteTypeLabel = activeSite.type === 'Warehouse' || activeSite.type === 'Distribution Center'
        ? 'Warehouse Facility'
        : activeSite.type === 'Store'
            ? 'Store Location'
            : 'Operations Node';

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                            Site Personnel Roster
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {siteEmployees.length} Total Staff Stationed at {activeSite.name || siteTypeLabel}
                        </p>
                    </div>
                </div>

                <div className="flex -space-x-2.5">
                    {displayEmployees.slice(0, 5).map((e) => (
                        <div key={e.id} className="w-8 h-8 rounded-full border-2 border-[var(--theme-bg-card)] bg-[var(--theme-bg-subtle)] flex items-center justify-center overflow-hidden shadow-xs">
                            {e.avatar ? (
                                <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={14} className="text-[var(--theme-text-secondary)]" />
                            )}
                        </div>
                    ))}
                    {siteEmployees.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--theme-bg-card)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] flex items-center justify-center text-[10px] font-semibold shadow-xs">
                            +{siteEmployees.length - 5}
                        </div>
                    )}
                </div>
            </div>

            <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2.5"}>
                {displayEmployees.map((emp) => {
                    const isHighlighted = emp.id === highlightUser;

                    return (
                        <div
                            key={emp.id}
                            className={`
                                relative overflow-hidden group transition-all rounded-2xl border
                                ${isHighlighted
                                    ? 'bg-[var(--theme-bg-card)] border-[var(--theme-border-focus)] dark:border-[var(--theme-border-focus)] ring-2 ring-[var(--theme-accent)]/20 shadow-sm'
                                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xs hover:border-[var(--theme-border-focus)]/30'}
                                ${layout === 'grid' ? 'p-4 sm:p-5' : 'p-3.5 flex items-center gap-3.5'}
                            `}
                        >
                            {/* Grid Layout Card */}
                            {layout === 'grid' && (
                                <>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden">
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} className="text-[var(--theme-text-secondary)]" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[var(--theme-accent)] text-[var(--theme-text-primary)] text-[9px] font-semibold">
                                                L{emp.level}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1">
                                                {emp.isRostered && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)]">
                                                        On Duty
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    emp.status === 'Active'
                                                        ? 'bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)] dark:text-[var(--theme-status-success-text)]'
                                                        : 'bg-[var(--theme-status-warning-bg)]/10 text-[var(--theme-status-warning-text)] dark:text-[var(--theme-status-warning-text)]'
                                                }`}>
                                                    {emp.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] capitalize">
                                                {emp.role.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{emp.name}</h4>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{emp.levelTitle}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-center">
                                            <p className="text-[10px] text-[var(--theme-text-secondary)]">Accuracy</p>
                                            <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{(emp as any).performanceScore || 100}%</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-center">
                                            <p className="text-[10px] text-[var(--theme-text-secondary)]">Weekly</p>
                                            <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{emp.weeklyPoints.toLocaleString()} PTS</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[var(--theme-border)]">
                                        <div className="flex gap-1 items-center">
                                            {(emp.badges && emp.badges.length > 0) ? (
                                                emp.badges.slice(0, 3).map((b, i) => (
                                                    <div key={i} className="w-5 h-5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[10px]">
                                                        <Award size={11} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="w-5 h-5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center opacity-40">
                                                    <Award size={11} />
                                                </div>
                                            )}
                                        </div>
                                        {emp.rank > 0 && emp.rank <= 3 && (
                                            <div className="flex items-center gap-1 text-[var(--theme-status-warning-text)] dark:text-[var(--theme-status-warning-text)] font-semibold text-[11px]">
                                                <TrendingUp size={12} />
                                                Rank #{emp.rank}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* List Layout Component */}
                            {layout === 'list' && (
                                <>
                                    <div className="relative shrink-0">
                                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden">
                                            {emp.avatar ? (
                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} className="text-[var(--theme-text-secondary)]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{emp.name}</h4>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] capitalize mt-0.5">
                                            {emp.role.replace('_', ' ')} • {emp.levelTitle}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{emp.weeklyPoints.toLocaleString()} PTS</p>
                                        <p className="text-[10px] text-[var(--theme-text-secondary)]">Weekly</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-1">
                                        {emp.isRostered && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)]">
                                                On Duty
                                            </span>
                                        )}
                                        <span className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-[var(--theme-status-success-bg)]' : 'bg-[var(--theme-status-warning-bg)]'}`} />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
