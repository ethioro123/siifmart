import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Notification Settings Apple HIG & Sovereign SMS Isolation', () => {
    const notifPath = path.resolve(__dirname, '../../components/settings/NotificationSettings.tsx');

    it('verifies NotificationSettings.tsx is under 500 lines', () => {
        const content = fs.readFileSync(notifPath, 'utf-8');
        const lines = content.split('\n').length;
        expect(lines).toBeLessThanOrEqual(500);
    });

    it('verifies zero legacy woody/muddy colors exist in modernized notification settings', () => {
        const content = fs.readFileSync(notifPath, 'utf-8');
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

    it('verifies zero raw Unicode emojis in notification settings', () => {
        const content = fs.readFileSync(notifPath, 'utf-8');
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(content)).toBe(false);
    });

    it('verifies sovereign SMS gateways are defined for both Ethiopia and Kenya', () => {
        const content = fs.readFileSync(notifPath, 'utf-8');

        // Ethiopia specific cellular provider
        expect(content).toContain('Ethio Telecom Enterprise SMS');
        expect(content).toContain('+251 911 000 000');

        // Kenya specific cellular provider
        expect(content).toContain('Safaricom SMS');
        expect(content).toContain('+254 700 000 000');

        // Country branching
        expect(content).toContain("activeCountry === 'ET'");
    });
});
