import { describe, it, expect } from 'vitest';
import {
    formatEmployeeCode,
    parseEmployeeCode,
    extractEmployeeSequence,
    generateEmployeeEmail,
    matchStaffPin,
    formatDisplayEmployeeId,
    resolveEmployeeCountry
} from '../../utils/employeeIdGenerator';

describe('employeeIdGenerator - Sovereign Country-Prefixed Worker IDs', () => {
    describe('formatEmployeeCode', () => {
        it('formats Kenya worker IDs correctly with KE-SIIF prefix', () => {
            expect(formatEmployeeCode('KE', 44)).toBe('KE-SIIF0044');
            expect(formatEmployeeCode('ke', 1)).toBe('KE-SIIF0001');
            expect(formatEmployeeCode('KE', 1234)).toBe('KE-SIIF1234');
        });

        it('formats Ethiopia worker IDs correctly with ET-SIIF prefix', () => {
            expect(formatEmployeeCode('ET', 20)).toBe('ET-SIIF0020');
            expect(formatEmployeeCode('et', 40)).toBe('ET-SIIF0040');
            expect(formatEmployeeCode('', 45)).toBe('ET-SIIF0045'); // defaults to ET
        });

        it('formats Uganda worker IDs correctly with UG-SIIF prefix', () => {
            expect(formatEmployeeCode('UG', 100)).toBe('UG-SIIF0100');
            expect(formatEmployeeCode('ug', 1)).toBe('UG-SIIF0001');
        });

        it('formats Tanzania and Rwanda worker IDs correctly', () => {
            expect(formatEmployeeCode('TZ', 5)).toBe('TZ-SIIF0005');
            expect(formatEmployeeCode('RW', 8)).toBe('RW-SIIF0008');
        });
    });

    describe('parseEmployeeCode', () => {
        it('parses sovereign country-prefixed codes without hyphen after SIIF', () => {
            expect(parseEmployeeCode('KE-SIIF0044')).toEqual({
                country: 'KE',
                seq: 44,
                raw: 'KE-SIIF0044',
                isLegacy: false
            });
            expect(parseEmployeeCode('ET-SIIF0020')).toEqual({
                country: 'ET',
                seq: 20,
                raw: 'ET-SIIF0020',
                isLegacy: false
            });
            expect(parseEmployeeCode('UG-SIIF0100')).toEqual({
                country: 'UG',
                seq: 100,
                raw: 'UG-SIIF0100',
                isLegacy: false
            });
        });

        it('parses lowercase sovereign codes', () => {
            expect(parseEmployeeCode('ke-siif0044')).toEqual({
                country: 'KE',
                seq: 44,
                raw: 'ke-siif0044',
                isLegacy: false
            });
            expect(parseEmployeeCode('et-siif0020')).toEqual({
                country: 'ET',
                seq: 20,
                raw: 'et-siif0020',
                isLegacy: false
            });
        });

        it('parses country-prefixed codes with hyphen (KE-SIIF-0044)', () => {
            expect(parseEmployeeCode('KE-SIIF-0044')).toEqual({
                country: 'KE',
                seq: 44,
                raw: 'KE-SIIF-0044',
                isLegacy: false
            });
        });

        it('parses legacy un-prefixed SIIF-XXXX codes and maps to Ethiopia baseline', () => {
            expect(parseEmployeeCode('SIIF-0044')).toEqual({
                country: 'ET',
                seq: 44,
                raw: 'SIIF-0044',
                isLegacy: true
            });
            expect(parseEmployeeCode('siif-0036')).toEqual({
                country: 'ET',
                seq: 36,
                raw: 'siif-0036',
                isLegacy: true
            });
        });

        it('parses legacy EMP-XXX demo codes and maps to Ethiopia baseline', () => {
            expect(parseEmployeeCode('EMP-001')).toEqual({
                country: 'ET',
                seq: 1,
                raw: 'EMP-001',
                isLegacy: true
            });
        });

        it('returns null for invalid codes', () => {
            expect(parseEmployeeCode(null)).toBeNull();
            expect(parseEmployeeCode('')).toBeNull();
            expect(parseEmployeeCode('INVALID')).toBeNull();
        });
    });

    describe('extractEmployeeSequence with country isolation', () => {
        it('isolates sequences per country tenant', () => {
            expect(extractEmployeeSequence('KE-SIIF0044', 'KE')).toBe(44);
            expect(extractEmployeeSequence('KE-SIIF0044', 'ET')).toBeNull(); // zero cross-country bleed!
            expect(extractEmployeeSequence('ET-SIIF0020', 'ET')).toBe(20);
            expect(extractEmployeeSequence('ET-SIIF0020', 'KE')).toBeNull();
            expect(extractEmployeeSequence('SIIF-0039', 'ET')).toBe(39); // legacy maps to ET
            expect(extractEmployeeSequence('SIIF-0039', 'KE')).toBeNull();
        });
    });

    describe('generateEmployeeEmail', () => {
        it('generates uppercase code official staff emails matching corporate standards', () => {
            expect(generateEmployeeEmail('KE-SIIF0044')).toBe('KE-SIIF0044@siifmart.com');
            expect(generateEmployeeEmail('ET-SIIF0020')).toBe('ET-SIIF0020@siifmart.com');
            expect(generateEmployeeEmail('UG-SIIF0100')).toBe('UG-SIIF0100@siifmart.com');
        });
    });

    describe('matchStaffPin', () => {
        it('matches full code case-insensitively', () => {
            expect(matchStaffPin('KE-SIIF0044', 'ke-siif0044')).toBe(true);
            expect(matchStaffPin('KE-SIIF0044', 'KE-SIIF0044')).toBe(true);
            expect(matchStaffPin('ET-SIIF0020', 'ET-SIIF0020')).toBe(true);
        });

        it('matches 4-digit keypad PIN entry', () => {
            expect(matchStaffPin('KE-SIIF0044', '0044')).toBe(true);
            expect(matchStaffPin('ET-SIIF0020', '0020')).toBe(true);
            expect(matchStaffPin('UG-SIIF0100', '0100')).toBe(true);
            expect(matchStaffPin('SIIF-0015', '0015')).toBe(true);
        });

        it('matches short numeric sequence', () => {
            expect(matchStaffPin('KE-SIIF0044', '44')).toBe(true);
            expect(matchStaffPin('ET-SIIF0020', '20')).toBe(true);
        });

        it('matches country + padded PIN', () => {
            expect(matchStaffPin('KE-SIIF0044', 'ke-0044')).toBe(true);
        });

        it('rejects incorrect PINs', () => {
            expect(matchStaffPin('KE-SIIF0044', '0045')).toBe(false);
            expect(matchStaffPin('ET-SIIF0020', '9999')).toBe(false);
            expect(matchStaffPin('KE-SIIF0044', '')).toBe(false);
        });
    });

    describe('formatDisplayEmployeeId', () => {
        it('returns formatted sovereign employee code as is', () => {
            expect(formatDisplayEmployeeId('KE-SIIF0044')).toBe('KE-SIIF0044');
            expect(formatDisplayEmployeeId('ET-SIIF0020')).toBe('ET-SIIF0020');
            expect(formatDisplayEmployeeId('UG-SIIF0100')).toBe('UG-SIIF0100');
        });

        it('seamlessly harmonizes existing legacy employee codes to sovereign country format', () => {
            expect(formatDisplayEmployeeId('SIIF-0015')).toBe('ET-SIIF0015');
            expect(formatDisplayEmployeeId('siif-0044')).toBe('ET-SIIF0044');
            expect(formatDisplayEmployeeId('SIIF-036')).toBe('ET-SIIF0036');
            expect(formatDisplayEmployeeId('EMP-001')).toBe('ET-SIIF0001');
        });

        it('supports optional country override for legacy codes', () => {
            expect(formatDisplayEmployeeId('SIIF-0010', null, 'KE')).toBe('KE-SIIF0010');
        });

        it('returns fallback EMP-XXXXX when code is missing', () => {
            expect(formatDisplayEmployeeId('', '12345678-abcd')).toBe('EMP-12345');
            expect(formatDisplayEmployeeId(null, null)).toBe('NOT ASSIGNED');
        });

        it('resolves Kenyan workers (e.g. Musyoka Kioko at Kenya Central Operations) to KE-SIIF prefix', () => {
            // Musyoka Kioko with phone +254 and KE-ADMIN siteId
            const musyoka = {
                id: 'emp-musyoka-43',
                name: 'Musyoka Kioko',
                role: 'country_hr_director',
                phone: '+254722456754',
                siteId: 'KE-ADMIN',
                code: 'ET-SIIF0043' // previously mislabeled as ET-
            };

            // Automatically repairs ET- prefix to KE- because workplace is in Kenya
            expect(formatDisplayEmployeeId(musyoka)).toBe('KE-SIIF0043');

            // Also works with legacy siif-0043 code
            const legacyMusyoka = { ...musyoka, code: 'siif-0043' };
            expect(formatDisplayEmployeeId(legacyMusyoka)).toBe('KE-SIIF0043');

            // Also works when resolved via sites lookup
            const sites = [{ id: 'KE-ADMIN', code: 'KE-01', country: 'KE' }];
            expect(formatDisplayEmployeeId(musyoka, sites)).toBe('KE-SIIF0043');
        });

        it('resolves Ethiopian workers at Ethiopian sites to ET-SIIF prefix', () => {
            const ethiopianWorker = {
                id: 'emp-sara-20',
                name: 'Sara Bekele',
                role: 'cashier',
                phone: '+251911000020',
                siteId: 'ST-001',
                code: 'SIIF-0020'
            };
            const sites = [{ id: 'ST-001', code: 'ET-03', country: 'ET' }];
            expect(formatDisplayEmployeeId(ethiopianWorker, sites)).toBe('ET-SIIF0020');
        });
    });

    describe('resolveEmployeeCountry', () => {
        it('resolves from explicit country', () => {
            expect(resolveEmployeeCountry({ country: 'ke' })).toBe('KE');
            expect(resolveEmployeeCountry({ country: 'UG' })).toBe('UG');
        });

        it('resolves from siteId prefix', () => {
            expect(resolveEmployeeCountry({ siteId: 'KE-ADMIN' })).toBe('KE');
            expect(resolveEmployeeCountry({ siteId: 'site-ke-1' })).toBe('KE');
            expect(resolveEmployeeCountry({ siteId: 'KE-WH-001' })).toBe('KE');
            expect(resolveEmployeeCountry({ siteId: 'UG-01' })).toBe('UG');
            expect(resolveEmployeeCountry({ siteId: 'ET-01' })).toBe('ET');
        });

        it('resolves from mobile phone country code', () => {
            expect(resolveEmployeeCountry({ phone: '+254722456754' })).toBe('KE');
            expect(resolveEmployeeCountry({ phone: '254700000000' })).toBe('KE');
            expect(resolveEmployeeCountry({ phone: '+256700000000' })).toBe('UG');
            expect(resolveEmployeeCountry({ phone: '+251911000001' })).toBe('ET');
            expect(resolveEmployeeCountry({ phone: '+255700000000' })).toBe('TZ');
            expect(resolveEmployeeCountry({ phone: '+250700000000' })).toBe('RW');
        });

        it('defaults to ET when no country indicators present', () => {
            expect(resolveEmployeeCountry({})).toBe('ET');
            expect(resolveEmployeeCountry(null)).toBe('ET');
        });
    });
});
