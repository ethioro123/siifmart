import { describe, it, expect } from 'vitest';
import {
    generateBatchNumber,
    parseBatchNumber,
    formatBatchDisplay,
    getBatchExpiryStatus,
    cleanBatchSku,
    formatCompactDate
} from '../../utils/batchNumber';

describe('Standardized Batch & Lot Number Management (Date Received)', () => {
    describe('formatCompactDate', () => {
        it('formats Date object into compact YYYYMMDD', () => {
            const date = new Date(2026, 9, 3); // October 3, 2026
            expect(formatCompactDate(date)).toBe('20261003');
        });

        it('handles ISO string inputs', () => {
            expect(formatCompactDate('2026-05-15T10:00:00Z')).toBe('20260515');
        });
    });

    describe('generateBatchNumber', () => {
        it('generates standard batch with date received, SKU, and sequence', () => {
            const date = new Date(2026, 9, 3); // 2026-10-03
            const batch = generateBatchNumber({
                date,
                sku: 'KE-GR001',
                sequence: 1
            });
            expect(batch).toBe('LOT-20261003-KEGR001-01');
        });

        it('pads sequence numbers cleanly (e.g. sequence 2 -> 02)', () => {
            const date = new Date(2026, 9, 3);
            const batch = generateBatchNumber({
                date,
                sku: 'ET-BV002',
                sequence: 2
            });
            expect(batch).toBe('LOT-20261003-ETBV002-02');
        });

        it('generates clean batch when no SKU is provided', () => {
            const date = new Date(2026, 9, 3);
            const batch = generateBatchNumber({
                date,
                sequence: 3
            });
            expect(batch).toBe('LOT-20261003-03');
        });

        it('allows custom prefix if requested', () => {
            const date = new Date(2026, 9, 3);
            const batch = generateBatchNumber({
                date,
                sku: 'KE-DY005',
                sequence: 1,
                prefix: 'BATCH'
            });
            expect(batch).toBe('BATCH-20261003-KEDY005-01');
        });
    });

    describe('parseBatchNumber', () => {
        it('correctly parses standard lot number with SKU and sequence', () => {
            const parsed = parseBatchNumber('LOT-20261003-KEGR001-01');
            expect(parsed.isValid).toBe(true);
            expect(parsed.isStandard).toBe(true);
            expect(parsed.prefix).toBe('LOT');
            expect(parsed.dateReceived).toBe('2026-10-03');
            expect(parsed.formattedDate).toBe('Oct 3, 2026');
            expect(parsed.sku).toBe('KEGR001');
            expect(parsed.sequence).toBe(1);
        });

        it('correctly parses standard lot number without SKU', () => {
            const parsed = parseBatchNumber('LOT-20261003-02');
            expect(parsed.isValid).toBe(true);
            expect(parsed.isStandard).toBe(true);
            expect(parsed.dateReceived).toBe('2026-10-03');
            expect(parsed.sequence).toBe(2);
        });

        it('identifies custom supplier lot codes gracefully', () => {
            const parsed = parseBatchNumber('SUPPLIER-MFG-9982');
            expect(parsed.isValid).toBe(true);
            expect(parsed.isStandard).toBe(false);
            expect(parsed.prefix).toBe('CUSTOM');
            expect(parsed.raw).toBe('SUPPLIER-MFG-9982');
        });
    });

    describe('formatBatchDisplay', () => {
        it('formats standard batch into human-friendly text', () => {
            const display = formatBatchDisplay('LOT-20261003-KEGR001-01');
            expect(display).toContain('Rcvd Oct 3, 2026');
            expect(display).toContain('Lot #1');
        });

        it('displays custom lot with prefix', () => {
            const display = formatBatchDisplay('MFG-2026-A1');
            expect(display).toBe('Lot: MFG-2026-A1');
        });

        it('handles empty or missing batch gracefully', () => {
            expect(formatBatchDisplay('')).toBe('No Lot Assigned');
            expect(formatBatchDisplay(undefined)).toBe('No Lot Assigned');
        });
    });

    describe('getBatchExpiryStatus & FEFO Priority', () => {
        it('returns no_expiry when expiry date is missing', () => {
            const status = getBatchExpiryStatus();
            expect(status.status).toBe('no_expiry');
            expect(status.fefoPriority).toBe(999999);
        });

        it('flags expired batches with negative FEFO priority', () => {
            const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
            const status = getBatchExpiryStatus(pastDate);
            expect(status.status).toBe('expired');
            expect(status.daysRemaining).toBeLessThan(0);
            expect(status.label).toContain('Expired');
        });

        it('flags critical items expiring within 14 days', () => {
            const criticalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const status = getBatchExpiryStatus(criticalDate);
            expect(status.status).toBe('critical');
            expect(status.label).toContain('Critical FEFO');
        });

        it('flags fresh batches with extended shelf life', () => {
            const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
            const status = getBatchExpiryStatus(futureDate);
            expect(status.status).toBe('fresh');
            expect(status.label).toContain('Fresh');
            expect(status.daysRemaining).toBeGreaterThan(60);
        });
    });
});
