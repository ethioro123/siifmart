import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Gamification Settings Apple HIG & Sovereign Isolation', () => {
    const gamificationFiles = [
        'components/settings/GamificationSettings.tsx',
        'components/settings/gamification/WarehouseTab.tsx',
        'components/settings/gamification/POSTab.tsx',
        'components/settings/gamification/components/POSPointRulesList.tsx',
        'components/settings/gamification/components/POSRoleDistributionList.tsx',
        'components/settings/gamification/BonusTierModal.tsx',
        'components/settings/gamification/POSRoleModal.tsx',
        'components/settings/gamification/WarehouseRuleModal.tsx',
        'components/settings/gamification/PointRuleModal.tsx'
    ];

    it('verifies all 9 gamification files are strictly <= 500 lines', () => {
        gamificationFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').length;
            expect(lines, `${relPath} exceeds 500 lines (${lines} lines)`).toBeLessThanOrEqual(500);
        });
    });

    it('verifies zero legacy woody/muddy colors in any gamification component', () => {
        const legacyHexPatterns = [
            '#FAF8F5', '#faf8f5',
            '#E2DCCE', '#e2dcce',
            '#18201B', '#18201b',
            '#2C5E3B', '#2c5e3b',
            '#1E3F27', '#1e3f27',
            '#A9CBA2', '#a9cba2'
        ];

        gamificationFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            legacyHexPatterns.forEach(hex => {
                expect(content, `${relPath} contains legacy hex ${hex}`).not.toContain(hex);
            });
        });
    });

    it('verifies zero raw Unicode emojis across all gamification files', () => {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        gamificationFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(emojiRegex.test(content), `${relPath} contains raw unicode emojis`).toBe(false);
        });
    });

    it('verifies sovereign country scoping in GamificationSettings, WarehouseTab, and POSTab', () => {
        const mainPath = path.resolve(__dirname, '../../components/settings/GamificationSettings.tsx');
        const mainContent = fs.readFileSync(mainPath, 'utf-8');
        expect(mainContent).toContain('getCountryProfile(activeCountry)');
        expect(mainContent).toContain('{countryProfile.name} ({activeCountry})');

        const warehousePath = path.resolve(__dirname, '../../components/settings/gamification/WarehouseTab.tsx');
        const warehouseContent = fs.readFileSync(warehousePath, 'utf-8');
        expect(warehouseContent).toContain('getCountryProfile(activeCountry)');
        expect(warehouseContent).toContain('countryProfile.currencySymbol || countryProfile.currencyCode');

        const posPath = path.resolve(__dirname, '../../components/settings/gamification/POSTab.tsx');
        const posContent = fs.readFileSync(posPath, 'utf-8');
        expect(posContent).toContain('getCountryProfile(activeCountry)');
        expect(posContent).toContain('countryProfile.currencySymbol || countryProfile.currencyCode');
    });
});
