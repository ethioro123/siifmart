import { describe, expect, it } from 'vitest';
import { formatMovementReason } from '../../utils/jobIdFormatter';

describe('formatMovementReason', () => {
    it('formats user reported putaway raw UUID into a clean short reference with 1-based line', () => {
        const raw = 'Putaway job 621f1556-fd41-480e-af91-bce812a70ae9 line 0 to A-01-01';
        const formatted = formatMovementReason(raw);

        // Raw UUID must never appear in the output
        expect(formatted).not.toContain('621f1556-fd41-480e-af91-bce812a70ae9');
        // Converts 0-indexed line 0 to human-friendly line 1
        expect(formatted).toBe('Putaway job 621F15 line 1 to A-01-01');
    });

    it('resolves job number from context when available', () => {
        const raw = 'Putaway job 621f1556-fd41-480e-af91-bce812a70ae9 line 0 to A-01-01';
        const formatted = formatMovementReason(raw, {
            jobs: [{ id: '621f1556-fd41-480e-af91-bce812a70ae9', jobNumber: 'AAAA0033' }]
        });

        expect(formatted).toBe('Putaway job AAAA0033 line 1 to A-01-01');
    });

    it('resolves job number from context when reference is short prefix', () => {
        const raw = 'Putaway job 621F15 line 1 to A-01-01';
        const formatted = formatMovementReason(raw, {
            jobs: [{ id: '621f1556-fd41-480e-af91-bce812a70ae9', jobNumber: 'AAAA0033' }]
        });

        expect(formatted).toBe('Putaway job AAAA0033 line 1 to A-01-01');
    });

    it('preserves canonical PO putaway job reference directly', () => {
        const raw = 'Putaway job AAAA0033 line 1 to A-01-01';
        const formatted = formatMovementReason(raw);

        expect(formatted).toBe('Putaway job AAAA0033 line 1 to A-01-01');
    });

    it('formats pick job with raw UUID into a clean short reference', () => {
        const raw = 'Pick job e31f246d-5df7-40dc-abc7-1867498a0a5a line 0';
        const formatted = formatMovementReason(raw);

        expect(formatted).not.toContain('e31f246d-5df7-40dc-abc7-1867498a0a5a');
        expect(formatted).toBe('Pick job E31F24 line 1');
    });

    it('formats POS sale receipt raw UUID into short receipt reference', () => {
        const raw = 'POS Sale — Receipt POS-1308c56f-947b-4332-8346-1117caa45c8f';
        const formatted = formatMovementReason(raw);

        expect(formatted).not.toContain('1308c56f-947b-4332-8346-1117caa45c8f');
        expect(formatted).toBe('POS Sale — Receipt POS-1308C5');
    });

    it('replaces arbitrary embedded UUIDs in any text with short uppercase hex', () => {
        const raw = 'Transferred stock for order 7e0f10d7-3c4b-431c-bfd0-e75021d7ea7a to staging';
        const formatted = formatMovementReason(raw);

        expect(formatted).not.toContain('7e0f10d7-3c4b-431c-bfd0-e75021d7ea7a');
        expect(formatted).toBe('Transferred stock for order 7E0F10 to staging');
    });

    it('returns default fallback when reason is empty or null', () => {
        expect(formatMovementReason(null)).toBe('Receipt recorded');
        expect(formatMovementReason(undefined)).toBe('Receipt recorded');
        expect(formatMovementReason('')).toBe('Receipt recorded');
        expect(formatMovementReason('   ')).toBe('Receipt recorded');
    });

    it('preserves clean human-readable reasons unchanged', () => {
        expect(formatMovementReason('Cycle count adjustment +5')).toBe('Cycle count adjustment +5');
        expect(formatMovementReason('Damaged in transit')).toBe('Damaged in transit');
    });
});
