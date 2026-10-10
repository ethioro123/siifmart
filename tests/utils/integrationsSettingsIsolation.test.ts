import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Integrations & API Settings Apple HIG & Sovereign Isolation', () => {
    const integrationsPath = path.resolve(__dirname, '../../components/settings/IntegrationsSettings.tsx');

    it('verifies IntegrationsSettings.tsx is under 500 lines', () => {
        const content = fs.readFileSync(integrationsPath, 'utf-8');
        const lines = content.split('\n').length;
        expect(lines).toBeLessThanOrEqual(500);
    });

    it('verifies zero legacy woody/muddy colors exist in modernized integrations settings', () => {
        const content = fs.readFileSync(integrationsPath, 'utf-8');
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

    it('verifies zero raw Unicode emojis in integrations settings', () => {
        const content = fs.readFileSync(integrationsPath, 'utf-8');
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(content)).toBe(false);
    });

    it('verifies sovereign payment rails exist distinctly for Ethiopia and Kenya', () => {
        const content = fs.readFileSync(integrationsPath, 'utf-8');

        // Ethiopia specific
        expect(content).toContain('Telebirr SuperApp');
        expect(content).toContain('CBE Birr API');

        // Kenya specific
        expect(content).toContain('M-Pesa Daraja 2.0');
        expect(content).toContain('Pesapal Gateway');

        // Conditional branch on activeCountry
        expect(content).toContain("activeCountry === 'ET'");
    });
});
