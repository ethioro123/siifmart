import { describe, expect, it } from 'vitest';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

describe('Fulfillment tab permissions', () => {
    it.each(['picker', 'packer'])('%s only sees floor fulfillment operations', role => {
        expect(getVisibleFulfillmentTabs(role)).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']);
    });

    it('keeps transfer available to warehouse managers', () => {
        expect(getVisibleFulfillmentTabs('warehouse_manager')).toContain('TRANSFER');
    });

    it('does not expose tabs to an unrecognized role', () => {
        expect(getVisibleFulfillmentTabs('unknown_role')).toEqual([]);
    });
});
