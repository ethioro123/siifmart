import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, canViewAllSites } from '../../utils/permissions';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canWorkerPerformJob } from '../../utils/fulfillmentRoles';

describe('Supply Chain Manager Role & Network Logistics Engine (SOP-MGT-025)', () => {
    describe('Module & Network Access Controls', () => {
        it('allows supply_chain_manager to access warehouse, inventory, and procurement modules', () => {
            expect(canAccessModule('supply_chain_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('supply_chain_manager', 'inventory')).toBe(true);
            expect(canAccessModule('supply_chain_manager', 'procurement')).toBe(true);
        });

        it('blocks supply_chain_manager from cashier POS and system settings modules', () => {
            expect(canAccessModule('supply_chain_manager', 'pos')).toBe(false);
            expect(canAccessModule('supply_chain_manager', 'settings')).toBe(false);
        });

        it('grants enterprise-wide network visibility across all sites and facilities', () => {
            expect(canViewAllSites('supply_chain_manager')).toBe(true);
            expect(canViewCostPrice('supply_chain_manager')).toBe(true);
        });
    });

    describe('Logistics & Inventory Flow Permissions', () => {
        it('grants macro inventory transfer, dispatch, and staging permissions', () => {
            expect(authService.checkPermission('supply_chain_manager', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('supply_chain_manager', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('supply_chain_manager', 'warehouse.putaway')).toBe(true);
            expect(authService.checkPermission('supply_chain_manager', 'inventory.view')).toBe(true);
            expect(authService.checkPermission('supply_chain_manager', 'warehouse.view')).toBe(true);
        });

        it('blocks live cashier till operations (Zero Live Till Operation)', () => {
            expect(authService.checkPermission('supply_chain_manager', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('supply_chain_manager', 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission('supply_chain_manager', 'pos.refund')).toBe(false);
        });

        it('blocks unilateral retail shelf price alterations (Merchandising remit)', () => {
            expect(authService.checkPermission('supply_chain_manager', 'pricing.edit')).toBe(false);
            expect(authService.checkPermission('supply_chain_manager', 'pricing.approve_promo')).toBe(false);
        });
    });

    describe('Supervisory Sourcing & Logistics Hiring Authority (canEmployRole)', () => {
        it('authorizes supply_chain_manager to hire Logistics Managers, Dispatch Managers, and fleet staff', () => {
            expect(canEmployRole('supply_chain_manager', 'logistics_manager')).toBe(true);
            expect(canEmployRole('supply_chain_manager', 'dispatch_manager')).toBe(true);
            expect(canEmployRole('supply_chain_manager', 'driver')).toBe(true);
            expect(canEmployRole('supply_chain_manager', 'forklift_operator')).toBe(true);
            expect(canEmployRole('supply_chain_manager', 'replenishment_planner')).toBe(true);
            expect(canEmployRole('supply_chain_manager', 'fleet_maintenance_supervisor')).toBe(true);
        });

        it('authorizes department managers to hire their specialized team members', () => {
            expect(canEmployRole('logistics_manager', 'fleet_maintenance_supervisor')).toBe(true);
            expect(canEmployRole('inventory_manager', 'replenishment_planner')).toBe(true);
        });

        it('blocks supply_chain_manager from hiring superiors or Level 2 peers', () => {
            expect(canEmployRole('supply_chain_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('supply_chain_manager', 'regional_manager')).toBe(false);
            expect(canEmployRole('supply_chain_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('supply_chain_manager', 'finance_manager')).toBe(false);
            expect(canEmployRole('supply_chain_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('supply_chain_manager', 'supply_chain_manager')).toBe(false);
        });
    });

    describe('Replenishment Planner Role Specification & Permissions', () => {
        it('allows replenishment_planner to access inventory, warehouse, procurement, and sales', () => {
            expect(canAccessModule('replenishment_planner', 'inventory')).toBe(true);
            expect(canAccessModule('replenishment_planner', 'warehouse')).toBe(true);
            expect(canAccessModule('replenishment_planner', 'procurement')).toBe(true);
            expect(canAccessModule('replenishment_planner', 'sales')).toBe(true);
        });

        it('blocks replenishment_planner from live POS operations, pricing edits, and system settings', () => {
            expect(canAccessModule('replenishment_planner', 'pos')).toBe(false);
            expect(canAccessModule('replenishment_planner', 'pricing')).toBe(false);
            expect(canAccessModule('replenishment_planner', 'settings')).toBe(false);
            expect(authService.checkPermission('replenishment_planner', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('replenishment_planner', 'pricing.edit')).toBe(false);
        });

        it('authorizes replenishment_planner to monitor velocity and trigger RDC transfer orders', () => {
            expect(authService.checkPermission('replenishment_planner', 'inventory.view')).toBe(true);
            expect(authService.checkPermission('replenishment_planner', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('replenishment_planner', 'warehouse.view')).toBe(true);
            expect(authService.checkPermission('replenishment_planner', 'warehouse.view_tasks')).toBe(true);
            expect(authService.checkPermission('replenishment_planner', 'procurement.view')).toBe(true);
            expect(authService.checkPermission('replenishment_planner', 'sales.view')).toBe(true);
        });

        it('enforces that replenishment_planner is an analytics role and cannot perform external deliveries', () => {
            expect(canWorkerPerformJob('replenishment_planner', 'DELIVERY')).toBe(false);
        });
    });

    describe('Fleet Maintenance Supervisor Role Specification & Permissions', () => {
        it('allows fleet_maintenance_supervisor to access warehouse, inventory, and employees modules', () => {
            expect(canAccessModule('fleet_maintenance_supervisor', 'warehouse')).toBe(true);
            expect(canAccessModule('fleet_maintenance_supervisor', 'inventory')).toBe(true);
            expect(canAccessModule('fleet_maintenance_supervisor', 'employees')).toBe(true);
        });

        it('blocks fleet_maintenance_supervisor from cashier POS, pricing edits, and system settings', () => {
            expect(canAccessModule('fleet_maintenance_supervisor', 'pos')).toBe(false);
            expect(canAccessModule('fleet_maintenance_supervisor', 'pricing')).toBe(false);
            expect(canAccessModule('fleet_maintenance_supervisor', 'settings')).toBe(false);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'pos.create_sale')).toBe(false);
        });

        it('authorizes fleet_maintenance_supervisor to oversee vehicle transit, dispatch, and driver rosters', () => {
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'warehouse.view')).toBe(true);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'warehouse.view_tasks')).toBe(true);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'inventory.view')).toBe(true);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'employees.view')).toBe(true);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'employees.manage_attendance')).toBe(true);
        });

        it('authorizes fleet_maintenance_supervisor as a fulfillment supervisor to oversee fleet & warehouse jobs', () => {
            expect(canWorkerPerformJob('fleet_maintenance_supervisor', 'DRIVER')).toBe(true);
            expect(canWorkerPerformJob('fleet_maintenance_supervisor', 'DOCKS')).toBe(true);
        });
    });

    describe('Delivery Lockdown Compliance (Rule 15 & SOP-OPS-008)', () => {
        it('strictly forbids floor staff from external delivery assignments', () => {
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('packer', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('driver', 'DELIVERY')).toBe(true);
        });
    });
});
