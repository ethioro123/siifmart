import React from 'react';
import { Users, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WeekDayInfo } from '../../utils/shiftPlanner';

interface ShiftCoverageBarProps {
    weekDays: WeekDayInfo[];
    dailyCoverage: { date: string; headcount: number; totalHours: number }[];
    totalWeekHours: number;
    employeeWeeklyHours: Map<string, number>;
}

export const ShiftCoverageBar: React.FC<ShiftCoverageBarProps> = ({
    weekDays,
    dailyCoverage,
    totalWeekHours,
    employeeWeeklyHours
}) => {
    // Count employees with overtime (> 40h)
    let overtimeCount = 0;
    employeeWeeklyHours.forEach(hours => {
        if (hours > 40) overtimeCount++;
    });

    const totalScheduledShifts = dailyCoverage.reduce((sum, d) => sum + d.headcount, 0);

    return (
        <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] p-4 rounded-2xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-xs space-y-3">
            {/* Header / Summary Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                        <Users size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                            Labor & Coverage Summary
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                            Daily staffing headcount and scheduled working hours
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                        <Clock size={15} />
                        <span>{totalWeekHours} Total Weekly Hours</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                        <ShieldCheck size={15} className="text-[var(--theme-status-success-text)]" />
                        <span>{totalScheduledShifts} Shifts</span>
                    </div>

                    {overtimeCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] px-2.5 py-1 rounded-lg border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]">
                            <AlertTriangle size={14} />
                            <span>{overtimeCount} Overtime ({'>'}40h)</span>
                        </div>
                    ) : (
                        <div className="text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] hidden sm:block">
                            ✓ No Overtime
                        </div>
                    )}
                </div>
            </div>

            {/* 7-Day Mini Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {weekDays.map((day, idx) => {
                    const cov = dailyCoverage[idx] || { headcount: 0, totalHours: 0 };
                    const isZero = cov.headcount === 0;

                    return (
                        <div
                            key={day.date}
                            className={`p-2.5 rounded-xl border text-center transition-colors ${
                                day.isToday
                                    ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]'
                                    : isZero
                                    ? 'bg-[color-mix(in_srgb,var(--theme-bg-subtle)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_50%,transparent)] border-dashed border-[var(--theme-border-subtle)] border-[var(--theme-border)]'
                                    : 'bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]'
                            }`}
                        >
                            <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                {day.dayName} {day.dayNumber}
                            </p>
                            <p className={`text-base font-extrabold my-0.5 ${
                                isZero ? 'text-[var(--theme-text-muted)]' : 'text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]'
                            }`}>
                                {cov.headcount} <span className="text-[11px] font-semibold text-[var(--theme-text-muted)]">staff</span>
                            </p>
                            <p className="text-[10px] font-mono font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                                {cov.totalHours} hrs
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
