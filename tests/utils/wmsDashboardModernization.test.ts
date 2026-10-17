import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('WMS Dashboard Apple HIG & Guidelines Compliance', () => {
    const wmsDashboardFiles = [
        'pages/WMSDashboard.tsx',
        'components/wms-dashboard/DashboardFlowDynamics.tsx',
        'components/wms-dashboard/DashboardLeaderboard.tsx',
        'components/wms-dashboard/DashboardStreamMonitor.tsx',
        'components/wms-dashboard/ZoneOccupancyCard.tsx',
        'components/SiteRoster.tsx',
        'components/RosterManager.tsx',
        'components/DateRangeSelector.tsx'
    ];

    it('verifies all WMS Dashboard files are strictly <= 500 lines', () => {
        wmsDashboardFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').length;
            expect(lines, `${relPath} exceeds 500 lines (${lines} lines)`).toBeLessThanOrEqual(500);
        });
    });

    it('verifies zero legacy woody/muddy hex colors exist in WMS Dashboard files', () => {
        const legacyHexPatterns = [
            '#FAF8F5', '#faf8f5',
            '#E2DCCE', '#e2dcce',
            '#18201B', '#18201b',
            '#2C5E3B', '#2c5e3b',
            '#1E3F27', '#1e3f27',
            '#A9CBA2', '#a9cba2',
            '#4D6E56', '#4d6e56',
            '#7A9E83', '#7a9e83',
            '#EAE5D9', '#eae5d9'
        ];

        wmsDashboardFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            legacyHexPatterns.forEach(hex => {
                expect(content, `${relPath} contains legacy hex ${hex}`).not.toContain(hex);
            });
        });
    });

    it('verifies zero raw Unicode emojis across all WMS Dashboard components', () => {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        wmsDashboardFiles.forEach(relPath => {
            const filePath = path.resolve(__dirname, '../../', relPath);
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(emojiRegex.test(content), `${relPath} contains raw unicode emojis`).toBe(false);
        });
    });

    it('verifies sovereign country scoping in WMSDashboard.tsx', () => {
        const mainPath = path.resolve(__dirname, '../../pages/WMSDashboard.tsx');
        const content = fs.readFileSync(mainPath, 'utf-8');
        expect(content).toContain('getCountryProfile(activeCountry)');
        expect(content).toContain('countryProfile={countryProfile}');
    });

    it('verifies Apple HIG concentric radii and theme tokens', () => {
        const mainPath = path.resolve(__dirname, '../../pages/WMSDashboard.tsx');
        const content = fs.readFileSync(mainPath, 'utf-8');
        expect(content).toContain('var(--theme-bg-card)');
        expect(content).toContain('var(--theme-border)');
        expect(content).not.toContain('backdrop-blur-md');
        expect(content).not.toContain('backdrop-blur-2xl');
    });
});
