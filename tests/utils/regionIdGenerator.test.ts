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
        it('validates canonical pure [3-4 LETTERS] format', () => {
            expect(isValidRegionCodeFormat('ADD', 'ET')).toBe(true);
            expect(isValidRegionCodeFormat('NRB', 'KE')).toBe(true);
            expect(isValidRegionCodeFormat('AD', 'ET')).toBe(false);  // Only 2 letters
            expect(isValidRegionCodeFormat('ADDIS', 'ET')).toBe(false); // 5 letters
            expect(isValidRegionCodeFormat('add', 'ET')).toBe(true);   // Case-insensitive check
            expect(isValidRegionCodeFormat('123', 'ET')).toBe(false);  // Numbers not allowed
        });

        it('normalizes legacy or bare inputs into strict pure [3-4 LETTERS]', () => {
            expect(formatRegionCode('add', 'ET')).toBe('ADD');
            expect(formatRegionCode('nrb', 'KE')).toBe('NRB');
            expect(formatRegionCode('ke_mombasa', 'KE')).toBe('MBA');
            expect(formatRegionCode('ET-ADD', 'ET')).toBe('ADD');
            expect(formatRegionCode('KE-NRB', 'KE')).toBe('NRB');
        });
    });

    describe('generateNextSmartRegionCode - Uniqueness & Advanced 3-Letter Intelligence', () => {
        it('assigns standard 3-letter hub code when available', () => {
            const code = generateNextSmartRegionCode({
                name: 'Addis Ababa Central Region',
                country: 'ET',
                existingCodes: []
            });
            expect(code).toBe('ADD');
        });

        it('CRITICAL: Prevents duplicate ADD and computes next smart unique 3 letters', () => {
            // When ADD already exists in the system
            const existing = ['ADD'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa Central Region',
                country: 'ET',
                existingCodes: existing
            });

            // Must NOT be ADD
            expect(nextCode).not.toBe('ADD');
            // Must be exactly 3 uppercase letters
            expect(nextCode).toMatch(/^[A-Z]{3}$/);
            // Must be unique
            expect(isRegionCodeUnique(nextCode, existing)).toBe(true);
        });

        it('intelligently generates multi-word acronyms (e.g. Addis Ababa South -> AAS)', () => {
            const existing = ['ADD'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa South',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toBe('AAS');
        });

        it('intelligently generates multi-word acronyms (e.g. Addis Ababa West -> AAW)', () => {
            const existing = ['ADD', 'AAS'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa West',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toBe('AAW');
        });

        it('resolves collisions across progressive existing Addis regions', () => {
            const existing = ['ADD', 'AAB', 'ADA', 'ADS', 'AAC'];

            const nextCode = generateNextSmartRegionCode({
                name: 'Addis Ababa',
                country: 'ET',
                existingCodes: existing
            });

            expect(nextCode).toMatch(/^[A-Z]{3}$/);
            expect(existing.includes(nextCode)).toBe(false);
        });

        it('handles Kenya regional creations with pure 3-letter codes', () => {
            const existing = ['NRB', 'MBA'];

            // Mombasa South should get unique code
            const mombasaSouth = generateNextSmartRegionCode({
                name: 'Mombasa South',
                country: 'KE',
                existingCodes: existing
            });

            expect(mombasaSouth).not.toBe('MBA');
            expect(mombasaSouth).toMatch(/^[A-Z]{3}$/);
        });

        it('advances systematically through alphabetical space when all name candidates are taken', () => {
            // Suppose many AD* candidates are taken
            const candidates = extractRegionCandidates('Addis Ababa');
            const candidateCodes = candidates.map(c => c);
            const existing = [...candidateCodes, 'ADA', 'ADB', 'ADC'];

            const code = generateNextSmartRegionCode({
                name: 'Addis Ababa',
                country: 'ET',
                existingCodes: existing
            });

            expect(code).toMatch(/^[A-Z]{3}$/);
            expect(existing.includes(code)).toBe(false);
        });
    });

    describe('validateRegionCodeInput', () => {
        it('flags duplicate territorial codes and provides smart alternative', () => {
            const existing = ['ADD', 'ADA'];

            const result = validateRegionCodeInput({
                code: 'ADD',
                country: 'ET',
                existingCodes: existing,
                name: 'Addis Ababa New Region'
            });

            expect(result.valid).toBe(false);
            expect(result.error).toContain('already exists');
            expect(result.suggestedCode).toBeDefined();
            expect(result.suggestedCode).not.toBe('ADD');
            expect(result.suggestedCode).toMatch(/^[A-Z]{3}$/);
        });

        it('flags invalid code format and provides formatted suggestion', () => {
            const result = validateRegionCodeInput({
                code: 'INVALID_LONG_CODE',
                country: 'ET',
                existingCodes: ['ADD'],
                name: 'Dire Dawa'
            });

            expect(result.valid).toBe(false);
            expect(result.error).toContain('3-4 uppercase letters');
            expect(result.suggestedCode).toBe('DIR');
        });

        it('approves valid unique region code', () => {
            const result = validateRegionCodeInput({
                code: 'DIR',
                country: 'ET',
                existingCodes: ['ADD']
            });

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });
});
