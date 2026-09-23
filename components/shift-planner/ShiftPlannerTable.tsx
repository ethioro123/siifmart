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
            <div className="bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/30 rounded-2xl p-12 text-center">
                <div className="w-8 h-8 border-3 border-[#2C5E3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                    Loading weekly shift schedule...
                </p>
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <div className="bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/30 rounded-2xl p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mx-auto text-stone-400">
                    <User size={24} />
                </div>
                <h4 className="font-bold text-base text-[#1E3F27] dark:text-[#EAE5D9]">
                    No Staff Members Found
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Try adjusting your site or department filters, or clear your search query to see roster assignments.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/30 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-[#FAF8F5] dark:bg-white/5 border-b border-[#E2DCCE] dark:border-white/10 text-xs font-bold text-stone-600 dark:text-stone-300">
                            {/* Employee column */}
                            <th className="p-3.5 w-64 sticky left-0 z-20 bg-[#FAF8F5] dark:bg-[#121915] border-r border-[#E2DCCE] dark:border-white/10 shadow-xs">
                                Staff Member
                            </th>

                            {/* 7 Days */}
                            {weekDays.map(day => (
                                <th
                                    key={day.date}
                                    className={`p-3 text-center min-w-[125px] border-r border-[#E2DCCE]/60 dark:border-white/5 ${
                                        day.isToday ? 'bg-emerald-500/10 text-[#1E3F27] dark:text-[#A9CBA2]' : ''
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400">
                                            {day.dayName}
                                        </span>
                                        <span className={`text-xs font-bold ${
                                            day.isToday
                                                ? 'px-2 py-0.5 rounded-full bg-[#2C5E3B] text-white text-[10px] mt-0.5'
                                                : 'text-[#1E3F27] dark:text-[#EAE5D9]'
                                        }`}>
                                            {day.monthName} {day.dayNumber}
                                        </span>
                                    </div>
                                </th>
                            ))}

                            {/* Hours column */}
                            <th className="p-3 text-center w-24 text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5 text-xs">
                        {employees.map(emp => {
                            const totalHours = employeeWeeklyHours.get(emp.id) || 0;
                            const isOvertime = totalHours > 40;

                            return (
                                <tr
                                    key={emp.id}
                                    className="hover:bg-stone-50/80 dark:hover:bg-white/5 transition-colors group"
                                >
                                    {/* Sticky Employee Info */}
                                    <td className="p-3 sticky left-0 z-10 bg-white dark:bg-[#121915] group-hover:bg-stone-50/90 dark:group-hover:bg-[#18221c] transition-colors border-r border-[#E2DCCE] dark:border-white/10 shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                                                alt=""
                                                className="w-9 h-9 rounded-xl object-cover border border-[#E2DCCE] dark:border-white/10 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                                                    {emp.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-medium text-stone-500 truncate">
                                                        {formatRole(emp.role)}
                                                    </span>
                                                    {emp.department && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-white/10 text-stone-500 font-semibold truncate">
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
                                                className={`p-1.5 border-r border-[#E2DCCE]/40 dark:border-white/5 ${
                                                    day.isToday ? 'bg-emerald-500/5' : ''
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
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : totalHours === 0
                                                    ? 'text-stone-400'
                                                    : 'text-[#2C5E3B] dark:text-[#A9CBA2]'
                                            }`}>
                                                {totalHours}h
                                            </span>
                                            {isOvertime && (
                                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
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
