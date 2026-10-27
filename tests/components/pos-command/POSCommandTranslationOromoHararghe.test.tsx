import { describe, it, expect } from 'vitest';
import { posCommand } from '../../../utils/translations/posCommand';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = posCommand as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('POS Command Center - East Hararghe (Harargee Bahaa) Localization', () => {
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

    it('faithfully applies East Hararghe (Harargee Bahaa) dialect terminology', () => {
        // POS Command Center uses Wiirtuu Ajajaa
        expect(getOr('title')).toContain('Ajajaa POS');

        // Cash drawer uses Kaaza / Kaaza Qarshii
        expect(getOr('drawerInactive').toLowerCase()).toContain('kaaza');
        expect(getOr('drawerClosedBannerTitle').toLowerCase()).toContain('kaaza');
        expect(getOr('drawerKicks').toLowerCase()).toContain('kaaza');
        expect(getOr('openDrawerAndStart').toLowerCase()).toContain('kaaza');

        // Discrepancy & Variance uses Baqiyyaa (signature East Hararghe market word)
        expect(getOr('thVariance').toLowerCase()).toBe('baqiyyaa');
        expect(getOr('varianceReasonText').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('noVariance').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('filterFlaggedShifts').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('supervisorVarianceAuth').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('cashDiscrepancyTitle').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('discrepanciesDetected').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('discrepanciesReported').toLowerCase()).toContain('baqiyyaa');

        // Drop safe uses Saanduqa Eegumsaa
        expect(getOr('safeLedgerLabel').toLowerCase()).toContain('saanduqa eegumsaa');
        expect(getOr('safeLedgerTitle').toLowerCase()).toContain('saanduqa eegumsaa');
        expect(getOr('totalInSafe').toLowerCase()).toContain('saanduqa eegumsaa');

        // Opening float uses Qarshii Ka'umsaa
        expect(getOr('openingCashFloat').toLowerCase()).toContain("qarshii ka'umsaa");
        expect(getOr('expectedFloatCash').toLowerCase()).toContain("qarshii ka'umsaa");

        // Receipt uses Nagahee
        expect(getOr('reprintReceipt').toLowerCase()).toContain('nagahee');
        expect(getOr('customerSaleReceipt').toLowerCase()).toContain('nagahee');
        expect(getOr('receiptId').toLowerCase()).toContain('nagahee');

        // Sign-off / Confirm uses Mirkaneessi
        expect(getOr('signOff').toLowerCase()).toContain('mirkaneessi');
        expect(getOr('signOffAndFinalize').toLowerCase()).toContain('mirkaneessi');
        expect(getOr('authorizeWithManagerPin').toLowerCase()).toContain('mirkaneessi');

        // Shift uses Shifii
        expect(getOr('startShift').toLowerCase()).toContain('shifii');
        expect(getOr('endShift').toLowerCase()).toContain('shifii');
        expect(getOr('shiftTarget').toLowerCase()).toContain('shifii');

        // Counter uses Kaawuntarii
        expect(getOr('thCashierCounter').toLowerCase()).toContain('kaawuntarii');
        expect(getOr('assignRegisterCounter').toLowerCase()).toContain('kaawuntarii');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('targetCount')).toContain('{count}');
        expect(getAm('targetCount')).toContain('{count}');
        expect(getOr('targetCount')).toContain('{count}');

        expect(getEn('processedCount')).toContain('{count}');
        expect(getAm('processedCount')).toContain('{count}');
        expect(getOr('processedCount')).toContain('{count}');

        expect(getEn('openCounterAndStart')).toContain('{counter}');
        expect(getAm('openCounterAndStart')).toContain('{counter}');
        expect(getOr('openCounterAndStart')).toContain('{counter}');

        expect(getEn('productsUpdatedRecently')).toContain('{count}');
        expect(getAm('productsUpdatedRecently')).toContain('{count}');
        expect(getOr('productsUpdatedRecently')).toContain('{count}');
    });
});
