import { describe, it, expect, beforeEach } from 'vitest';
import {
    getEffectiveCountry,
    getCountryProfile,
    getAllowedLanguages,
    sanitizeLanguageForCountry,
    formatLocalizedPrice,
    COUNTRY_PROFILES
} from '../../utils/localization';
import { CURRENCY_SYMBOL, setCurrencySymbol } from '../../constants/categories';

describe('Localization Engine', () => {
    beforeEach(() => {
        setCurrencySymbol('ETB');
    });

    describe('getEffectiveCountry', () => {
        it('detects Kenya from explicit country field', () => {
            expect(getEffectiveCountry({ country: 'KE' })).toBe('KE');
        });

        it('detects Kenya from KES or KSh currency', () => {
            expect(getEffectiveCountry({ currency: 'KES' })).toBe('KE');
            expect(getEffectiveCountry({ currency: 'KSh' })).toBe('KE');
        });

        it('detects Kenya from Nairobi timezone', () => {
            expect(getEffectiveCountry({ timezone: 'Africa/Nairobi' })).toBe('KE');
        });

        it('defaults to Ethiopia when undefined or ET', () => {
            expect(getEffectiveCountry({})).toBe('ET');
            expect(getEffectiveCountry({ country: 'ET' })).toBe('ET');
            expect(getEffectiveCountry({ currency: 'ETB' })).toBe('ET');
        });
    });

    describe('getCountryProfile', () => {
        it('returns Kenya profile with KSh, KRA, and M-Pesa', () => {
            const profile = getCountryProfile('KE');
            expect(profile.code).toBe('KE');
            expect(profile.currency).toBe('KSh');
            expect(profile.currencySymbol).toBe('KSh');
            expect(profile.currencyCode).toBe('KES');
            expect(profile.taxRate).toBe(16);
            expect(profile.taxIdLabel).toBe('KRA PIN');
            expect(profile.primaryMobileMoney).toContain('M-Pesa');
            expect(profile.complianceStandard).toContain('eTIMS');
        });

        it('returns Ethiopia profile with ETB, ERCA, and Telebirr', () => {
            const profile = getCountryProfile('ET');
            expect(profile.code).toBe('ET');
            expect(profile.currency).toBe('ETB');
            expect(profile.taxRate).toBe(15);
            expect(profile.taxIdLabel).toBe('TIN');
            expect(profile.primaryMobileMoney).toContain('Telebirr');
        });
    });

    describe('getAllowedLanguages & Ethiopian Language Disabling', () => {
        it('disables all Ethiopian languages when market is Kenya', () => {
            const kenyaLangs = getAllowedLanguages('KE');
            const langCodes = kenyaLangs.map(l => l.code);
            expect(langCodes).toEqual(['en']);
            expect(langCodes).not.toContain('am');
            expect(langCodes).not.toContain('or');
        });

        it('provides English, Amharic, and Oromo when market is Ethiopia', () => {
            const ethiopiaLangs = getAllowedLanguages('ET');
            const langCodes = ethiopiaLangs.map(l => l.code);
            expect(langCodes).toContain('en');
            expect(langCodes).toContain('am');
            expect(langCodes).toContain('or');
        });

        it('sanitizes language for Kenya, automatically forcing English if Amharic or Oromo is passed', () => {
            expect(sanitizeLanguageForCountry('am', 'KE')).toBe('en');
            expect(sanitizeLanguageForCountry('or', 'KE')).toBe('en');
            expect(sanitizeLanguageForCountry('en', 'KE')).toBe('en');
        });

        it('allows Amharic and Oromo for Ethiopia', () => {
            expect(sanitizeLanguageForCountry('am', 'ET')).toBe('am');
            expect(sanitizeLanguageForCountry('or', 'ET')).toBe('or');
            expect(sanitizeLanguageForCountry('en', 'ET')).toBe('en');
        });
    });

    describe('formatLocalizedPrice', () => {
        it('formats prices with KSh for Kenya', () => {
            expect(formatLocalizedPrice(2499, 'KE')).toBe('KSh 2,499.00');
            expect(formatLocalizedPrice(150.5, 'KES')).toBe('KSh 150.50');
            expect(formatLocalizedPrice(150.5, 'KSh')).toBe('KSh 150.50');
        });

        it('formats prices with ETB for Ethiopia', () => {
            expect(formatLocalizedPrice(1200, 'ET')).toBe('ETB 1,200.00');
            expect(formatLocalizedPrice(50, 'ETB')).toBe('ETB 50.00');
        });

        it('handles null, undefined and negative numbers safely', () => {
            expect(formatLocalizedPrice(null, 'KE')).toBe('0.00');
            expect(formatLocalizedPrice(undefined, 'ET')).toBe('0.00');
            expect(formatLocalizedPrice(-250, 'KE')).toBe('-KSh 250.00');
        });
    });

    describe('Dynamic Currency Symbol live binding', () => {
        it('updates CURRENCY_SYMBOL when setCurrencySymbol is called', () => {
            setCurrencySymbol('KSh');
            expect(CURRENCY_SYMBOL).toBe('KSh');
            setCurrencySymbol('ETB');
            expect(CURRENCY_SYMBOL).toBe('ETB');
        });
    });
});
