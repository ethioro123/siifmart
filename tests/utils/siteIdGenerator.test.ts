import { describe, it, expect } from 'vitest';
import {
    generateNextSiteCode,
    formatDisplaySiteId,
    parseSiteSequence,
    getSiteCountryId
} from '../../utils/siteIdGenerator';

describe('Human-Readable Country-Scoped Site ID Generator', () => {
    describe('generateNextSiteCode', () => {
        it('starts at KE-01 when Kenya has no sites', () => {
            const nextCode = generateNextSiteCode([], 'KE');
            expect(nextCode).toBe('KE-01');
        });

        it('increments sequentially under Kenya (KE-01 -> KE-02 -> KE-03)', () => {
            const sites = [
                { code: 'KE-01', country: 'KE' },
                { code: 'KE-02', country: 'KE' }
            ];
            expect(generateNextSiteCode(sites, 'KE')).toBe('KE-03');
        });

        it('maintains independent sequence per country ID (Kenya vs Uganda vs Tanzania)', () => {
            const multiCountrySites = [
                { code: 'KE-01', country: 'KE' },
                { code: 'KE-02', country: 'KE' },
                { code: 'KE-03', country: 'KE' },
                { code: 'UG-01', country: 'UG' },
                { code: 'TZ-01', country: 'TZ' },
                { code: 'ET-01', country: 'ET' },
                { code: 'ET-02', country: 'ET' }
            ];

            // Next Kenya site should be KE-04
            expect(generateNextSiteCode(multiCountrySites, 'KE')).toBe('KE-04');

            // Next Uganda site should be UG-02
            expect(generateNextSiteCode(multiCountrySites, 'UG')).toBe('UG-02');

            // Next Tanzania site should be TZ-02
            expect(generateNextSiteCode(multiCountrySites, 'TZ')).toBe('TZ-02');

            // Next Rwanda site should start at RW-01
            expect(generateNextSiteCode(multiCountrySites, 'RW')).toBe('RW-01');

            // Next Ethiopia site should be ET-03
            expect(generateNextSiteCode(multiCountrySites, 'ET')).toBe('ET-03');
        });

        it('supports numbers greater than 9 with proper formatting', () => {
            const sites = [
                { code: 'KE-09', country: 'KE' }
            ];
            expect(generateNextSiteCode(sites, 'KE')).toBe('KE-10');

            const sites10 = [
                { code: 'KE-10', country: 'KE' }
            ];
            expect(generateNextSiteCode(sites10, 'KE')).toBe('KE-11');
        });

        it('parses legacy SITE-KE-0001 and KE-WH001 codes for continuity', () => {
            const legacySites = [
                { code: 'SITE-KE-0001', country: 'KE' },
                { code: 'KE-WH002', country: 'KE' }
            ];
            expect(generateNextSiteCode(legacySites, 'KE')).toBe('KE-03');
        });
    });

    describe('parseSiteSequence', () => {
        it('parses direct country-sequence patterns', () => {
            expect(parseSiteSequence('KE-01', 'KE')).toBe(1);
            expect(parseSiteSequence('KE-02', 'KE')).toBe(2);
            expect(parseSiteSequence('UG-14', 'UG')).toBe(14);
            expect(parseSiteSequence('TZ-05', 'TZ')).toBe(5);
            expect(parseSiteSequence('RW-01', 'RW')).toBe(1);
        });

        it('returns null if code belongs to a different country', () => {
            expect(parseSiteSequence('ET-01', 'KE')).toBe(null);
            expect(parseSiteSequence('KE-01', 'UG')).toBe(null);
        });
    });

    describe('formatDisplaySiteId', () => {
        it('formats existing direct codes cleanly', () => {
            expect(formatDisplaySiteId({ code: 'KE-01', country: 'KE' })).toBe('KE-01');
            expect(formatDisplaySiteId({ code: 'UG-02', country: 'UG' })).toBe('UG-02');
            expect(formatDisplaySiteId({ code: 'TZ-01', country: 'TZ' })).toBe('TZ-01');
            expect(formatDisplaySiteId({ code: 'RW-03', country: 'RW' })).toBe('RW-03');
            expect(formatDisplaySiteId({ code: 'ET-05', country: 'ET' })).toBe('ET-05');
        });

        it('normalizes legacy SITE-KE-0001 format to human-readable KE-01', () => {
            expect(formatDisplaySiteId({ code: 'SITE-KE-0001', country: 'KE' })).toBe('KE-01');
            expect(formatDisplaySiteId({ code: 'SITE-UG-0002', country: 'UG' })).toBe('UG-02');
        });

        it('normalizes Kenyan stores (KE-ST-001, KE-STORE-1, ST-001, id fallback)', () => {
            expect(formatDisplaySiteId({ code: 'KE-ST-001', country: 'KE' })).toBe('KE-01');
            expect(formatDisplaySiteId({ code: 'KE-ST-003', country: 'KE' })).toBe('KE-03');
            expect(formatDisplaySiteId({ code: 'KE-STORE-2', country: 'KE' })).toBe('KE-02');
            expect(formatDisplaySiteId({ code: 'ST-001', country: 'KE' })).toBe('KE-01');
            // ID fallback when code is null/empty
            expect(formatDisplaySiteId({ id: 'KE-ST-001', country: 'KE' })).toBe('KE-01');
            expect(formatDisplaySiteId({ id: 'ke-store-3', country: 'KE' })).toBe('KE-03');
        });

        it('normalizes Ethiopian historic codes', () => {
            expect(formatDisplaySiteId({ code: 'SITE-0001', country: 'ET' })).toBe('ET-01');
            expect(formatDisplaySiteId({ code: 'ST-002', country: 'ET' })).toBe('ET-02');
        });
    });

    describe('getSiteCountryId', () => {
        it('returns normalized country ID', () => {
            expect(getSiteCountryId({ country: 'ke' })).toBe('KE');
            expect(getSiteCountryId({ country: 'UG' })).toBe('UG');
            expect(getSiteCountryId({})).toBe('ET');
        });
    });
});
