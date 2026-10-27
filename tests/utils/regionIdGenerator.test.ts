import { describe, it, expect } from 'vitest';
import {
    generateNextSmartRegionCode,
    validateRegionCodeInput,
    isValidRegionCodeFormat,
    isRegionCodeUnique,
    formatRegionCode,
    extractRegionCandidates
} from '../../utils/regionIdGenerator';

describe('Smart Region ID Generator & Sovereignty Governance', () => {
    describe('formatRegionCode & isValidRegionCodeFormat', () => {
        it('validates canonical [COUNTRY]-[3-LETTERS] format', () => {
            expect(isValidRegionCodeFormat('ET-ADD', 'ET')).toBe(true);
            expect(isValidRegionCodeFormat('KE-NRB', 'KE')).toBe(true);
            expect(isValidRegionCodeFormat('ET-ADD', 'KE')).toBe(false); // Wrong country prefix
            expect(isValidRegionCodeFormat('ET-AD', 'ET')).toBe(false);  // Only 2 letters
            expect(isValidRegionCodeFormat('ET-ADDIS', 'ET')).toBe(false); // 5 letters
            expect(isValidRegionCodeFormat('et-add', 'ET')).toBe(true);   // Case-insensitive check
            expect(isValidRegionCodeFormat('ET-123', 'ET')).toBe(false);  // Numbers not allowed
        });

        it('normalizes legacy or bare inputs into strict [COUNTRY]-[3-LETTERS]', () => {
            expect(formatRegionCode('add', 'ET')).toBe('ET-ADD');
            expect(formatRegionCode('nrb', 'KE')).toBe('KE-NRB');
            expect(formatRegionCode('ke_mombasa', 'KE')).toBe('KE-MBA');
            expect(formatRegionCode('ET-ADD', 'ET')).toBe('ET-ADD');
        });
    });

    describe('generateNextSmartRegionCode - Uniqueness & Advanced 3-Letter Intelligence', () => {
        it('assigns standard 3-letter hub code when available', () => {
            const code = generateNextSmartRegionCode({
                name: 'Addis Ababa Central Region',
                country: 'ET',
                existingCodes: []
            });
            expect(code).toBe('ET-ADD');
        });

        it('CRITICAL: Prevents duplicate ET-ADD and computes next smart unique 3 letters', () => {
            // When ET-ADD already exists in the system
            const existing = ['ET-ADD'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa Central Region',
                country: 'ET',
                existingCodes: existing
            });

            // Must NOT be ET-ADD
            expect(nextCode).not.toBe('ET-ADD');
            // Must have ET- prefix
            expect(nextCode.startsWith('ET-')).toBe(true);
            // Must have exactly 3 uppercase letters after prefix
            expect(nextCode).toMatch(/^ET-[A-Z]{3}$/);
            // Must be unique
            expect(isRegionCodeUnique(nextCode, existing)).toBe(true);
        });

        it('intelligently generates multi-word acronyms (e.g. Addis Ababa South -> ET-AAS)', () => {
            const existing = ['ET-ADD'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa South',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toBe('ET-AAS');
        });

        it('intelligently generates multi-word acronyms (e.g. Addis Ababa West -> ET-AAW)', () => {
            const existing = ['ET-ADD', 'ET-AAS'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa West',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toBe('ET-AAW');
        });

        it('resolves collisions across progressive existing Addis regions', () => {
            const existing = ['ET-ADD', 'ET-AAB', 'ET-ADA', 'ET-ADS', 'ET-AAC'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toMatch(/^ET-[A-Z]{3}$/);
            expect(existing.includes(nextCode)).toBe(false);
            expect(nextCode.startsWith('ET-')).toBe(true);
        });

        it('handles Kenya regional creations with mandatory KE prefix', () => {
            const existing = ['KE-NRB', 'KE-MBA'];

            // Mombasa South should get unique code
            const mombasaSouth = generateNextSmartRegionCode({
                name: 'Mombasa South',
                country: 'KE',
                existingCodes: existing
            });

            expect(mombasaSouth).not.toBe('KE-MBA');
            expect(mombasaSouth.startsWith('KE-')).toBe(true);
            expect(mombasaSouth).toMatch(/^KE-[A-Z]{3}$/);
        });

        it('advances systematically through alphabetical space when all name candidates are taken', () => {
            // Suppose many ET-AD* candidates are taken
            const candidates = extractRegionCandidates('Addis Ababa');
            const candidateCodes = candidates.map(c => `ET-${c}`);
            const existing = [...candidateCodes, 'ET-ADA', 'ET-ADB', 'ET-ADC'];

            const code = generateNextSmartRegionCode({
                name: 'Addis Ababa',
                country: 'ET',
                existingCodes: existing
            });

            expect(code.startsWith('ET-')).toBe(true);
            expect(code).toMatch(/^ET-[A-Z]{3}$/);
            expect(existing.includes(code)).toBe(false);
        });
    });

    describe('validateRegionCodeInput', () => {
        it('flags duplicate territorial codes and provides smart alternative', () => {
            const existing = ['ET-ADD', 'ET-ADA'];

            const result = validateRegionCodeInput({
                code: 'ET-ADD',
                country: 'ET',
                existingCodes: existing,
                name: 'Addis Ababa New Region'
            });

            expect(result.valid).toBe(false);
            expect(result.error).toContain('already exists');
            expect(result.suggestedCode).toBeDefined();
            expect(result.suggestedCode).not.toBe('ET-ADD');
            expect(result.suggestedCode?.startsWith('ET-')).toBe(true);
        });

        it('flags invalid code format and provides formatted suggestion', () => {
            const result = validateRegionCodeInput({
                code: 'INVALID_LONG_CODE',
                country: 'ET',
                existingCodes: ['ET-ADD'],
                name: 'Dire Dawa'
            });

            expect(result.valid).toBe(false);
            expect(result.error).toContain('ET-XXX');
            expect(result.suggestedCode).toBe('ET-DIR');
        });

        it('approves valid unique region code', () => {
            const result = validateRegionCodeInput({
                code: 'ET-DIR',
                country: 'ET',
                existingCodes: ['ET-ADD']
            });

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });
});
