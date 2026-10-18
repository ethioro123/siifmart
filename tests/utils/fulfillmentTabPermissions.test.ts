import { describe, expect, it } from 'vitest';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

describe('Fulfillment tab permissions', () => {
    it.each(['picker', 'packer'])('%s only sees floor fulfillment operations', role => {
        expect(getVisibleFulfillmentTabs(role)).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']);
    });

    it.each([
        ['receiver', ['RECEIVE', 'PUTAWAY', 'TRANSFER']],
        ['forklift_operator', ['PUTAWAY']],
        ['inventory_specialist', ['TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS']],
        ['driver', ['DRIVER']],
        ['inbound_qc_inspector', ['RECEIVE']],
        ['replenishment_planner', ['TRANSFER', 'REPLENISH']],
        ['returns_clerk', ['RETURNS']],
        ['dispatcher', ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN']],
    ])('%s sees only its assigned Fulfillment tabs', (role, tabs) => {
        expect(getVisibleFulfillmentTabs(role as string)).toEqual(tabs);
    });

    it('normalizes role casing and whitespace', () => {
        expect(getVisibleFulfillmentTabs(' Driver ')).toEqual(['DRIVER']);
    });

    it('keeps transfer available to warehouse managers', () => {
        expect(getVisibleFulfillmentTabs('warehouse_manager')).toContain('TRANSFER');
    });

    it('does not expose tabs to an unrecognized role', () => {
        expect(getVisibleFulfillmentTabs('unknown_role')).toEqual([]);
    });
});
