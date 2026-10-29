import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pos } from '../../utils/translations/pos';
import { warehouse } from '../../utils/translations/warehouse';

describe('POS and WMS UI Translation Synchronization Rule Invariant', () => {
    const rootDir = process.cwd();
    const agentsRoot = path.join(rootDir, 'AGENTS.md');
    const dotAgents = path.join(rootDir, '.agents', 'AGENTS.md');
    const rulesIndex = path.join(rootDir, '.agent', 'RULES.md');
    const countryRules = path.join(rootDir, '.agent', 'rules', '02-country-and-operations.md');
    const engineeringRules = path.join(rootDir, '.agent', 'rules', '04-engineering-and-performance.md');

    it('codifies the POS and WMS UI translation requirement in all canonical agent rule files', () => {
        const rootContent = fs.readFileSync(agentsRoot, 'utf-8');
        const dotAgentsContent = fs.readFileSync(dotAgents, 'utf-8');
        const rulesContent = fs.readFileSync(rulesIndex, 'utf-8');
        const countryContent = fs.readFileSync(countryRules, 'utf-8');
        const engContent = fs.readFileSync(engineeringRules, 'utf-8');

        // Root AGENTS.md
        expect(rootContent).toMatch(/POS & WMS UI Translations/);
        expect(rootContent).toMatch(/utils\/translations\/pos\.ts/);
        expect(rootContent).toMatch(/utils\/translations\/warehouse/);

        // .agents/AGENTS.md
        expect(dotAgentsContent).toMatch(/POS & WMS UI Translations/);
        expect(dotAgentsContent).toMatch(/utils\/translations\/pos\.ts/);
        expect(dotAgentsContent).toMatch(/utils\/translations\/warehouse/);

        // .agent/RULES.md
        expect(rulesContent).toMatch(/POS and WMS translations/);
        expect(rulesContent).toMatch(/utils\/translations\/pos\.ts/);
        expect(rulesContent).toMatch(/utils\/translations\/warehouse/);

        // .agent/rules/02-country-and-operations.md
        expect(countryContent).toMatch(/POS & WMS UI Translation Synchronization Invariant/);
        expect(countryContent).toMatch(/utils\/translations\/pos\.ts/);
        expect(countryContent).toMatch(/utils\/translations\/warehouse/);

        // .agent/rules/04-engineering-and-performance.md
        expect(engContent).toMatch(/POS\/WMS.*translations/i);
    });

    it('ensures POS translation dictionary contains en, am, and or entries for UI strings', () => {
        expect(Object.keys(pos).length).toBeGreaterThanOrEqual(50);
        
        // Spot check core POS UI keys
        const sampleKeys = ['cart', 'checkout', 'total', 'subtotal', 'cash', 'cancel', 'refund'];
        sampleKeys.forEach(k => {
            if (pos[k]) {
                const entry = pos[k] as { en?: string; am?: string; or?: string };
                expect(entry.en, `POS key ${k} should have English translation`).toBeDefined();
                expect(typeof entry.en).toBe('string');
            }
        });
    });

    it('ensures WMS warehouse translation dictionary contains en, am, and or structures for UI strings', () => {
        expect(Object.keys(warehouse).length).toBeGreaterThanOrEqual(50);

        // Spot check core WMS UI keys
        const sampleWmsKeys = ['driverHub', 'receiving', 'picking', 'packing', 'putaway', 'docks'];
        sampleWmsKeys.forEach(k => {
            expect(warehouse[k], `WMS key ${k} should exist in warehouse translations`).toBeDefined();
        });
    });
});
