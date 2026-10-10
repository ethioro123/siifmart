import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getCountryProfile } from '../../utils/localization';

describe('Security & Loss Prevention Apple HIG & Sovereign Isolation', () => {
    const securitySettingsPath = path.resolve(__dirname, '../../components/settings/SecuritySettings.tsx');
    const retailCardPath = path.resolve(__dirname, '../../components/settings/components/RetailLossPreventionCard.tsx');

    it('verifies SecuritySettings.tsx and RetailLossPreventionCard.tsx are under 500 lines', () => {
        const secLines = fs.readFileSync(securitySettingsPath, 'utf-8').split('\n').length;
        const retailLines = fs.readFileSync(retailCardPath, 'utf-8').split('\n').length;

        expect(secLines).toBeLessThanOrEqual(500);
        expect(retailLines).toBeLessThanOrEqual(500);
    });

    it('verifies zero legacy woody/muddy colors exist in modernized security settings', () => {
        const secContent = fs.readFileSync(securitySettingsPath, 'utf-8');
        const retailContent = fs.readFileSync(retailCardPath, 'utf-8');

        const legacyHexPatterns = [
            '#FAF8F5', '#faf8f5',
            '#E2DCCE', '#e2dcce',
            '#18201B', '#18201b',
            '#2C5E3B', '#2c5e3b',
            '#1E3F27', '#1e3f27',
            '#A9CBA2', '#a9cba2'
        ];

        legacyHexPatterns.forEach(hex => {
            expect(secContent).not.toContain(hex);
            expect(retailContent).not.toContain(hex);
        });
    });

    it('verifies zero raw Unicode emojis in security components', () => {
        const secContent = fs.readFileSync(securitySettingsPath, 'utf-8');
        const retailContent = fs.readFileSync(retailCardPath, 'utf-8');

        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(secContent)).toBe(false);
        expect(emojiRegex.test(retailContent)).toBe(false);
    });

    it('verifies sovereign multi-country currency isolation for Ethiopia and Kenya', () => {
        const etProfile = getCountryProfile('ET');
        const keProfile = getCountryProfile('KE');

        expect(etProfile.currencyCode).toBe('ETB');
        expect(keProfile.currencyCode).toBe('KES');
        expect(etProfile.currencySymbol).toBe('ETB');
        expect(keProfile.currencySymbol).toBe('KSh');
        expect(etProfile.currencyCode).not.toBe(keProfile.currencyCode);
    });
});
