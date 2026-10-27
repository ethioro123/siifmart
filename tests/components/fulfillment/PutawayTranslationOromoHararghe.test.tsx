import { describe, it, expect } from 'vitest';
import { putaway } from '../../../utils/translations/warehouse/putaway';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = putaway as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Putaway Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict);
        expect(keys.length).toBeGreaterThan(60);

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
        // Putaway / Shelving / Storing uses Kaawwisa / Kaa'uu
        expect(getOr('putawayOperations').toLowerCase()).toContain("kaa'uu");
        expect(getOr('putawayJobs').toLowerCase()).toContain("kaa'uu");
        expect(getOr('storeReceivedGoods').toLowerCase()).toContain("kaa'uu");
        expect(getOr('completePutaway').toLowerCase()).toContain('kaawwisa');
        expect(getOr('livePutawayRouting').toLowerCase()).toContain('kaawwisa');

        // Bin & Bay locations use Iddoo / Bakka / Kutaa / Daandii
        expect(getOr('queueEmpty').toLowerCase()).toContain('kuusaa');
        expect(getOr('aisle').toLowerCase()).toBe('daandii');
        expect(getOr('bay').toLowerCase()).toBe('kutaa');
        expect(getOr('assignedLocation').toLowerCase()).toBe('iddoo ramadame');
        expect(getOr('suggestedLocation').toLowerCase()).toBe('iddoo eerame');
        expect(getOr('scanLocation').toLowerCase()).toContain('iddoo iskaan');
        expect(getOr('confirmLocation').toLowerCase()).toContain('iddoo mirkaneessi');
        expect(getOr('binSlotting').toLowerCase()).toContain('bakka meeshaa');

        // Review completion & verification
        expect(getOr('shelfLock').toLowerCase()).toContain('irra deebi\'ii ilaali');
        expect(getOr('reviewCompletion').toLowerCase()).toContain('irra deebi\'ii ilaali');
        expect(getOr('verifyAndStock').toLowerCase()).toContain('mirkaneessi');
        expect(getOr('itemVerification').toLowerCase()).toContain('mirkaneessuu');
        expect(getOr('confirmQuantity').toLowerCase()).toContain('mirkaneessi');

        // Overflow & Incompatible stock
        expect(getOr('overflowModeActive').toLowerCase()).toContain('dabalataa');
        expect(getOr('bayFullAssignNew').toLowerCase()).toContain('bakka biraa');
        expect(getOr('binFullFindNext').toLowerCase()).toContain('bakki guuteera');
        expect(getOr('incompatibleInventoryDetected').toLowerCase()).toContain('walsimne');

        // Intake & Staging
        expect(getOr('inboundIntake').toLowerCase()).toContain('simannaa');
        expect(getOr('inboundStagingIntake').toLowerCase()).toContain('simannaa');
        expect(getOr('stagingAndOrigin').toLowerCase()).toContain('qophii fi madda');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('stepOf')).toContain('{step}');
        expect(getEn('stepOf')).toContain('{total}');
        expect(getAm('stepOf')).toContain('{step}');
        expect(getAm('stepOf')).toContain('{total}');
        expect(getOr('stepOf')).toContain('{step}');
        expect(getOr('stepOf')).toContain('{total}');

        expect(getEn('recordedBin')).toContain('{bin}');
        expect(getAm('recordedBin')).toContain('{bin}');
        expect(getOr('recordedBin')).toContain('{bin}');

        expect(getEn('enterCountMax')).toContain('{max}');
        expect(getAm('enterCountMax')).toContain('{max}');
        expect(getOr('enterCountMax')).toContain('{max}');

        expect(getEn('unitsRecordedInSnapshot')).toContain('{count}');
        expect(getAm('unitsRecordedInSnapshot')).toContain('{count}');
        expect(getOr('unitsRecordedInSnapshot')).toContain('{count}');

        expect(getEn('checkedAt')).toContain('{time}');
        expect(getAm('checkedAt')).toContain('{time}');
        expect(getOr('checkedAt')).toContain('{time}');
    });
});
