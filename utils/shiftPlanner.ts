import { StaffSchedule } from '../types';

export interface WeekDayInfo {
    date: string; // YYYY-MM-DD
    dayName: string; // 'Mon', 'Tue', etc.
    dayNumber: string; // '12'
    monthName: string; // 'Oct'
    isToday: boolean;
    fullLabel: string; // 'Mon, Oct 12'
}

export type ShiftCode = 'M' | 'E' | 'N' | 'O' | 'C';

export interface ShiftPreset {
    code: ShiftCode;
    label: string;
    startTime: string;
    endTime: string;
    description: string;
}

export const SHIFT_PRESETS: Record<ShiftCode, ShiftPreset> = {
    M: {
        code: 'M',
        label: 'Morning',
        startTime: '08:00',
        endTime: '16:00',
        description: '08:00 – 16:00 (8h)'
    },
    E: {
        code: 'E',
        label: 'Evening',
        startTime: '16:00',
        endTime: '00:00',
        description: '16:00 – 00:00 (8h)'
    },
    N: {
        code: 'N',
        label: 'Night',
        startTime: '00:00',
        endTime: '08:00',
        description: '00:00 – 08:00 (8h)'
    },
    O: {
        code: 'O',
        label: 'Off',
        startTime: '00:00',
        endTime: '00:00',
        description: 'Scheduled Off'
    },
    C: {
        code: 'C',
        label: 'Custom',
        startTime: '09:00',
        endTime: '17:00',
        description: 'Custom Hours'
    }
};

/**
 * Returns Monday (start of week) normalized to 00:00:00.000 for a given date
 */
export function getWeekMonday(inputDate: Date | string): Date {
    const d = new Date(inputDate);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday;
}

/**
 * Format a Date object to YYYY-MM-DD using local time
 */
export function formatISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns info for each of the 7 days of the week starting from mondayDate
 */
export function getWeekDates(mondayDate: Date): WeekDayInfo[] {
    const todayISO = formatISODate(new Date());
    const days: WeekDayInfo[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
        const current = new Date(mondayDate);
        current.setDate(mondayDate.getDate() + i);
        const iso = formatISODate(current);
        days.push({
            date: iso,
            dayName: dayNames[i],
            dayNumber: String(current.getDate()),
            monthName: monthNames[current.getMonth()],
            isToday: iso === todayISO,
            fullLabel: `${dayNames[i]}, ${monthNames[current.getMonth()]} ${current.getDate()}`
        });
    }

    return days;
}

/**
 * Formats a week range header string, e.g., "Oct 12 – Oct 18, 2026"
 */
export function formatWeekDisplay(mondayDate: Date): string {
    const sunday = new Date(mondayDate);
    sunday.setDate(mondayDate.getDate() + 6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = monthNames[mondayDate.getMonth()];
    const endMonth = monthNames[sunday.getMonth()];

    if (startMonth === endMonth) {
        return `${startMonth} ${mondayDate.getDate()} – ${sunday.getDate()}, ${sunday.getFullYear()}`;
    }
    return `${startMonth} ${mondayDate.getDate()} – ${endMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

/**
 * Calculates duration in hours between startTime ('HH:mm') and endTime ('HH:mm')
 * Supports overnight shifts.
 */
export function calculateShiftHours(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    if (startTime === endTime) return 0;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

    const startTotal = sh * 60 + sm;
    let endTotal = eh * 60 + em;

    if (endTotal <= startTotal) {
        // Overnight shift (e.g., 22:00 to 06:00 or 16:00 to 00:00)
        endTotal += 24 * 60;
    }

    const durationMinutes = endTotal - startTotal;
    return Math.round((durationMinutes / 60) * 10) / 10;
}

/**
 * Classifies a shift into M, E, N, O, or C
 */
export function classifyShift(schedule?: StaffSchedule | null): ShiftCode {
    if (!schedule) return 'O';
    if (schedule.status === 'Cancelled') return 'O';

    const { startTime, endTime } = schedule;
    if (!startTime || !endTime || startTime === endTime) return 'O';

    if (startTime === '08:00' && endTime === '16:00') return 'M';
    if (startTime === '16:00' && (endTime === '00:00' || endTime === '24:00')) return 'E';
    if (startTime === '00:00' && endTime === '08:00') return 'N';

    return 'C';
}

/**
 * Calculates total hours worked in a week for an array of schedules
 */
export function calculateWeeklyHours(shifts: (StaffSchedule | null | undefined)[]): number {
    return shifts.reduce((total, shift) => {
        if (!shift || shift.status === 'Cancelled') return total;
        return total + calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);
}

/**
 * Calculates daily coverage (headcount and total hours) across all schedules
 */
export function calculateDailyCoverage(
    schedules: StaffSchedule[],
    weekDateStrings: string[]
): { date: string; headcount: number; totalHours: number }[] {
    const coverageMap = new Map<string, { headcount: number; totalHours: number }>();
    weekDateStrings.forEach(d => coverageMap.set(d, { headcount: 0, totalHours: 0 }));

    schedules.forEach(schedule => {
        if (coverageMap.has(schedule.date) && schedule.status !== 'Cancelled') {
            const current = coverageMap.get(schedule.date)!;
            const hours = calculateShiftHours(schedule.startTime, schedule.endTime);
            if (hours > 0) {
                current.headcount += 1;
                current.totalHours += hours;
            }
        }
    });

    return weekDateStrings.map(date => ({
        date,
        headcount: coverageMap.get(date)?.headcount || 0,
        totalHours: Math.round((coverageMap.get(date)?.totalHours || 0) * 10) / 10
    }));
}
