import { describe, expect, it } from 'vitest';
import { getPODeliveryRequirements, parseShelfLifeDays, validatePODelivery } from '../../utils/poDeliveryRequirements';
const chilled = { productName: 'Milk', customAttributes: { storage: { type: 'Chilled (0°C to 4°C)', isPerishable: true, shelfLifeDays: '14' } } };
const frozen = { customAttributes: { storage: { type: 'Frozen (-18°C or below)', isPerishable: true, shelfLifeDays: '180' } } };
describe('PO delivery requirements', () => {
    it('normalizes explicitly configured storage and legacy day strings', () => {
        expect(getPODeliveryRequirements([chilled]).temperatures).toEqual(['Chilled']);
        expect(parseShelfLifeDays('7 days')).toBe(7);
        expect(validatePODelivery([chilled], 'Chilled', '7 days')).toBeNull();
    });
    it('requires separate orders for incompatible temperature groups', () => {
        expect(validatePODelivery([chilled, frozen], 'Chilled', '7')).toContain('separate purchase orders');
        expect(validatePODelivery([chilled], 'Ambient', '7')).toContain('Chilled');
    });
    it('distinguishes total shelf life from the minimum remaining at delivery', () => {
        expect(validatePODelivery([chilled], 'Chilled', '')).toContain('minimum remaining');
        expect(validatePODelivery([chilled], 'Chilled', '15')).toContain('14 days');
        expect(validatePODelivery([chilled], 'Chilled', '14')).toBeNull();
    });
    it.each(['0', '-1', '2.5', '7 months', 'Infinity', 'NaN'])('rejects invalid shelf life %s', value => {
        expect(parseShelfLifeDays(value)).toBeNull();
        expect(validatePODelivery([], 'Ambient', value)).toContain('positive whole');
    });
    it('does not invent temperature or shelf life from a product name', () => {
        expect(getPODeliveryRequirements([{ productName: 'Frozen milk' }]).temperatures).toEqual([]);
        expect(validatePODelivery([], 'Ambient', '')).toBeNull();
    });
});
