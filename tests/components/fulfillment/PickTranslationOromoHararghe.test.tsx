import { describe, it, expect } from 'vitest';
import { picking } from '../../../utils/translations/warehouse/picking';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = picking as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Pick Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(50);

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
        // Root Picking / Picking queue uses Buqqisa / Buqqisuu
        expect(dict.or).toBe('Buqqisa Meeshaa');
        expect(getOr('pickQueue').toLowerCase()).toContain('buqqisa');
        expect(getOr('pickJobs').toLowerCase()).toContain('buqqisa');
        expect(getOr('pickHistory').toLowerCase()).toContain('buqqisa');
        expect(getOr('tapToStartPicking').toLowerCase()).toContain('buqqisuu');
        expect(getOr('itemsToPick').toLowerCase()).toContain('buqqifam');
        expect(getOr('optimalPickRoute').toLowerCase()).toContain('buqqisa');
        expect(getOr('sequenceItinerary').toLowerCase()).toContain('buqqisa');

        // Short pick uses Buqqisa Hir'uu / Buqqisa Gabaabaa
        expect(getOr('shortPick').toLowerCase()).toContain('buqqisa');
        expect(getOr('shortPickModeOn').toLowerCase()).toContain('buqqisa');
        expect(getOr('shortPickConfirmPrompt').toLowerCase()).toContain('buqqis');
        expect(getOr('shortPickEnterQty').toLowerCase()).toContain('buqqisa');

        // Discrepancy & Reconciliation / Empty bay
        expect(getOr('physicalDiscrepancyReconciliation').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('noStockInBay').toLowerCase()).toContain('meeshaan hin jiru');

        // Locations, Bays & Staging
        expect(getOr('pickFromThisLocation').toLowerCase()).toContain('buqqisi');
        expect(getOr('targetDropOffZone').toLowerCase()).toContain('geessaa');
        expect(getOr('sourceWarehouse').toLowerCase()).toContain('kuusaa maddaa');
        expect(getOr('stagingDirectiveNotice').toLowerCase()).toContain('buqqifame');

        // Confirmation & Verification
        expect(getOr('confirmPick').toLowerCase()).toContain('buqqisa mirkaneessi');
        expect(getOr('completePick').toLowerCase()).toContain('buqqisa xumuri');
        expect(getOr('reviewHandover').toLowerCase()).toContain('irra deebi\'ii ilaali');
        expect(getOr('linesVerified').toLowerCase()).toContain('mirkanaa\'an');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('stopsAndUnits')).toContain('{stops}');
        expect(getEn('stopsAndUnits')).toContain('{units}');
        expect(getAm('stopsAndUnits')).toContain('{stops}');
        expect(getAm('stopsAndUnits')).toContain('{units}');
        expect(getOr('stopsAndUnits')).toContain('{stops}');
        expect(getOr('stopsAndUnits')).toContain('{units}');

        expect(getEn('locationsCount')).toContain('{count}');
        expect(getAm('locationsCount')).toContain('{count}');
        expect(getOr('locationsCount')).toContain('{count}');

        expect(getEn('linesVerified')).toContain('{completed}');
        expect(getEn('linesVerified')).toContain('{total}');
        expect(getAm('linesVerified')).toContain('{completed}');
        expect(getAm('linesVerified')).toContain('{total}');
        expect(getOr('linesVerified')).toContain('{completed}');
        expect(getOr('linesVerified')).toContain('{total}');

        expect(getEn('linesForPackingShortages')).toContain('{picked}');
        expect(getEn('linesForPackingShortages')).toContain('{short}');
        expect(getAm('linesForPackingShortages')).toContain('{picked}');
        expect(getAm('linesForPackingShortages')).toContain('{short}');
        expect(getOr('linesForPackingShortages')).toContain('{picked}');
        expect(getOr('linesForPackingShortages')).toContain('{short}');
    });
});
