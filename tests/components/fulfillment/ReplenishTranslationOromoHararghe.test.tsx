import { describe, it, expect } from 'vitest';
import { replenish } from '../../../utils/translations/warehouse/replenish';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = replenish as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Replenish Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(30);

        const missingOr: string[] = [];
        const missingAm: string[] = [];
        const missingEn: string[] = [];

        keys.forEach((key) => {
            const entry = dict[key];
            if (!entry?.or || entry.or.trim() === '') missingOr.push(key);
            if (!entry?.am || entry.am.trim() === '') missingAm.push(key);
            if (!entry?.en || entry.en.trim() === '') missingEn.push(key);
        });

        expect(missingOr, `Missing or translation for keys: ${missingOr.join(', ')}`).toHaveLength(0);
        expect(missingAm, `Missing am translation for keys: ${missingAm.join(', ')}`).toHaveLength(0);
        expect(missingEn, `Missing en translation for keys: ${missingEn.join(', ')}`).toHaveLength(0);
    });

    it('faithfully applies East Hararghe (Harargee Bahaa) commercial dialect terminology', () => {
        // Root Replenishment: Deebisanii Guutuu / Guutuu Meeshaa
        expect(dict.or).toBe('Deebisanii Guutuu');
        expect(getOr('replenishmentMatrix').toLowerCase()).toContain('guutuu');
        expect(getOr('forwardPickHub').toLowerCase()).toContain('guutuu');
        expect(getOr('optimizationStrategy').toLowerCase()).toContain('guutuu');
        expect(getOr('initializeOptimization').toLowerCase()).toContain('guutuu');
        expect(getOr('replenishHistory').toLowerCase()).toContain('guutuu');

        // Status & Urgency levels
        expect(getOr('urgency').toLowerCase()).toContain('ariif');
        expect(getOr('critical').toLowerCase()).toContain('hamaa');
        expect(getOr('criticalStatus').toLowerCase()).toContain('hamaa');
        expect(getOr('low').toLowerCase()).toContain('gadi');
        expect(getOr('lowStatus').toLowerCase()).toContain('gadi');
        expect(getOr('optimal').toLowerCase()).toContain('gahaa');
        expect(getOr('stable').toLowerCase()).toContain('tasgabbaa');
        expect(getOr('backlogged').toLowerCase()).toContain('duubatti');

        // Storage & Restock
        expect(getOr('targetRestock').toLowerCase()).toContain('guutuu');
        expect(getOr('bulkStorage').toLowerCase()).toContain('kuusaa tuulaa');
        expect(getOr('stockLevel').toLowerCase()).toContain('sadarkaa kuusaa');
        expect(getOr('systemOptimized').toLowerCase()).toContain('guutuu dha');

        // Attribution & History
        expect(getOr('completedByColon').toLowerCase()).toContain('kan xumure');
        expect(getOr('replenishHistorySubtitle').toLowerCase()).toContain('guutuu');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('alertsCount')).toContain('{count}');
        expect(getAm('alertsCount')).toContain('{count}');
        expect(getOr('alertsCount')).toContain('{count}');

        expect(getEn('selectedForOptimization')).toContain('{count}');
        expect(getAm('selectedForOptimization')).toContain('{count}');
        expect(getOr('selectedForOptimization')).toContain('{count}');

        expect(getEn('executeCount')).toContain('{count}');
        expect(getAm('executeCount')).toContain('{count}');
        expect(getOr('executeCount')).toContain('{count}');

        expect(getEn('initializedSequences')).toContain('{count}');
        expect(getAm('initializedSequences')).toContain('{count}');
        expect(getOr('initializedSequences')).toContain('{count}');

        expect(getEn('targetRestockUnits')).toContain('{units}');
        expect(getAm('targetRestockUnits')).toContain('{units}');
        expect(getOr('targetRestockUnits')).toContain('{units}');

        expect(getEn('autoCalculatedCeiling')).toContain('{maxStock}');
        expect(getAm('autoCalculatedCeiling')).toContain('{maxStock}');
        expect(getOr('autoCalculatedCeiling')).toContain('{maxStock}');

        expect(getEn('ordersAwaitingResupply')).toContain('{count}');
        expect(getAm('ordersAwaitingResupply')).toContain('{count}');
        expect(getOr('ordersAwaitingResupply')).toContain('{count}');

        expect(getEn('sequenceInitializedFor')).toContain('{sku}');
        expect(getAm('sequenceInitializedFor')).toContain('{sku}');
        expect(getOr('sequenceInitializedFor')).toContain('{sku}');
    });
});
