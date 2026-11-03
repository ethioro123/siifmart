import { describe, it, expect } from 'vitest';
import {
    isOromoLanguage,
    getOromoAdaptiveTextClass,
    getOromoButtonClass,
    getOromoBadgeClass,
    getOromoNavTabClass
} from '../../utils/oromoTypography';

describe('oromoTypography utilities', () => {
    it('correctly identifies Oromo language code', () => {
        expect(isOromoLanguage('or')).toBe(true);
        expect(isOromoLanguage('en')).toBe(false);
        expect(isOromoLanguage('am')).toBe(false);
        expect(isOromoLanguage(null)).toBe(false);
        expect(isOromoLanguage(undefined)).toBe(false);
    });

    it('returns adaptive class when Oromo is active and fallback when not', () => {
        expect(getOromoAdaptiveTextClass('or', 'font-medium', 'text-dynamic-sm')).toBe('font-medium text-dynamic-sm');
        expect(getOromoAdaptiveTextClass('en', 'font-medium', 'text-dynamic-sm')).toBe('font-medium');
        expect(getOromoAdaptiveTextClass('am', 'font-medium')).toBe('font-medium');
    });

    it('generates dynamic button classes for Oromo', () => {
        const orBtn = getOromoButtonClass('or', 'bg-primary text-white');
        expect(orBtn).toContain('text-xs');
        expect(orBtn).toContain('tracking-tight');

        const enBtn = getOromoButtonClass('en', 'bg-primary text-white');
        expect(enBtn).toBe('bg-primary text-white');
    });

    it('generates dynamic badge and nav tab classes for Oromo', () => {
        const orBadge = getOromoBadgeClass('or', 'badge');
        expect(orBadge).toContain('text-[10px]');

        const enBadge = getOromoBadgeClass('en', 'badge');
        expect(enBadge).toBe('badge');

        const orTab = getOromoNavTabClass('or', 'tab-btn');
        expect(orTab).toContain('text-xs');

        const enTab = getOromoNavTabClass('en', 'tab-btn');
        expect(enTab).toBe('tab-btn');
    });
});
