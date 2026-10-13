import { describe, it, expect } from 'vitest';
import { formatShiftId } from '../../utils/jobIdFormatter';

describe('formatShiftId - Zero Raw UUID Invariant', () => {
    it('returns N/A when shift is null or undefined', () => {
        expect(formatShiftId(null)).toBe('N/A');
        expect(formatShiftId(undefined)).toBe('N/A');
        expect(formatShiftId('')).toBe('N/A');
    });

    it('formats pure numeric shift identifiers with 4-digit padding', () => {
        expect(formatShiftId('1')).toBe('SHF-0001');
        expect(formatShiftId('42')).toBe('SHF-0042');
        expect(formatShiftId({ shiftNumber: 7 })).toBe('SHF-0007');
        expect(formatShiftId({ shift_number: 12 })).toBe('SHF-0012');
    });

    it('preserves clean SHF- prefixed sequential numbers', () => {
        expect(formatShiftId('SHF-0001')).toBe('SHF-0001');
        expect(formatShiftId('SHF-0042')).toBe('SHF-0042');
        expect(formatShiftId({ shiftNumber: 'SHF-0002' })).toBe('SHF-0002');
        expect(formatShiftId({ shift_number: 'SHF-0005' })).toBe('SHF-0005');
    });

    it('never displays raw hex UUID slices like SHF-7BE9746E', () => {
        const rawUuid = '7be9746e-e6bf-4e58-bd89-2df39617b9e5';
        
        // When explicit shiftNumber is present on the record
        const shiftWithNumber = {
            id: rawUuid,
            shiftNumber: 'SHF-0002'
        };
        expect(formatShiftId(shiftWithNumber)).toBe('SHF-0002');

        // When legacy UUID alone is passed, it must NEVER output raw hex slice
        const legacyShift = {
            id: rawUuid
        };
        const formatted = formatShiftId(legacyShift);
        expect(formatted).not.toContain('7BE9746E');
        expect(formatted).toBe('SHF-0001');
    });

    it('handles legacy raw hex strings by converting them to clean format', () => {
        expect(formatShiftId('SHF-7BE9746E')).toBe('SHF-0001');
        expect(formatShiftId('SHF-1F1742C4')).toBe('SHF-0001');
    });
});
