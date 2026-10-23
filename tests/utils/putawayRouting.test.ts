import { describe, expect, it } from 'vitest';
import { rankPutawayLocations, type RoutingStock, type RoutingInput, type RoutingZone } from '../../utils/putawayRouting';
const input: RoutingInput = { siteId: 'et-dc', sku: 'ET001', category: 'Baby', quantity: 20, batchNumber: 'LOT1', expiryDate: '2028-01-01' };
const product = (changes: Partial<RoutingStock> = {}): RoutingStock => ({ id: 'p', siteId: 'et-dc', sku: 'ET001', category: 'Baby', stock: 40, location: 'B-02-05', batchNumber: 'LOT1', expiryDate: '2028-01-01', ...changes });
const zone = (changes: Partial<RoutingZone> = {}): RoutingZone => ({ id: 'z', siteId: 'et-dc', name: 'B', type: 'Dry', capacity: 500, occupied: 40, isLocked: false, allowPutaway: true, ...changes });
describe('dynamic Putaway routing', () => {
    it('prioritizes same SKU, batch and expiry over stale receiving suggestions', () => {
        const result = rankPutawayLocations({ ...input, suggestedLocation: 'A-01-01' }, [product()], [], []);
        expect(result[0].location).toBe('B-02-05');
        expect(result[0].existingUnits).toBe(40);
        expect(result[0].reason).toContain('capacity is not configured');
    });
    it('aggregates duplicate SKU rows and skips every worker-reported full bin', () => {
        const stock = [product(), product({ id: 'p2', stock: 5 }), product({ id: 'p3', location: 'B-02-06', stock: 10 })];
        expect(rankPutawayLocations(input, stock, [], [])[0].existingUnits).toBe(45);
        const result = rankPutawayLocations(input, stock, [], [], ['B-02-05']);
        expect(result[0].location).toBe('B-02-06');
        expect(result.some(r => r.location === 'B-02-05')).toBe(false);
    });
    it('falls back to a separate bin near the local category without mixing other SKUs or lots', () => {
        const result = rankPutawayLocations(input, [product({ batchNumber: 'OTHER' }), product({ sku: 'ET002', location: 'B-02-06' })], [], []);
        expect(result[0].location).toBe('B-02-01');
        expect(result[0].label).toContain('category');
        expect(result[0].reason).toContain('verify it exists');
    });
    it('does not mix different expiry dates within the same SKU and batch', () => {
        expect(rankPutawayLocations(input, [product({ expiryDate: '2029-01-01' })], [], [])[0].location).not.toBe('B-02-05');
    });
    it('uses the facility category mapping for a new SKU', () => {
        expect(rankPutawayLocations(input, [], [], [{ siteId: 'et-dc', category: 'Baby', defaultZone: 'Zone C' }])[0].location).toBe('C-01-01');
    });
    it.each([{ isLocked: true }, { allowPutaway: false }, { capacity: 50 }, { type: 'Damaged' }, { type: 'Staging' }])('excludes unavailable zones %j', changes => {
        const result = rankPutawayLocations(input, [product()], [zone(changes)], []);
        expect(result).toEqual([]);
    });
    it('never imports another site or country layout', () => {
        const result = rankPutawayLocations(input, [product({ siteId: 'ke-wh', location: 'Z-99-99' })], [zone({ siteId: 'ke-wh', name: 'Z' })], [{ siteId: 'ke-wh', category: 'Baby', defaultZone: 'Z' }]);
        expect(result[0].location).toBe('A-01-01');
    });
    it('requires a configured compatible cold zone for chilled and frozen goods', () => {
        expect(rankPutawayLocations({ ...input, storageType: 'Frozen' }, [], [], [])).toEqual([]);
        expect(rankPutawayLocations({ ...input, storageType: 'Frozen' }, [], [zone({ type: 'Cold', temperature: 'Frozen' })], [])[0].location).toBe('B-01-01');
        expect(rankPutawayLocations({ ...input, storageType: 'Chilled' }, [], [zone({ type: 'Cold', temperature: 'Frozen' })], [])).toEqual([]);
    });
    it('moves to another aisle when the current aisle has no separate bins', () => {
        const fullAisle = Array.from({ length: 99 }, (_, index) => product({ id: String(index), sku: 'OTHER', location: `B-02-${String(index + 1).padStart(2, '0')}` }));
        expect(rankPutawayLocations(input, fullAisle, [], [])[0].location).toBe('B-03-01');
    });
    it('withholds suggestions for damaged goods', () => {
        expect(rankPutawayLocations({ ...input, condition: 'Damaged' }, [product()], [], [])).toEqual([]);
    });
});
