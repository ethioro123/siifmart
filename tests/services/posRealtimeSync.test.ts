import { describe, it, expect, vi } from 'vitest';
import { mapShiftRow } from '../../services/shifts.service';
import { realtimeService } from '../../services/realtime.service';

describe('POS and Shifts Realtime Synchronization', () => {
    describe('mapShiftRow CDC Normalization', () => {
        it('normalizes raw Postgres snake_case shifts CDC payload into camelCase ShiftRecord', () => {
            const rawPayload = {
                id: 'shift-uuid-101',
                shift_number: 'SH-2026-001',
                site_id: 'site-bole-01',
                home_site_id: 'site-bole-01',
                cashier_id: 'usr-cashier-44',
                cashier_name: 'Sara Tesfaye',
                counter_number: 'Counter 2',
                cashier_code: 'EMP-044',
                start_time: '2026-10-15T06:00:00Z',
                end_time: null,
                opening_float: '500.00',
                cash_sales: '12450.50',
                card_sales: '3200.00',
                mobile_sales: '1800.00',
                expenses: '0',
                expected_cash: '12950.50',
                actual_cash: '12950.50',
                variance: '0',
                denominations: { '200': 50, '100': 20 },
                discrepancy_reason: '',
                status: 'Open',
                notes: 'Morning shift',
                cash_drops: '5000.00',
                drop_count: 2,
                country_code: 'ET',
                supervisor_id: 'usr-sup-01',
                supervisor_name: 'Yonas Manager',
                supervisor_role: 'store_manager',
                supervisor_signed_at: null,
                created_at: '2026-10-15T06:00:00Z',
                updated_at: '2026-10-15T08:30:00Z'
            };

            const mapped = mapShiftRow(rawPayload);

            expect(mapped.id).toBe('shift-uuid-101');
            expect(mapped.shiftNumber).toBe('SH-2026-001');
            expect(mapped.siteId).toBe('site-bole-01');
            expect(mapped.cashierId).toBe('usr-cashier-44');
            expect(mapped.cashierName).toBe('Sara Tesfaye');
            expect(mapped.counterNumber).toBe('Counter 2');
            expect(mapped.cashierCode).toBe('EMP-044');
            expect(mapped.startTime).toBe('2026-10-15T06:00:00Z');
            expect(mapped.endTime).toBeUndefined(); // Open shift has undefined endTime
            expect(mapped.openingFloat).toBe(500);
            expect(mapped.cashSales).toBe(12450.5);
            expect(mapped.cardSales).toBe(3200);
            expect(mapped.mobileSales).toBe(1800);
            expect(mapped.expectedCash).toBe(12950.5);
            expect(mapped.actualCash).toBe(12950.5);
            expect(mapped.variance).toBe(0);
            expect(mapped.cashDrops).toBe(5000);
            expect(mapped.dropCount).toBe(2);
            expect(mapped.countryCode).toBe('ET');
            expect(mapped.status).toBe('Open');
        });

        it('retains end_time when shift is Closed', () => {
            const closedPayload = {
                id: 'shift-uuid-102',
                site_id: 'site-bole-01',
                cashier_id: 'usr-1',
                cashier_name: 'Sara',
                status: 'Closed',
                end_time: '2026-10-15T14:00:00Z'
            };

            const mapped = mapShiftRow(closedPayload);
            expect(mapped.status).toBe('Closed');
            expect(mapped.endTime).toBe('2026-10-15T14:00:00Z');
        });
    });

    describe('realtimeService Subscriptions', () => {
        it('provides subscription helpers for shifts, cash drops, and overrides', () => {
            expect(typeof realtimeService.subscribeToShifts).toBe('function');
            expect(typeof realtimeService.subscribeToCashDrops).toBe('function');
            expect(typeof realtimeService.subscribeToSupervisoryOverrides).toBe('function');
        });

        it('subscribeToSite registers callbacks for all operational and POS tables', () => {
            const onProductChange = vi.fn();
            const onShiftChange = vi.fn();
            const onCashDropChange = vi.fn();
            const onOverrideChange = vi.fn();

            const subs = realtimeService.subscribeToSite('site-bole-01', {
                onProductChange,
                onShiftChange,
                onCashDropChange,
                onOverrideChange
            });

            expect(subs.length).toBe(4);
            realtimeService.unsubscribeAll(subs);
        });
    });
});
