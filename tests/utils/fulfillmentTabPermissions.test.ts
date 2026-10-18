import { describe, expect, it } from 'vitest';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

describe('Fulfillment tab permissions', () => {
    it.each(['picker', 'packer'])('%s only sees floor fulfillment operations', role => {
        expect(getVisibleFulfillmentTabs(role)).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']);
    });

    it.each([
        ['receiver', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'TRANSFER']],
        ['forklift_operator', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']],
        ['inventory_specialist', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS']],
        ['driver', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'DRIVER']],
        ['inbound_qc_inspector', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']],
        ['stock_clerk', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'COUNT', 'REPLENISH', 'LABELS']],
        ['replenishment_planner', ['TRANSFER', 'REPLENISH']],
        ['returns_clerk', ['RETURNS']],
        ['dispatcher', ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN']],
    ])('%s sees its shared floor tabs and authorized specialist tabs', (role, tabs) => {
        expect(getVisibleFulfillmentTabs(role as string)).toEqual(tabs);
    });

    it('normalizes role casing and whitespace', () => {
        expect(getVisibleFulfillmentTabs(' Driver ')).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'DRIVER']);
    });

    it('keeps floor workers out of driver and transfer tabs unless specifically authorized', () => {
        expect(getVisibleFulfillmentTabs('picker')).not.toContain('DRIVER');
        expect(getVisibleFulfillmentTabs('picker')).not.toContain('TRANSFER');
        expect(getVisibleFulfillmentTabs('receiver')).toContain('TRANSFER');
    });

    it('keeps transfer available to warehouse managers', () => {
        expect(getVisibleFulfillmentTabs('warehouse_manager')).toContain('TRANSFER');
    });

    it('does not expose tabs to an unrecognized role', () => {
        expect(getVisibleFulfillmentTabs('unknown_role')).toEqual([]);
    });
});
