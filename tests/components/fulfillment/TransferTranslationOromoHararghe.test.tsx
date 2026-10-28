import { describe, it, expect } from 'vitest';
import { transfer } from '../../../utils/translations/warehouse/transfer';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = transfer as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Transfer Tab East Hararghe (Harargee Bahaa) Localization', () => {
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
        // Root Transfer: Dabarsa Meeshaa
        expect(dict.or).toBe('Dabarsa Meeshaa');
        expect(getOr('transferHub')).toBe('Wiirtuu Dabarsa Meeshaa');
        expect(getOr('interSiteTransfers')).toBe('Dabarsa Manna-Kuusaa');
        expect(getOr('activeTransfers')).toBe('Dabarsawwan Hojirra Jiran');
        expect(getOr('transferCenter')).toBe('Wiirtuu Dabarsaa');
        expect(getOr('discrepancyCount')).toBe('Baqiyyaa');

        // Modes: Smart replenish, bulk push, wave
        expect(getOr('smartReplenish')).toBe('Guutuu Qaxalee');
        expect(getOr('bulkPush')).toBe('Rabsa Meeshaa Bal\'aa');
        expect(getOr('singleProductMode')).toBe('Oomisha Qeenxee');
        expect(getOr('multipleProductsMode')).toContain('Marsaa');
        expect(getOr('submitForApproval')).toBe('Mirkaneessaaf Dhiyeessi');

        // Receiving & Custody Handshake
        expect(getOr('shipmentReceiving')).toBe('Fudhannaa Dabarsa Meeshaa');
        expect(getOr('receiptAccountability')).toBe('Itti-Gaafatamummaa Fudhannaa');
        expect(getOr('blindCountRecordedToReceiver').toLowerCase()).toContain('lakkoofsi ija-cufaa');
        expect(getOr('relinquishingCustody')).toContain('Dabarsa Harkaa');
        expect(getOr('assumingCustody')).toContain('Fudhannaa Harkaa');
        expect(getOr('transitDriverCourier')).toBe('Konkolaachisaa Imalaa / Ergaa');
        expect(getOr('storeReceivingCustodian')).toBe('Eegduu Fudhannaa Suuqaa');
        expect(getOr('reviseCounts')).toBe('Lakkoofsa Irra-Deebi\'ii Ilaali');
        expect(getOr('acceptVarianceAndTakeCustody')).toBe('Baqiyyaa Fudhadhuuti Harkatti Fudhadhu');
        expect(getOr('confirmReceiptAndTakeCustody')).toBe('Fudhannaa Mirkaneessiitii Harkatti Fudhadhu');

        // Condition & Statuses
        expect(getOr('conditionGood')).toBe('Haala Gaarii');
        expect(getOr('conditionDamaged')).toBe('Kan Miidhame');
        expect(getOr('conditionShortMissing')).toContain('Hir\'ate');
        expect(getOr('inTransit')).toBe('Karaarra Jira');
        expect(getOr('delivered')).toBe('Geessifameera');
        expect(getOr('received')).toBe('Fudhatameera');
    });

    it('validates Amharic terms for parity', () => {
        expect(dict.am).toBe('ማስተላለፍ');
        expect(getAm('transferHub')).toBe('የማስተላለፊያ ማዕከል');
        expect(getAm('receiptAccountability')).toBe('የደረሰኝ ተጠያቂነት');
        expect(getAm('inTransit')).toBe('በጉዞ ላይ');
    });

    it('validates English terms for parity', () => {
        expect(dict.en).toBe('Transfer');
        expect(getEn('transferHub')).toBe('Transfer Hub');
        expect(getEn('receiptAccountability')).toBe('Receipt Accountability');
        expect(getEn('inTransit')).toBe('In-Transit');
    });
});
