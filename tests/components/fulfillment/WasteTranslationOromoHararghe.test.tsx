import { describe, it, expect } from 'vitest';
import { waste } from '../../../utils/translations/warehouse/waste';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = waste as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Waste Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(25);

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
        // Root Waste: Balleessa fi Miidhama
        expect(dict.or).toBe('Balleessa fi Miidhama');
        expect(getOr('wasteManagementTitle').toLowerCase()).toContain('balleessa');
        expect(getOr('wasteManagementTitle').toLowerCase()).toContain('qisaasa');
        expect(getOr('logWaste').toLowerCase()).toContain('balleessa');
        expect(getOr('wasteBasketTitle').toLowerCase()).toContain('balleessa');
        expect(getOr('confirmDisposal').toLowerCase()).toContain('balleessuu');

        // Reasons
        expect(getOr('reasonExpired').toLowerCase()).toContain('darbe');
        expect(getOr('reasonDamaged').toLowerCase()).toContain('miidhame');
        expect(getOr('reasonSpoiled').toLowerCase()).toContain('balleeffame');
        expect(getOr('reasonTheft').toLowerCase()).toContain('hanna');

        // Basket & Summary
        expect(getOr('totalValueLoss').toLowerCase()).toContain('badde');
        expect(getOr('clearAll').toLowerCase()).toContain('qulqulleessi');

        // History & Attribution
        expect(getOr('wasteLogsTitle').toLowerCase()).toContain('balleessaa');
        expect(getOr('writeOffsBadge').toLowerCase()).toBe('haqama');
        expect(getOr('unitsWord').toLowerCase()).toBe('qodaa');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('wasteBasketTitle')).toContain('{count}');
        expect(getAm('wasteBasketTitle')).toContain('{count}');
        expect(getOr('wasteBasketTitle')).toContain('{count}');

        expect(getEn('highValueWasteConfirm')).toContain('{formattedValue}');
        expect(getAm('highValueWasteConfirm')).toContain('{formattedValue}');
        expect(getOr('highValueWasteConfirm')).toContain('{formattedValue}');

        expect(getEn('byWorker')).toContain('{name}');
        expect(getAm('byWorker')).toContain('{name}');
        expect(getOr('byWorker')).toContain('{name}');
    });
});
