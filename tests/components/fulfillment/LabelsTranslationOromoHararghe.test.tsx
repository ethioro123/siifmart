import { describe, it, expect } from 'vitest';
import { labels } from '../../../utils/translations/warehouse/labels';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = labels as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Labels Tab East Hararghe (Harargee Bahaa) Localization', () => {
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
        // Root Labels: Mallattoo Meeshaa
        expect(dict.or).toContain('Mallattoo Meeshaa');
        expect(getOr('labelPrintingHub')).toBe('Wiirtuu Maxxansa Mallattoo');
        expect(getOr('managementAndIdentitySystems')).toBe('Sirna Hoggana fi Eenyummaa Meeshaa');
        expect(getOr('productsMode')).toBe('Oomishoota');
        expect(getOr('baysMode')).toBe('Iddoo Kuusaa');

        // Location & Bay nomenclature
        expect(getOr('zoneTitle')).toBe('Zoonii');
        expect(getOr('aisleTitle')).toBe('Daandii Kuusaa');
        expect(getOr('bayTitle')).toContain('Iddoo');
        expect(getOr('generateLocationLabelButton')).toContain('MALLATTOO IDDOO UUMI');

        // Product search & matching
        expect(getOr('searchProductOrScanSku')).toContain('Maqaa Oomishaa');
        expect(getOr('matchedBadge')).toBe('Walsimeera');
        expect(getOr('noUniqueProductMatch')).toContain('Oomishni walsimu hin argamne');
        expect(getOr('printQtyHeader')).toContain('BAAY\'INA MAXXANSAA');

        // Verification & Scannability
        expect(getOr('opticalVerificationLabel')).toBe('Mirkaneessa Iskaanii');
        expect(getOr('scannableBadge')).toBe('Kan Iskaanamu');
        expect(getOr('retailPriceLabel')).toBe('Gatii Quncheessaa');
        expect(getOr('classificationLabel')).toBe('Ramaddii Meeshaa');
    });

    it('validates Amharic terms for parity', () => {
        expect(dict.am).toBe('መለያዎች');
        expect(getAm('labelPrintingHub')).toBe('የመለያ ማተሚያ ማዕከል');
        expect(getAm('opticalVerificationLabel')).toBe('የኦፕቲካል ማረጋገጫ');
        expect(getAm('scannableBadge')).toBe('ሊቃኝ የሚችል');
    });

    it('validates English terms for parity', () => {
        expect(dict.en).toBe('Labels');
        expect(getEn('labelPrintingHub')).toBe('Label Printing Hub');
        expect(getEn('opticalVerificationLabel')).toBe('Optical Verification');
        expect(getEn('scannableBadge')).toBe('Scannable');
    });
});
