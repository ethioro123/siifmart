import React from 'react';
import { Employee, StaffSchedule } from '../../types';
import { WeekDayInfo } from '../../utils/shiftPlanner';
import { ShiftCell } from './ShiftCell';
import { formatRole } from '../../utils/formatting';
import { User, AlertCircle } from 'lucide-react';

interface ShiftPlannerTableProps {
    employees: Employee[];
    weekDays: WeekDayInfo[];
    scheduleMap: Map<string, StaffSchedule | null>;
    canEdit: boolean;
    isLoading: boolean;
    employeeWeeklyHours: Map<string, number>;
    onCycleShift: (employee: Employee, date: string) => void;
    onEditShift: (employee: Employee, date: string, schedule: StaffSchedule | null) => void;
}

export const ShiftPlannerTable: React.FC<ShiftPlannerTableProps> = ({
    employees,
    weekDays,
    scheduleMap,
    canEdit,
    isLoading,
    employeeWeeklyHours,
    onCycleShift,
    onEditShift
}) => {
    if (isLoading) {
        return (
            <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-2xl p-12 text-center">
                <div className="w-8 h-8 border-3 border-[var(--theme-border)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                    Loading weekly shift schedule...
                </p>
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-2xl p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] flex items-center justify-center mx-auto text-[var(--theme-text-muted)]">
                    <User size={24} />
                </div>
                <h4 className="font-bold text-base text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                    No Staff Members Found
                </h4>
                <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto">
                    Try adjusting your site or department filters, or clear your search query to see roster assignments.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border-b border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] text-xs font-bold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                            {/* Employee column */}
                            <th className="p-3.5 w-64 sticky left-0 z-20 bg-[var(--theme-bg-app)] border-r border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shadow-xs">
                                Staff Member
                            </th>

                            {/* 7 Days */}
                            {weekDays.map(day => (
                                <th
                                    key={day.date}
                                    className={`p-3 text-center min-w-[125px] border-r border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] ${
                                        day.isToday ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]' : ''
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                            {day.dayName}
                                        </span>
                                        <span className={`text-xs font-bold ${
                                            day.isToday
                                                ? 'px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-text-primary)] text-[10px] mt-0.5'
                                                : 'text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]'
                                        }`}>
                                            {day.monthName} {day.dayNumber}
                                        </span>
                                    </div>
                                </th>
                            ))}

                            {/* Hours column */}
                            <th className="p-3 text-center w-24 text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[color-mix(in_srgb,var(--theme-border)_60%,transparent)] text-xs">
                        {employees.map(emp => {
                            const totalHours = employeeWeeklyHours.get(emp.id) || 0;
                            const isOvertime = totalHours > 40;

                            return (
                                <tr
                                    key={emp.id}
                                    className="hover:bg-[color-mix(in_srgb,var(--theme-bg-subtle)_80%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] transition-colors group"
                                >
                                    {/* Sticky Employee Info */}
                                    <td className="p-3 sticky left-0 z-10 bg-[var(--theme-bg-card)] group-hover:bg-[color-mix(in_srgb,var(--theme-bg-subtle)_90%,transparent)] transition-colors border-r border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                                                alt=""
                                                className="w-9 h-9 rounded-xl object-cover border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] truncate">
                                                    {emp.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-medium text-[var(--theme-text-secondary)] truncate">
                                                        {formatRole(emp.role)}
                                                    </span>
                                                    {emp.department && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] font-semibold truncate">
                                                            {emp.department}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 7 Shift Cells */}
                                    {weekDays.map(day => {
                                        const schedule = scheduleMap.get(`${emp.id}_${day.date}`) || null;
                                        return (
                                            <td
                                                key={day.date}
                                                className={`p-1.5 border-r border-[var(--theme-border)]/40 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] ${
                                                    day.isToday ? 'bg-[var(--theme-status-success-bg)]' : ''
                                                }`}
                                            >
                                                <ShiftCell
                                                    employee={emp}
                                                    date={day.date}
                                                    schedule={schedule}
                                                    canEdit={canEdit}
                                                    onCycle={() => onCycleShift(emp, day.date)}
                                                    onEdit={() => onEditShift(emp, day.date, schedule)}
                                                />
                                            </td>
                                        );
                                    })}

                                    {/* Total Weekly Hours */}
                                    <td className="p-3 text-center font-mono">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className={`text-sm font-extrabold ${
                                                isOvertime
                                                    ? 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]'
                                                    : totalHours === 0
                                                    ? 'text-[var(--theme-text-muted)]'
                                                    : 'text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]'
                                            }`}>
                                                {totalHours}h
                                            </span>
                                            {isOvertime && (
                                                <span className="text-[9px] font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-0.5">
                                                    <AlertCircle size={9} />
                                                    OT
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
