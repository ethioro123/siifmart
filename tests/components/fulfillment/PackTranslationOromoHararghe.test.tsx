import { describe, it, expect } from 'vitest';
import { packing } from '../../../utils/translations/warehouse/packing';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = packing as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Pack Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
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
        // Root Packing: Saamsuu / Saamsaa / Paakeejii
        expect(dict.or).toBe('Saamsuu Meeshaa');
        expect(getOr('packJobs').toLowerCase()).toContain('saams');
        expect(getOr('startPacking').toLowerCase()).toContain('saams');
        expect(getOr('startScanningAndPack').toLowerCase()).toContain('saams');
        expect(getOr('confirmPackCaps').toLowerCase()).toContain('saams');
        expect(getOr('completeAndSeal').toLowerCase()).toContain('saams');

        // CRITICAL: Ensure predatory term "saamuu" (robbery/looting) is NEVER used standalone for packing
        // All occurrences must be saamsuu, saamsaa, etc.
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        keys.forEach((key) => {
            const oromoText = dict[key]?.or || '';
            const words = oromoText.toLowerCase().split(/[\s,.'":;!?-]+/);
            // "saamuu" alone means robbery/looting
            expect(words).not.toContain('saamuu');
            expect(words).not.toContain('saamame');
            expect(words).not.toContain('saamuun');
        });

        // Discrepancy & Variance uses Baqiyyaa
        expect(getOr('flagDiscrepancy').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('packingWeightVarianceWarning').toLowerCase()).toContain('baqiyyaa');

        // Blind carton count uses Mirkaneessa Ija-Cufaa Saanduqaa
        expect(getOr('blindCartonVerification').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('enterPhysicalQtyInCarton').toLowerCase()).toContain('saanduqa');

        // Weigh & Seal uses Madaaluu fi Saamsuu
        expect(getOr('weighAndSeal').toLowerCase()).toContain('madaaluu fi saamsuu');
        expect(getOr('scaleWeightVerification').toLowerCase()).toContain('madaal');

        // Packaging directives: Cold chain, Tamper tape, Fragile protection
        expect(getOr('coldChain').toLowerCase()).toContain('qabbana');
        expect(getOr('bubbleWrap').toLowerCase()).toContain('huubboo');
        expect(getOr('icePacks').toLowerCase()).toContain('cabbee');
        expect(getOr('securityTamperTape').toLowerCase()).toContain('teepii nageenyaa');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('linesVerified')).toContain('{total}');
        expect(getAm('linesVerified')).toContain('{total}');
        expect(getOr('linesVerified')).toContain('{total}');

        expect(getEn('linesVerifiedSimple')).toContain('{completed}');
        expect(getEn('linesVerifiedSimple')).toContain('{total}');
        expect(getAm('linesVerifiedSimple')).toContain('{completed}');
        expect(getAm('linesVerifiedSimple')).toContain('{total}');
        expect(getOr('linesVerifiedSimple')).toContain('{completed}');
        expect(getOr('linesVerifiedSimple')).toContain('{total}');

        expect(getEn('manifestItemsAwaitingScan')).toContain('{count}');
        expect(getAm('manifestItemsAwaitingScan')).toContain('{count}');
        expect(getOr('manifestItemsAwaitingScan')).toContain('{count}');

        expect(getEn('countInUnit')).toContain('{unit}');
        expect(getAm('countInUnit')).toContain('{unit}');
        expect(getOr('countInUnit')).toContain('{unit}');

        expect(getEn('packingWeightVarianceWarning')).toContain('{weight}');
        expect(getEn('packingWeightVarianceWarning')).toContain('{variance}');
        expect(getEn('packingWeightVarianceWarning')).toContain('{expected}');
        expect(getEn('packingWeightVarianceWarning')).toContain('{tolerance}');
        expect(getAm('packingWeightVarianceWarning')).toContain('{weight}');
        expect(getAm('packingWeightVarianceWarning')).toContain('{variance}');
        expect(getAm('packingWeightVarianceWarning')).toContain('{expected}');
        expect(getAm('packingWeightVarianceWarning')).toContain('{tolerance}');
        expect(getOr('packingWeightVarianceWarning')).toContain('{weight}');
        expect(getOr('packingWeightVarianceWarning')).toContain('{variance}');
        expect(getOr('packingWeightVarianceWarning')).toContain('{expected}');
        expect(getOr('packingWeightVarianceWarning')).toContain('{tolerance}');
    });
});
