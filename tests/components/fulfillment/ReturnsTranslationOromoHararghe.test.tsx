import { describe, it, expect } from 'vitest';
import { returns } from '../../../utils/translations/warehouse/returns';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = returns as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Returns Tab East Hararghe (Harargee Bahaa) Localization', () => {
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
        // Root Returns: Deebisa Meeshaa
        expect(dict.or).toBe('Deebisa Meeshaa');
        expect(getOr('returnsManagementRMA').toLowerCase()).toContain('deebisa meeshaa');
        expect(getOr('processReturn').toLowerCase()).toContain('deebisa');
        expect(getOr('scanOrderReceipt').toLowerCase()).toContain('nagahee ajajaa');
        expect(getOr('findButton').toLowerCase()).toBe('barbaadi');

        // Reasons & Conditions
        expect(getOr('reasonDefective').toLowerCase()).toContain('mijaja');
        expect(getOr('reasonWrongItem').toLowerCase()).toContain('dogoggoraa');
        expect(getOr('reasonChangedMind').toLowerCase()).toContain('yaada jijjiirrate');
        expect(getOr('reasonExpired').toLowerCase()).toContain('darbe');
        expect(getOr('conditionNewSealed').toLowerCase()).toContain('saamsame');
        expect(getOr('conditionOpenBox').toLowerCase()).toContain('baname');
        expect(getOr('conditionDamaged').toLowerCase()).toContain('miidhame');

        // Financial & Actions
        expect(getOr('actionRestock').toLowerCase()).toContain('kuusi');
        expect(getOr('totalRefundLabel').toLowerCase()).toContain('kaffaltii deebii');
        expect(getOr('processRefundButton').toLowerCase()).toContain('kaffaltii deebii');
        expect(getOr('subtotalLabel').toLowerCase()).toBe('gatii cufaa');

        // History & Modal
        expect(getOr('returnToWarehouseTitle').toLowerCase()).toContain('manna-kuusaatti');
        expect(getOr('confirmProcessReturnPrompt').toLowerCase()).toContain('deebisa');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('orderNumberPrefix')).toContain('{id}');
        expect(getAm('orderNumberPrefix')).toContain('{id}');
        expect(getOr('orderNumberPrefix')).toContain('{id}');

        expect(getEn('rmaGeneratedSublabel')).toContain('{id}');
        expect(getAm('rmaGeneratedSublabel')).toContain('{id}');
        expect(getOr('rmaGeneratedSublabel')).toContain('{id}');

        expect(getEn('confirmReturnStockAdjustmentWarning')).toContain('{count}');
        expect(getAm('confirmReturnStockAdjustmentWarning')).toContain('{count}');
        expect(getOr('confirmReturnStockAdjustmentWarning')).toContain('{count}');
        expect(getEn('confirmReturnStockAdjustmentWarning')).toContain('{role}');
        expect(getAm('confirmReturnStockAdjustmentWarning')).toContain('{role}');
        expect(getOr('confirmReturnStockAdjustmentWarning')).toContain('{role}');

        expect(getEn('itemsPendingApprovalNotice')).toContain('{count}');
        expect(getAm('itemsPendingApprovalNotice')).toContain('{count}');
        expect(getOr('itemsPendingApprovalNotice')).toContain('{count}');

        expect(getEn('productsCount')).toContain('{count}');
        expect(getAm('productsCount')).toContain('{count}');
        expect(getOr('productsCount')).toContain('{count}');
    });
});
