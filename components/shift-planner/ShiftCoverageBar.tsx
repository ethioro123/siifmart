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
        <div className="bg-white/90 dark:bg-black/30 p-4 rounded-2xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-xs space-y-3">
            {/* Header / Summary Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)] dark:border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/30 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                        <Users size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                            Labor & Coverage Summary
                        </h4>
                        <p className="text-[11px] text-stone-500 font-medium">
                            Daily staffing headcount and scheduled working hours
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                        <Clock size={15} />
                        <span>{totalWeekHours} Total Weekly Hours</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <ShieldCheck size={15} className="text-[var(--theme-status-success-text)]" />
                        <span>{totalScheduledShifts} Shifts</span>
                    </div>

                    {overtimeCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]">
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
                                    ? 'bg-stone-100/50 dark:bg-white/5 border-dashed border-stone-200 dark:border-stone-800'
                                    : 'bg-white dark:bg-black/20 border-[var(--theme-border)] dark:border-white/10'
                            }`}
                        >
                            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                {day.dayName} {day.dayNumber}
                            </p>
                            <p className={`text-base font-extrabold my-0.5 ${
                                isZero ? 'text-stone-400' : 'text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]'
                            }`}>
                                {cov.headcount} <span className="text-[11px] font-semibold text-stone-400">staff</span>
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
