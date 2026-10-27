import { describe, it, expect } from 'vitest';
import { receiving } from '../../../utils/translations/warehouse/receiving';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = receiving as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Receive Tab East Hararghe (Harargee Bahaa) Localization', () => {
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
        // Discrepancy & Variance uses Baqiyyaa (signature East Hararghe trading term)
        expect(getOr('discrepancyDetected').toLowerCase()).toContain('baqiyyaa');

        // Zero-Trust Blind count uses Lakkoofsa Ija-Cufaa / To'annoo Ija-Cufaa
        expect(getOr('blindCountBadge').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('blindAudit').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('blindModeActiveTitle').toLowerCase()).toContain('ija-cufaa');

        // Intake & Reception uses Simannaa / Fudhannaa
        expect(getOr('manifestIntake').toLowerCase()).toContain('simannaa');
        expect(getOr('inboundManifestIntake').toLowerCase()).toContain('simannaa');
        expect(getOr('intakeCount').toLowerCase()).toContain('simannaa');
        expect(getOr('intakeStatus').toLowerCase()).toContain('simannaa');
        expect(getOr('receivingQueue').toLowerCase()).toContain('fudhannaa');
        expect(getOr('confirmReceipt').toLowerCase()).toContain('fudhannaa');

        // Putaway uses Kaawwisa / Kaa'i
        expect(getOr('confirmAndCreatePutaway').toLowerCase()).toContain('kaawwisa');
        expect(getOr('printAndPutaway').toLowerCase()).toContain("kaa'i");
        expect(getOr('stockPutaway').toLowerCase()).toContain('kaahuu');

        // Quality and inspection
        expect(getOr('qualityBatch').toLowerCase()).toContain('qulqullina');
        expect(getOr('startQualityAndCount').toLowerCase()).toContain('qulqullina');
        expect(getOr('readyForQualityAudit').toLowerCase()).toContain('qulqullina');

        // Dock handover uses Dabarsuu / Buufata
        expect(getOr('dockHandover').toLowerCase()).toContain('dabarsuu');
        expect(getOr('reviewAndHandover').toLowerCase()).toContain('dabarsuu');
        expect(getOr('dockLabel').toLowerCase()).toContain('buufata');
        expect(getOr('dockHandoverActionsTitle').toLowerCase()).toContain('buufata');

        // Queue uses Tarree
        expect(getOr('queueShort').toLowerCase()).toBe('tarree');
        expect(getOr('receivingQueue').toLowerCase()).toContain('tarree');

        // Pack & Packages uses Paakeejii
        expect(getOr('package').toLowerCase()).toBe('paakeejii');
        expect(getOr('packages').toLowerCase()).toBe('paakeejiiwwan');

        // Partial receipt uses Gariixee
        expect(getOr('partial').toLowerCase()).toBe('gariixee');
        expect(getOr('partialReceipt').toLowerCase()).toBe('fudhannaa gariixee');
        expect(getOr('confirmPartialReceipt').toLowerCase()).toBe('fudhannaa gariixee mirkaneessi');
        expect(getOr('statusPartial').toLowerCase()).toBe('gariixee');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('unitsCount')).toContain('{count}');
        expect(getAm('unitsCount')).toContain('{count}');
        expect(getOr('unitsCount')).toContain('{count}');

        expect(getEn('poFullyReceived')).toContain('{id}');
        expect(getAm('poFullyReceived')).toContain('{id}');
        expect(getOr('poFullyReceived')).toContain('{id}');

        expect(getEn('countedNotSaved')).toContain('{count}');
        expect(getAm('countedNotSaved')).toContain('{count}');
        expect(getOr('countedNotSaved')).toContain('{count}');

        expect(getEn('splitNum')).toContain('{num}');
        expect(getAm('splitNum')).toContain('{num}');
        expect(getOr('splitNum')).toContain('{num}');

        expect(getEn('countedQtyOnLabelNotice')).toContain('{count}');
        expect(getAm('countedQtyOnLabelNotice')).toContain('{count}');
        expect(getOr('countedQtyOnLabelNotice')).toContain('{count}');

        expect(getEn('mappedToProduct')).toContain('{name}');
        expect(getAm('mappedToProduct')).toContain('{name}');
        expect(getOr('mappedToProduct')).toContain('{name}');

        expect(getEn('minutesAgo')).toContain('{count}');
        expect(getAm('minutesAgo')).toContain('{count}');
        expect(getOr('minutesAgo')).toContain('{count}');

        expect(getEn('hoursAgo')).toContain('{count}');
        expect(getAm('hoursAgo')).toContain('{count}');
        expect(getOr('hoursAgo')).toContain('{count}');
    });
});
