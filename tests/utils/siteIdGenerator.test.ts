import { describe, it, expect } from 'vitest';
import {
    generateNextSiteCode,
    formatDisplaySiteId,
    parseSiteSequence,
    getSiteCountryId,
    generatePlaceSpecificSiteCode,
    getRegionAbbreviation
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
            expect(formatDisplaySiteId({ code: 'ET-HQ', country: 'ET' })).toBe('ET-HQ');
            expect(formatDisplaySiteId({ code: 'KE-HQ', country: 'KE' })).toBe('KE-HQ');
            expect(formatDisplaySiteId({ code: 'ET-ADD', country: 'ET' })).toBe('ET-ADD');
            expect(formatDisplaySiteId({ code: 'KE-NRB', country: 'KE' })).toBe('KE-NRB');
            expect(formatDisplaySiteId({ code: 'ET-ADA', country: 'ET' })).toBe('ET-ADA');
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

        it('normalizes codes to clean [COUNTRY]-[ZONE]-[TYPE]-[NUMBER] decoupled format even when siteNumber is present', () => {
            expect(formatDisplaySiteId({ code: 'ADD-WH-01' })).toBe('ET-ADD-WH-01');
            expect(formatDisplaySiteId({ code: 'ADD-STR-01', siteNumber: 5 })).toBe('ET-ADD-STR-01');
            expect(formatDisplaySiteId({ code: 'ET-ADD-STR-BOLE-05', site_number: 5 } as any)).toBe('ET-ADD-STR-05');
            expect(formatDisplaySiteId({ code: 'KE-NRB-WH-EASTLEIGH-12', site_number: 12 } as any)).toBe('KE-NRB-WH-12');
            expect(formatDisplaySiteId({ code: 'ET-ADA-DC-ADAMA-04', siteNumber: 4 })).toBe('ET-ADA-DC-04');
            expect(formatDisplaySiteId({ code: 'NRB-ADM-13', siteNumber: 13 })).toBe('KE-NRB-ADM-13');
        });

        it('synthesizes clean [COUNTRY]-[ZONE]-[TYPE]-[NUMBER] codes without location names in the ID', () => {
            expect(formatDisplaySiteId({ name: 'Bole Supermarket', country: 'ET', type: 'Store', region_code: 'et_addis', site_number: 5 } as any)).toBe('ET-ADD-STR-05');
            expect(formatDisplaySiteId({ name: 'Central Operations', country: 'ET', type: 'Administration', site_number: 1 } as any)).toBe('ET-ADD-ADM-01');
            expect(formatDisplaySiteId({ name: 'Eastleigh 01', country: 'KE', type: 'Warehouse', region_code: 'ke_nairobi', site_number: 12 } as any)).toBe('KE-NRB-WH-12');
            expect(formatDisplaySiteId({ name: 'Adama Distribution Center', country: 'ET', type: 'Distribution Center', address: 'Adama, Oromia', site_number: 4 } as any)).toBe('ET-ADA-DC-04');
        });
    });

    describe('generatePlaceSpecificSiteCode', () => {
        it('generates clean operational codes [COUNTRY]-[ZONE]-[TYPE]-[NUMBER] decoupling location name', () => {
            const boleCode = generatePlaceSpecificSiteCode({
                country: 'ET',
                regionCode: 'et_addis',
                type: 'Store',
                name: 'Bole Supermarket',
                siteNumber: 5
            });
            expect(boleCode).toBe('ET-ADD-STR-05');

            const eastleighCode = generatePlaceSpecificSiteCode({
                country: 'KE',
                regionCode: 'ke_nairobi',
                type: 'Warehouse',
                name: 'Eastleigh 01',
                siteNumber: 12
            });
            expect(eastleighCode).toBe('KE-NRB-WH-12');

            const adamaDcCode = generatePlaceSpecificSiteCode({
                country: 'ET',
                regionCode: 'et_adama',
                type: 'Distribution Center',
                name: 'Adama Distribution Center',
                siteNumber: 4
            });
            expect(adamaDcCode).toBe('ET-ADA-DC-04');

            const regionalAdminCode = generatePlaceSpecificSiteCode({
                country: 'KE',
                regionCode: 'ke_nairobi',
                type: 'Administration',
                name: 'Nairobi Region Administration',
                siteNumber: 13
            });
            expect(regionalAdminCode).toBe('KE-NRB');
        });

        it('guarantees unique numbers across all facilities even if name, type, region or country differ', () => {
            // Given existing sites 01 and 02
            const existingSites = [
                { code: 'ET-ADD-ADM-01', site_number: 1 },
                { code: 'ET-DIR-WH-02', site_number: 2 }
            ];

            // Next facility receives unique number 03 (never repeating 01 or 02)
            const nextCode = generatePlaceSpecificSiteCode({
                country: 'ET',
                regionCode: 'et_adama',
                type: 'Distribution Center',
                name: 'AMBO',
                existingSites
            });
            expect(nextCode).toBe('ET-ADA-DC-03');

            // Subsequent facility in another country (Kenya) continues the unique sequence: 04
            const kenyaStore = generatePlaceSpecificSiteCode({
                country: 'KE',
                regionCode: 'ke_nairobi',
                type: 'Store',
                name: 'Westlands Branch',
                existingSites: [...existingSites, { code: 'ET-ADA-DC-03', site_number: 3 }]
            });
            expect(kenyaStore).toBe('KE-NRB-STR-04');
        });
    });

    describe('getRegionAbbreviation', () => {
        it('resolves clean 3-letter regional abbreviation from standardized [COUNTRY]-[ZONE] codes', () => {
            expect(getRegionAbbreviation('ET-ADD')).toBe('ADD');
            expect(getRegionAbbreviation('ET-ADA')).toBe('ADA');
            expect(getRegionAbbreviation('ET-DIR')).toBe('DIR');
            expect(getRegionAbbreviation('KE-NRB')).toBe('NRB');
            expect(getRegionAbbreviation('UG-KLA')).toBe('KLA');
            expect(getRegionAbbreviation('RW-KGL')).toBe('KGL');
            expect(getRegionAbbreviation('TZ-DAR')).toBe('DAR');
        });

        it('supports legacy snake_case codes for backwards compatibility', () => {
            expect(getRegionAbbreviation('et_addis')).toBe('ADD');
            expect(getRegionAbbreviation('ke_nairobi')).toBe('NRB');
            expect(getRegionAbbreviation('et_dire')).toBe('DIR');
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
