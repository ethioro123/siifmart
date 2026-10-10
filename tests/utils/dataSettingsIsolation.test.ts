import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Data Management Settings Apple HIG & Sovereign Isolation', () => {
    const dataSettingsPath = path.resolve(__dirname, '../../components/settings/DataSettings.tsx');

    it('verifies DataSettings.tsx is under 500 lines', () => {
        const content = fs.readFileSync(dataSettingsPath, 'utf-8');
        const lines = content.split('\n').length;
        expect(lines).toBeLessThanOrEqual(500);
    });

    it('verifies zero legacy woody/muddy colors exist in modernized data settings', () => {
        const content = fs.readFileSync(dataSettingsPath, 'utf-8');
        const legacyHexPatterns = [
            '#FAF8F5', '#faf8f5',
            '#E2DCCE', '#e2dcce',
            '#18201B', '#18201b',
            '#2C5E3B', '#2c5e3b',
            '#1E3F27', '#1e3f27',
            '#A9CBA2', '#a9cba2'
        ];

        legacyHexPatterns.forEach(hex => {
            expect(content).not.toContain(hex);
        });
    });

    it('verifies zero raw Unicode emojis in data settings', () => {
        const content = fs.readFileSync(dataSettingsPath, 'utf-8');
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(content)).toBe(false);
    });

    it('verifies backup and export files incorporate sovereign activeCountry scoping', () => {
        const content = fs.readFileSync(dataSettingsPath, 'utf-8');

        // Scoped backup file naming
        expect(content).toContain('siifmart_${activeCountry.toLowerCase()}_backup_');

        // Scoped product & customer export naming
        expect(content).toContain('products_catalog_${activeCountry.toLowerCase()}_');
        expect(content).toContain('customers_registry_${activeCountry.toLowerCase()}_');
    });
});
