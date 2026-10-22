import { describe, it, expect } from 'vitest';
import { formatDateTime } from '../../utils/formatting';

describe('PO Approval Date Parsing & Formatting', () => {
    it('cleans trailing REASON tag from timestamps in formatDateTime', () => {
        const rawWithReason = '2026-10-08 14:24:52.236893+00 REASON:STANDARD_REPLENISHMENT';
        const formatted = formatDateTime(rawWithReason, { showTime: true, includeYear: true });
        
        expect(formatted).not.toBe('Invalid Date');
        expect(formatted).toContain('2026');
        expect(formatted).toContain('Oct');
        expect(formatted).not.toContain('REASON');
    });

    it('formats clean ISO timestamps accurately', () => {
        const iso = '2026-10-08T14:24:52.000Z';
        const formatted = formatDateTime(iso, { showTime: true, includeYear: true });
        
        expect(formatted).not.toBe('Invalid Date');
        expect(formatted).toContain('2026');
    });

    it('returns N/A for null or empty input', () => {
        expect(formatDateTime(null)).toBe('N/A');
        expect(formatDateTime(undefined)).toBe('N/A');
        expect(formatDateTime('')).toBe('N/A');
    });

    it('handles regex extraction of approval tag with embedded REASON', () => {
        const notes = '\n[APPROVED_BY:Kamau Ndenga (regional_operations_manager):2026-10-08 14:24:52.236893+00 REASON:STANDARD_REPLENISHMENT]\n[APPROVAL_NOTE: Quick list approval]';
        
        const approvalMatch = notes.match(/\[APPROVED_BY:(.*?):(.*?)]/);
        expect(approvalMatch).not.toBeNull();
        
        const approvedBy = approvalMatch![1].trim();
        const rawDate = approvalMatch![2].replace(/\s+REASON:.*$/i, '').trim();
        
        expect(approvedBy).toBe('Kamau Ndenga (regional_operations_manager)');
        expect(rawDate).toBe('2026-10-08 14:24:52.236893+00');
        expect(isNaN(new Date(rawDate).getTime())).toBe(false);
    });
});
