import { describe, it, expect } from 'vitest';
import {
    getWeekMonday,
    formatISODate,
    getWeekDates,
    formatWeekDisplay,
    calculateShiftHours,
    classifyShift,
    calculateWeeklyHours,
    calculateDailyCoverage,
    SHIFT_PRESETS
} from '../../utils/shiftPlanner';
import { StaffSchedule } from '../../types';

describe('shiftPlanner utils', () => {
    describe('getWeekMonday and date calculations', () => {
        it('should return Monday when given a Wednesday', () => {
            // Oct 14, 2026 is a Wednesday
            const wed = new Date(2026, 9, 14);
            const monday = getWeekMonday(wed);
            expect(monday.getDay()).toBe(1); // Monday
            expect(formatISODate(monday)).toBe('2026-10-12');
        });

        it('should return Monday of the current week when given Sunday', () => {
            // Oct 18, 2026 is Sunday
            const sun = new Date(2026, 9, 18);
            const monday = getWeekMonday(sun);
            expect(monday.getDay()).toBe(1);
            expect(formatISODate(monday)).toBe('2026-10-12');
        });

        it('should generate 7 days for the week', () => {
            const monday = new Date(2026, 9, 12);
            const week = getWeekDates(monday);
            expect(week).toHaveLength(7);
            expect(week[0].dayName).toBe('Mon');
            expect(week[0].date).toBe('2026-10-12');
            expect(week[6].dayName).toBe('Sun');
            expect(week[6].date).toBe('2026-10-18');
        });

        it('should format week display correctly', () => {
            const monday = new Date(2026, 9, 12);
            expect(formatWeekDisplay(monday)).toBe('Oct 12 – 18, 2026');
        });
    });

    describe('calculateShiftHours', () => {
        it('calculates standard day shift hours', () => {
            expect(calculateShiftHours('08:00', '16:00')).toBe(8);
            expect(calculateShiftHours('09:00', '17:30')).toBe(8.5);
        });

        it('calculates overnight shift hours', () => {
            // 22:00 to 06:00 = 8h
            expect(calculateShiftHours('22:00', '06:00')).toBe(8);
            // 16:00 to 00:00 = 8h
            expect(calculateShiftHours('16:00', '00:00')).toBe(8);
        });

        it('handles invalid or empty inputs gracefully', () => {
            expect(calculateShiftHours('', '')).toBe(0);
            expect(calculateShiftHours('00:00', '00:00')).toBe(0);
        });
    });

    describe('classifyShift', () => {
        it('classifies Morning, Evening, Night, and Custom shifts', () => {
            const morning: StaffSchedule = {
                id: '1', siteId: 's1', employeeId: 'e1', employeeName: 'Alice',
                date: '2026-10-12', startTime: '08:00', endTime: '16:00', role: 'Cashier', status: 'Scheduled'
            };
            expect(classifyShift(morning)).toBe('M');

            const evening: StaffSchedule = { ...morning, startTime: '16:00', endTime: '00:00' };
            expect(classifyShift(evening)).toBe('E');

            const night: StaffSchedule = { ...morning, startTime: '00:00', endTime: '08:00' };
            expect(classifyShift(night)).toBe('N');

            const custom: StaffSchedule = { ...morning, startTime: '10:00', endTime: '18:30' };
            expect(classifyShift(custom)).toBe('C');

            const cancelled: StaffSchedule = { ...morning, status: 'Cancelled' };
            expect(classifyShift(cancelled)).toBe('O');

            expect(classifyShift(null)).toBe('O');
        });
    });

    describe('calculateWeeklyHours and coverage', () => {
        it('calculates total hours for weekly shifts', () => {
            const shifts: StaffSchedule[] = [
                { id: '1', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-12', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
                { id: '2', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-13', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
                { id: '3', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-14', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
                { id: '4', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-15', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
                { id: '5', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-16', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
            ];
            expect(calculateWeeklyHours(shifts)).toBe(40);
        });

        it('calculates daily coverage correctly', () => {
            const dates = ['2026-10-12', '2026-10-13', '2026-10-14'];
            const shifts: StaffSchedule[] = [
                { id: '1', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-12', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
                { id: '2', siteId: 's1', employeeId: 'e2', employeeName: 'B', date: '2026-10-12', startTime: '16:00', endTime: '00:00', role: 'Staff', status: 'Scheduled' },
                { id: '3', siteId: 's1', employeeId: 'e1', employeeName: 'A', date: '2026-10-13', startTime: '08:00', endTime: '16:00', role: 'Staff', status: 'Scheduled' },
            ];
            const coverage = calculateDailyCoverage(shifts, dates);
            expect(coverage[0]).toEqual({ date: '2026-10-12', headcount: 2, totalHours: 16 });
            expect(coverage[1]).toEqual({ date: '2026-10-13', headcount: 1, totalHours: 8 });
            expect(coverage[2]).toEqual({ date: '2026-10-14', headcount: 0, totalHours: 0 });
        });
    });
});
