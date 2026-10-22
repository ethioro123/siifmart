import { describe, expect, it } from 'vitest';
import type { UserRole } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { getVisibleFulfillmentTabs, getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';
import { FLOOR_WORKER_ROLES } from '../../utils/fulfillmentRoles';
import { isTransferManager } from '../../utils/transferGovernance';

const FULFILLMENT_ROUTE_ROLES = ['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'dispatch_supervisor', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'regional_operations_manager', 'regional_logistics_manager', 'country_supply_chain_director', 'inventory_manager', 'regional_supply_chain_manager', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor'];

describe('Fulfillment tab permissions', () => {
    it.each(['picker', 'packer'])('%s only sees floor fulfillment operations', role => {
        expect(getVisibleFulfillmentTabs(role)).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']);
    });

    it.each(['picker', 'packer', 'receiver', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'country_supply_chain_director'])(
        '%s cannot open site inventory counts without the count role', role => {
            expect(getVisibleFulfillmentTabs(role)).not.toContain('COUNT');
        }
    );

    it.each([
        ['receiver', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'TRANSFER']],
        ['forklift_operator', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']],
        ['inventory_specialist', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS']],
        ['driver', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'DRIVER']],
        ['inbound_qc_inspector', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK']],
        ['stock_clerk', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'COUNT', 'REPLENISH', 'LABELS']],
        ['replenishment_planner', ['TRANSFER', 'REPLENISH']],
        ['returns_clerk', ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'RETURNS']],
        ['dispatcher', ['DOCKS', 'DRIVER', 'ASSIGN']],
        ['country_supply_chain_director', ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'DRIVER', 'REPLENISH']],
        ['regional_logistics_manager', ['DOCKS', 'DRIVER', 'RECEIVE', 'TRANSFER']],
    ])('%s sees its shared floor tabs and authorized specialist tabs', (role, tabs) => {
        expect(getVisibleFulfillmentTabs(role as string)).toEqual(tabs);
    });

    it('normalizes role casing and whitespace', () => {
        expect(getVisibleFulfillmentTabs(' Driver ')).toEqual(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'DRIVER']);
    });

    it.each(FLOOR_WORKER_ROLES.filter(role => role !== 'inventory_specialist' && role !== 'receiver'))('keeps floor worker %s out of the transfer tab', role => {
        expect(getVisibleFulfillmentTabs(role)).not.toContain('TRANSFER');
    });

    it('lets receivers inspect incoming transfers without approval authority', () => {
        expect(getVisibleFulfillmentTabs('receiver')).toContain('TRANSFER');
        expect(isTransferManager({ id: 'receiver', name: 'Receiver', role: 'receiver', avatar: '', title: '' })).toBe(false);
    });

    it('lets inventory specialists prepare transfers without approval authority', () => {
        expect(getVisibleFulfillmentTabs('inventory_specialist')).toContain('TRANSFER');
        expect(isTransferManager({ id: 'inv-1', name: 'Inventory Specialist', role: 'inventory_specialist', avatar: '', title: '' })).toBe(false);
    });

    it('keeps floor workers out of the driver tab', () => {
        expect(getVisibleFulfillmentTabs('picker')).not.toContain('DRIVER');
    });

    it.each(['warehouse_manager', 'dispatch_supervisor', 'country_supply_chain_director', 'regional_logistics_manager', 'replenishment_planner'])('%s retains authorized transfer access', role => {
        expect(getVisibleFulfillmentTabs(role)).toContain('TRANSFER');
    });

    it.each(FULFILLMENT_ROUTE_ROLES)('%s has WMS route access and at least one Fulfillment tab', role => {
        expect(hasPermission(role as UserRole, 'ACCESS_WAREHOUSE')).toBe(true);
        expect(getVisibleFulfillmentTabs(role)).not.toHaveLength(0);
    });

    it('does not expose tabs to an unrecognized role', () => {
        expect(getVisibleFulfillmentTabs('unknown_role')).toEqual([]);
    });

    describe('WMS Worker Sovereign Landing Page (Default Tab)', () => {
        it.each([
            ['picker', 'PICK'],
            ['packer', 'PACK'],
            ['receiver', 'RECEIVE'],
            ['inbound_qc_inspector', 'RECEIVE'],
            ['forklift_operator', 'PUTAWAY'],
            ['driver', 'DRIVER'],
            ['stock_clerk', 'COUNT'],
            ['inventory_specialist', 'COUNT'],
            ['returns_clerk', 'RETURNS'],
            ['replenishment_planner', 'REPLENISH'],
            ['dispatcher', 'DOCKS'],
            ['dispatch_supervisor', 'DOCKS'],
            ['fleet_maintenance_supervisor', 'DOCKS'],
            ['warehouse_manager', 'DOCKS'],
            ['regional_supply_chain_manager', 'DOCKS'],
        ])('routes %s directly to their main working tab %s', (role, expectedTab) => {
            expect(getDefaultFulfillmentTab(role)).toBe(expectedTab);
        });

        it('normalizes role casing and whitespace for default tab resolution', () => {
            expect(getDefaultFulfillmentTab('  Picker  ')).toBe('PICK');
            expect(getDefaultFulfillmentTab('PACKER')).toBe('PACK');
            expect(getDefaultFulfillmentTab('Driver')).toBe('DRIVER');
        });

        it('falls back safely to RECEIVE for unrecognized or empty role', () => {
            expect(getDefaultFulfillmentTab('unknown_role')).toBe('RECEIVE');
            expect(getDefaultFulfillmentTab(null)).toBe('RECEIVE');
            expect(getDefaultFulfillmentTab(undefined)).toBe('RECEIVE');
        });
    });
});
