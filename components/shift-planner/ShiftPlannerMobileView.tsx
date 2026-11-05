import React, { useState } from 'react';
import { Employee, StaffSchedule } from '../../types';
import { WeekDayInfo } from '../../utils/shiftPlanner';
import { ShiftCell } from './ShiftCell';
import { formatRole } from '../../utils/formatting';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface ShiftPlannerMobileViewProps {
    employees: Employee[];
    weekDays: WeekDayInfo[];
    scheduleMap: Map<string, StaffSchedule | null>;
    canEdit: boolean;
    employeeWeeklyHours: Map<string, number>;
    onCycleShift: (employee: Employee, date: string) => void;
    onEditShift: (employee: Employee, date: string, schedule: StaffSchedule | null) => void;
}

export const ShiftPlannerMobileView: React.FC<ShiftPlannerMobileViewProps> = ({
    employees,
    weekDays,
    scheduleMap,
    canEdit,
    employeeWeeklyHours,
    onCycleShift,
    onEditShift
}) => {
    const todayDay = weekDays.find(d => d.isToday) || weekDays[0];
    const [activeDate, setActiveDate] = useState<string>(todayDay?.date || '');

    const currentDayInfo = weekDays.find(d => d.date === activeDate) || todayDay;

    // Count shifts for active day
    const scheduledCount = employees.filter(emp => {
        const sched = scheduleMap.get(`${emp.id}_${activeDate}`);
        return Boolean(sched && sched.status && sched.status !== 'Cancelled');
    }).length;

    return (
        <div className="space-y-4">
            {/* Horizontal Day Selector Pills */}
            <div
                role="group"
                aria-label="Select day of week"
                className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-x-auto no-scrollbar"
            >
                {weekDays.map(day => {
                    const isSelected = day.date === activeDate;
                    return (
                        <button
                            key={day.date}
                            type="button"
                            onClick={() => setActiveDate(day.date)}
                            aria-pressed={isSelected}
                            className={`min-h-11 flex-1 min-w-[52px] py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                isSelected
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-bold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                {day.dayName.slice(0, 3)}
                            </span>
                            <span className={`text-xs mt-0.5 font-mono font-bold ${day.isToday && !isSelected ? 'text-[var(--theme-accent)]' : ''}`}>
                                {day.dayNumber}
                            </span>
                            {day.isToday && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)] mt-0.5" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Active Day Header */}
            <div className="flex items-center justify-between px-1 text-xs text-[var(--theme-text-secondary)]">
                <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[var(--theme-accent)]" />
                    <span className="font-semibold text-[var(--theme-text-primary)]">
                        {currentDayInfo?.dayName}, {currentDayInfo?.monthName} {currentDayInfo?.dayNumber}
                    </span>
                    {currentDayInfo?.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--theme-accent-muted)] text-[var(--theme-accent)]">
                            Today
                        </span>
                    )}
                </div>
                <div className="font-mono text-[11px]">
                    <span className="font-bold text-[var(--theme-text-primary)]">{scheduledCount}</span> on duty / {employees.length} staff
                </div>
            </div>

            {/* Staff Shift Cards for Selected Day */}
            <div className="space-y-2.5">
                {employees.map(emp => {
                    const schedule = scheduleMap.get(`${emp.id}_${activeDate}`) || null;
                    const totalHours = employeeWeeklyHours.get(emp.id) || 0;
                    const isOvertime = totalHours > 40;

                    return (
                        <div
                            key={emp.id}
                            className="p-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                        >
                            {/* Employee info */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <img
                                    src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                                    alt=""
                                    className="w-9 h-9 rounded-xl object-cover border border-[var(--theme-border)] shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs text-[var(--theme-text-primary)] truncate">
                                        {emp.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--theme-text-secondary)] mt-0.5">
                                        <span className="truncate">{formatRole(emp.role)}</span>
                                        <span>•</span>
                                        <span className={`font-mono font-medium ${isOvertime ? 'text-[var(--theme-status-warning-text)] font-bold' : ''}`}>
                                            {totalHours}h/wk
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Shift Cell */}
                            <div className="shrink-0 min-w-[110px]">
                                <ShiftCell
                                    employee={emp}
                                    date={activeDate}
                                    schedule={schedule}
                                    canEdit={canEdit}
                                    onCycle={() => onCycleShift(emp, activeDate)}
                                    onEdit={() => onEditShift(emp, activeDate, schedule)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
