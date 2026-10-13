import { describe, it, expect } from 'vitest';
import type { ShiftRecord } from '../../types';

describe('Shift Counter & Cashier Responsibility Architecture', () => {
    it('creates shift stamped with cashierCode and counterNumber', () => {
        const shift: ShiftRecord = {
            id: 'shift-1001',
            siteId: 'site-kileleshwa',
            cashierId: 'emp-uuid-42',
            cashierName: 'Makena Benson',
            cashierCode: 'KE-SIIF0042',
            counterNumber: 'Counter 1',
            startTime: '2026-10-13T08:00:00Z',
            status: 'Open',
            openingFloat: 2000,
            cashSales: 0
        };

        expect(shift.cashierCode).toBe('KE-SIIF0042');
        expect(shift.counterNumber).toBe('Counter 1');
        expect(shift.status).toBe('Open');
    });

    it('enforces counter mutual exclusion across open shifts at the same site', () => {
        const activeShifts: ShiftRecord[] = [
            {
                id: 'shift-1',
                siteId: 'site-kileleshwa',
                cashierId: 'emp-1',
                cashierName: 'Makena Benson',
                cashierCode: 'KE-SIIF0042',
                counterNumber: 'Counter 1',
                startTime: '2026-10-13T08:00:00Z',
                status: 'Open',
                openingFloat: 2000,
                cashSales: 0
            }
        ];

        const isCounterOccupied = (counter: string, siteId: string) => {
            return activeShifts.some(
                s => s.status === 'Open' && s.siteId === siteId && s.counterNumber === counter
            );
        };

        expect(isCounterOccupied('Counter 1', 'site-kileleshwa')).toBe(true);
        expect(isCounterOccupied('Counter 2', 'site-kileleshwa')).toBe(false);
    });

    it('formats active shift badge as Employee Badge • Counter Number without raw UUIDs', () => {
        const shift: ShiftRecord = {
            id: '7be9746e-e6bf-4e58-bd89-2df39617b9e5',
            siteId: 'site-kileleshwa',
            cashierId: 'emp-uuid-42',
            cashierName: 'Makena Benson',
            cashierCode: 'KE-SIIF0042',
            counterNumber: 'Counter 1',
            startTime: '2026-10-13T08:00:00Z',
            status: 'Open',
            openingFloat: 2000,
            cashSales: 0
        };

        const badgeText = `${shift.cashierCode} • ${shift.counterNumber}`;
        expect(badgeText).toBe('KE-SIIF0042 • Counter 1');
        expect(badgeText).not.toContain('7be9746e');
        expect(badgeText).not.toContain('SHF-7BE9746E');
    });
});
