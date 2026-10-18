import { describe, expect, it } from 'vitest';
import type { UserRole } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

const FULFILLMENT_ROUTE_ROLES = [
    'super_admin', 'admin', 'warehouse_manager', 'operations_manager', 'dispatch_manager',
    'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk',
    'returns_clerk', 'inventory_specialist', 'regional_manager', 'regional_logistics_lead',
    'supply_chain_manager', 'inventory_manager', 'logistics_manager', 'inbound_qc_inspector',
    'replenishment_planner', 'fleet_maintenance_supervisor',
];

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
        ['dispatcher', ['DOCKS', 'DRIVER', 'ASSIGN']],
        ['supply_chain_manager', ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'DRIVER', 'REPLENISH', 'COUNT']],
        ['regional_logistics_lead', ['DOCKS', 'DRIVER', 'RECEIVE', 'TRANSFER']],
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

    it.each(FULFILLMENT_ROUTE_ROLES)('%s has WMS route access and at least one Fulfillment tab', role => {
        expect(hasPermission(role as UserRole, 'ACCESS_WAREHOUSE')).toBe(true);
        expect(getVisibleFulfillmentTabs(role)).not.toHaveLength(0);
    });

    it('does not expose tabs to an unrecognized role', () => {
        expect(getVisibleFulfillmentTabs('unknown_role')).toEqual([]);
    });
});
