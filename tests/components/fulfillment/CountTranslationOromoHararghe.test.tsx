import { describe, it, expect } from 'vitest';
import { count } from '../../../utils/translations/warehouse/count';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = count as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Count Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(40);

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
        // Root Count
        expect(dict.or).toBe('Lakkoofsa Meeshaa');

        // Audit & Cycle Count uses Qorannoo Kuusaa & Lakkoofsa Marsaa
        expect(getOr('inventoryAuditTitle').toLowerCase()).toContain('qorannoo kuusaa');
        expect(getOr('inventoryAuditTitle').toLowerCase()).toContain('marsaa');
        expect(getOr('dailyCycleCount').toLowerCase()).toContain('marsaa');

        // Blind count strictly uses Lakkoofsa Ija-Cufaa (NOT Lakkoofsa Dhoksaa)
        expect(getOr('blindCountInProgress').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('blindCountModeInfo').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('dailyCycleCountDesc').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('blindCountNotice').toLowerCase()).toContain('ija-cufaa');
        expect(getOr('blindCountCompletedNoVariance').toLowerCase()).toContain('ija-cufaa');

        // Ensure "dhoksaa" is NOT used for blind count in warehouse
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        keys.forEach((key) => {
            const oromoText = dict[key]?.or || '';
            expect(oromoText.toLowerCase()).not.toContain('dhoksaa');
            expect(oromoText.toLowerCase()).not.toContain('kifl-samayii');
        });

        // Variance & Discrepancies strictly uses Baqiyyaa (NOT standard Garaagarummaa)
        expect(getOr('reviewApproveVariances').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('netVarianceValue').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('variance').toLowerCase()).toBe('baqiyyaa');
        expect(getOr('approveVariance').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('varianceRequestSubmitted').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('varianceDetectedRecount').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('secondWorkerRecountNotice').toLowerCase()).toContain('baqiyyaa');
        expect(getOr('completeAndSubmitVariances').toLowerCase()).toContain('baqiyyaa');

        // Recount uses Deebisi Lakkaa'i / Irra Deebi'ii Lakkaa'i
        expect(getOr('recount').toLowerCase()).toContain('lakkaa');
        expect(getOr('recountWord').toLowerCase()).toContain('lakkaa');

        // Units uses qodaa
        expect(getOr('units').toLowerCase()).toBe('qodaa');

        // Inventory Accuracy uses Sirrummaa Kuusaa
        expect(getOr('inventoryAccuracy').toLowerCase()).toContain('kuusaa');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('recountMarkedInfo')).toContain('{name}');
        expect(getAm('recountMarkedInfo')).toContain('{name}');
        expect(getOr('recountMarkedInfo')).toContain('{name}');

        expect(getEn('varianceRequestsSentHQ')).toContain('{count}');
        expect(getAm('varianceRequestsSentHQ')).toContain('{count}');
        expect(getOr('varianceRequestsSentHQ')).toContain('{count}');

        expect(getEn('physicalCountForSku')).toContain('{sku}');
        expect(getAm('physicalCountForSku')).toContain('{sku}');
        expect(getOr('physicalCountForSku')).toContain('{sku}');
    });
});
