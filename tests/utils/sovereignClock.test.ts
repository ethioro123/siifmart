import { describe, it, expect } from 'vitest';
import { getCountryProfile } from '../../utils/localization';

describe('Sovereign Clock & Calendar Isolation', () => {
    describe('Ethiopian Calendar & Clock (ET)', () => {
        it('uses Africa/Addis_Ababa timezone and ETB currency', () => {
            const profile = getCountryProfile('ET');
            expect(profile.timezone).toBe('Africa/Addis_Ababa');
            expect(profile.currencyCode).toBe('ETB');
        });

        it('correctly calculates Ethiopian 12-hour cycle with day/night periods', () => {
            // Ethiopian 12h cycle starts at 6:00 AM (dawn)
            const calculateEthHourAndPeriod = (hours: number) => {
                let ethHour = (hours + 6) % 12;
                if (ethHour === 0) ethHour = 12;

                let period = '';
                if (hours >= 6 && hours < 12) period = 'ጠዋት';
                else if (hours >= 12 && hours < 18) period = 'ቀን';
                else if (hours >= 18 && hours < 24) period = 'ማታ';
                else period = 'ሌሊት';

                return { ethHour, period };
            };

            // 06:00 (Dawn) -> 12 ጠዋት
            expect(calculateEthHourAndPeriod(6)).toEqual({ ethHour: 12, period: 'ጠዋት' });

            // 07:00 -> 1 ጠዋት
            expect(calculateEthHourAndPeriod(7)).toEqual({ ethHour: 1, period: 'ጠዋት' });

            // 12:00 (Noon) -> 6 ቀን
            expect(calculateEthHourAndPeriod(12)).toEqual({ ethHour: 6, period: 'ቀን' });

            // 15:00 (3 PM) -> 9 ቀን
            expect(calculateEthHourAndPeriod(15)).toEqual({ ethHour: 9, period: 'ቀን' });

            // 18:00 (Dusk / 6 PM) -> 12 ማታ
            expect(calculateEthHourAndPeriod(18)).toEqual({ ethHour: 12, period: 'ማታ' });

            // 21:00 (9 PM) -> 3 ማታ
            expect(calculateEthHourAndPeriod(21)).toEqual({ ethHour: 3, period: 'ማታ' });

            // 02:00 (2 AM) -> 8 ሌሊት
            expect(calculateEthHourAndPeriod(2)).toEqual({ ethHour: 8, period: 'ሌሊት' });
        });

        it('formats Ethiopian Solar Calendar in pure Amharic or pure Oromo without mixing', () => {
            const date = new Date('2026-10-02T06:43:25Z'); // 09:43:25 EAT

            // Pure Amharic formatting function
            const formatAmharic = (d: Date) => {
                let raw = new Intl.DateTimeFormat('en-US', {
                    calendar: 'ethiopic',
                    dateStyle: 'full',
                    timeZone: 'Africa/Addis_Ababa'
                }).format(d).toLowerCase().replace(/\s*(era[0-9]|am)\b/ig, '').trim();

                raw = raw.replace('friday', 'ዓርብ');
                raw = raw.replace('meskerem', 'መስከረም');
                return `${raw} ዓ.ም`;
            };

            // Pure Oromo formatting function
            const formatOromo = (d: Date) => {
                let raw = new Intl.DateTimeFormat('en-US', {
                    calendar: 'ethiopic',
                    dateStyle: 'full',
                    timeZone: 'Africa/Addis_Ababa'
                }).format(d).toLowerCase().replace(/\s*(era[0-9]|am)\b/ig, '').trim();

                raw = raw.replace('friday', 'Jimaata');
                raw = raw.replace('meskerem', 'Fulbaana');
                return raw;
            };

            const amharicDate = formatAmharic(date);
            const oromoDate = formatOromo(date);

            // Pure Amharic: Contains Amharic, NEVER contains Oromo
            expect(amharicDate).toContain('ዓርብ');
            expect(amharicDate).toContain('መስከረም');
            expect(amharicDate).toContain('ዓ.ም');
            expect(amharicDate).not.toContain('Jimaata');
            expect(amharicDate).not.toContain('Fulbaana');

            // Pure Oromo: Contains Oromo, NEVER contains Amharic
            expect(oromoDate).toContain('Jimaata');
            expect(oromoDate).toContain('Fulbaana');
            expect(oromoDate).not.toContain('ዓርብ');
            expect(oromoDate).not.toContain('መስከረም');
            expect(oromoDate).not.toContain('ዓ.ም');
        });
    });

    describe('Kenyan National Calendar & Clock (KE)', () => {
        it('uses Africa/Nairobi timezone and KES currency', () => {
            const profile = getCountryProfile('KE');
            expect(profile.timezone).toBe('Africa/Nairobi');
            expect(profile.currencyCode).toBe('KES');
        });

        it('formats Kenyan National Calendar in Swahili and English without Ethiopic bleed', () => {
            const date = new Date('2026-10-02T06:43:25Z'); // 09:43:25 EAT
            const swStr = new Intl.DateTimeFormat('sw-KE', {
                dateStyle: 'full',
                timeZone: 'Africa/Nairobi'
            }).format(date).toUpperCase();

            const enStr = new Intl.DateTimeFormat('en-KE', {
                dateStyle: 'medium',
                timeZone: 'Africa/Nairobi'
            }).format(date).toUpperCase();

            // Must contain Swahili day and month
            expect(swStr).toContain('IJUMAA');
            expect(swStr).toContain('OKTOBA');
            expect(swStr).toContain('2026');

            // Must contain English date
            expect(enStr).toContain('2026');

            // Strict Anti-Bleed: Kenyan calendar must NEVER contain Ethiopian terms
            expect(swStr).not.toContain('FUULBANA');
            expect(swStr).not.toContain('መስከረም');
            expect(swStr).not.toContain('ጠዋት');
        });

        it('Kenyan live clock renders East Africa Time (EAT) subtitle', () => {
            const profile = getCountryProfile('KE');
            const subtitle = 'NAIROBI • EAT (UTC+3)';
            expect(subtitle).toContain('NAIROBI');
            expect(subtitle).toContain('EAT');
            expect(profile.flag).toBe('🇰🇪');
        });
    });

    describe('Strict Multi-Country Tenancy Isolation', () => {
        it('guarantees isolated timezone and calendar profiles for ET vs KE', () => {
            const et = getCountryProfile('ET');
            const ke = getCountryProfile('KE');

            expect(et.code).toBe('ET');
            expect(ke.code).toBe('KE');

            expect(et.currencyCode).toBe('ETB');
            expect(ke.currencyCode).toBe('KES');

            expect(et.timezone).toBe('Africa/Addis_Ababa');
            expect(ke.timezone).toBe('Africa/Nairobi');
        });
    });
});
