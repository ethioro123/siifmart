import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, canViewAllSites, canViewAllEmployees, canSwitchCountry } from '../../utils/permissions';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canWorkerPerformJob } from '../../utils/fulfillmentRoles';

describe('Site Operational Managers Governance Engine (SOP-028, SOP-029, SOP-030)', () => {
    describe('Logistics Manager (SOP-MGT-028, Rank 80)', () => {
        it('allows access to warehouse fulfillment and inventory modules', () => {
            expect(canAccessModule('logistics_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('logistics_manager', 'inventory')).toBe(true);
        });

        it('blocks access to POS till, central finance, and system settings modules', () => {
            expect(canAccessModule('logistics_manager', 'pos')).toBe(false);
            expect(canAccessModule('logistics_manager', 'finance')).toBe(false);
            expect(canAccessModule('logistics_manager', 'pricing')).toBe(false);
            expect(canAccessModule('logistics_manager', 'settings')).toBe(false);
            expect(canAccessModule('logistics_manager', 'admin')).toBe(false);
        });

        it('grants transit dispatch, transfer, and fleet staging permissions', () => {
            expect(authService.checkPermission('logistics_manager', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('logistics_manager', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('logistics_manager', 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission('logistics_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of drivers and fleet personnel strictly below Rank 80', () => {
            expect(canEmployRole('logistics_manager', 'driver')).toBe(true);
            expect(canEmployRole('logistics_manager', 'dispatcher')).toBe(true);
            expect(canEmployRole('logistics_manager', 'forklift_operator')).toBe(true);

            expect(canEmployRole('logistics_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('logistics_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('logistics_manager', 'supply_chain_manager')).toBe(false);
            expect(canEmployRole('logistics_manager', 'logistics_manager')).toBe(false);
        });

        it('strictly enforces Delivery Lockdown (Rule 15)', () => {
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('driver', 'DELIVERY')).toBe(true);
        });
    });

    describe('Inventory Manager (SOP-MGT-029, Rank 80)', () => {
        it('allows access to inventory and warehouse auditing modules', () => {
            expect(canAccessModule('inventory_manager', 'inventory')).toBe(true);
            expect(canAccessModule('inventory_manager', 'warehouse')).toBe(true);
        });

        it('blocks access to POS till, central finance, and administrative modules', () => {
            expect(canAccessModule('inventory_manager', 'pos')).toBe(false);
            expect(canAccessModule('inventory_manager', 'finance')).toBe(false);
            expect(canAccessModule('inventory_manager', 'pricing')).toBe(false);
            expect(canAccessModule('inventory_manager', 'admin')).toBe(false);
        });

        it('grants stock counting, inventory adjustments, and bin zone auditing permissions', () => {
            expect(authService.checkPermission('inventory_manager', 'inventory.count')).toBe(true);
            expect(authService.checkPermission('inventory_manager', 'inventory.adjust')).toBe(true);
            expect(authService.checkPermission('inventory_manager', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('inventory_manager', 'warehouse.count')).toBe(true);
            expect(authService.checkPermission('inventory_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of inventory specialists and stock audit staff', () => {
            expect(canEmployRole('inventory_manager', 'inventory_specialist')).toBe(true);
            expect(canEmployRole('inventory_manager', 'stock_clerk')).toBe(true);

            expect(canEmployRole('inventory_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('inventory_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('inventory_manager', 'inventory_manager')).toBe(false);
        });
    });

    describe('Security & Loss Prevention Manager (SOP-MGT-030, Rank 75)', () => {
        it('allows access to audit settings and employee rosters, blocking stock management (Departmental Isolation)', () => {
            expect(canAccessModule('security_manager', 'settings')).toBe(true);
            expect(canAccessModule('security_manager', 'inventory')).toBe(false);
            expect(canAccessModule('security_manager', 'employees')).toBe(true);
        });

        it('grants audit logs inspection while blocking stock adjustments and pos sales', () => {
            expect(authService.checkPermission('security_manager', 'settings.view_logs')).toBe(true);
            expect(authService.checkPermission('security_manager', 'settings.view')).toBe(true);
            expect(authService.checkPermission('security_manager', 'inventory.view')).toBe(false);

            // Prohibits unilateral stock adjustments (requires dual-control with Ops)
            expect(authService.checkPermission('security_manager', 'inventory.adjust')).toBe(false);
            expect(authService.checkPermission('security_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of loss prevention staff', () => {
            expect(canEmployRole('security_manager', 'loss_prevention')).toBe(true);
            expect(canEmployRole('security_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('security_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('security_manager', 'store_manager')).toBe(false);
        });
    });

    describe('Dispatch Manager (SOP-MGT-031, Rank 75)', () => {
        it('allows access to warehouse fulfillment, inventory, and employees modules', () => {
            expect(canAccessModule('dispatch_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('dispatch_manager', 'inventory')).toBe(true);
            expect(canAccessModule('dispatch_manager', 'employees')).toBe(true);
        });

        it('blocks access to POS till, central finance, and system settings modules', () => {
            expect(canAccessModule('dispatch_manager', 'pos')).toBe(false);
            expect(canAccessModule('dispatch_manager', 'finance')).toBe(false);
            expect(canAccessModule('dispatch_manager', 'pricing')).toBe(false);
            expect(canAccessModule('dispatch_manager', 'settings')).toBe(false);
            expect(canAccessModule('dispatch_manager', 'admin')).toBe(false);
        });

        it('grants transit dispatch, transfer staging, and task assignment permissions', () => {
            expect(authService.checkPermission('dispatch_manager', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('dispatch_manager', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('dispatch_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of dispatchers and drivers strictly below Rank 75', () => {
            expect(canEmployRole('dispatch_manager', 'driver')).toBe(true);
            expect(canEmployRole('dispatch_manager', 'dispatcher')).toBe(true);

            expect(canEmployRole('dispatch_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('dispatch_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('dispatch_manager', 'logistics_manager')).toBe(false);
            expect(canEmployRole('dispatch_manager', 'dispatch_manager')).toBe(false);
        });
    });

    describe('Super Admin / CEO Context-Aware Site Navigation Scoping', () => {
        const simulateSiteNavFilter = (siteType: string, userRole: string = 'super_admin') => {
            const isStore = ['Store', 'Retail', 'POS'].includes(siteType);
            const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
            const isHQ = !isStore && !isWarehouse;
            const isSuperAdminOrCeo = userRole === 'super_admin' || (userRole as string)?.toLowerCase() === 'ceo';

            const items = [
                { to: '/admin', section: 'admin' },
                { to: '/pos', section: 'pos' },
                { to: '/pos-dashboard', section: 'pos' },
                { to: '/sales', section: 'sales' },
                { to: '/wms-ops', section: 'warehouse' },
                { to: '/wms-dashboard', section: 'warehouse' },
                { to: '/inventory', section: 'inventory' },
                { to: '/network-inventory', section: 'inventory' },
                { to: '/procurement', section: 'procurement' },
                { to: '/pricing', section: 'pricing' },
                { to: '/finance', section: 'finance' },
                { to: '/customers', section: 'customers' },
                { to: '/employees', section: 'employees' },
                { to: '/settings', section: 'settings' },
            ];

            return items.filter(item => {
                let isAllowed = true;
                if (isWarehouse) {
                    if (['pos', 'sales', 'customers', 'pricing', 'finance', 'settings'].includes(item.section)) isAllowed = false;
                    if (item.to === '/network-inventory' || item.to === '/roadmap') isAllowed = false;
                    if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_manager', 'operations_manager'].includes(userRole)) isAllowed = false;
                } else if (isStore) {
                    if (['warehouse', 'procurement', 'pricing', 'finance', 'settings'].includes(item.section)) isAllowed = false;
                    if (item.to === '/network-inventory' || item.to === '/roadmap') isAllowed = false;
                    if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_manager', 'operations_manager'].includes(userRole)) isAllowed = false;
                } else if (isHQ) {
                    if (['warehouse', 'pos', 'procurement'].includes(item.section) || item.to === '/sales') isAllowed = false;
                    if (item.to === '/inventory') isAllowed = false;
                }
                return isAllowed;
            });
        };

        it('scopes Super Admin strictly to Store Manager view when at a Store', () => {
            const allowed = simulateSiteNavFilter('Store', 'super_admin');
            const paths = allowed.map(i => i.to);

            // Store operations allowed
            expect(paths).toContain('/pos');
            expect(paths).toContain('/pos-dashboard');
            expect(paths).toContain('/sales');
            expect(paths).toContain('/customers');
            expect(paths).toContain('/inventory');
            expect(paths).toContain('/employees');
            expect(paths).toContain('/admin'); // CEO escape hatch back to Central Ops

            // Warehouse & HQ-only operations strictly forbidden
            expect(paths).not.toContain('/wms-ops');
            expect(paths).not.toContain('/wms-dashboard');
            expect(paths).not.toContain('/procurement');
            expect(paths).not.toContain('/network-inventory');
            expect(paths).not.toContain('/pricing');
            expect(paths).not.toContain('/finance');
            expect(paths).not.toContain('/settings');
        });

        it('scopes Super Admin strictly to Warehouse Manager view when at a Warehouse', () => {
            const allowed = simulateSiteNavFilter('Warehouse', 'super_admin');
            const paths = allowed.map(i => i.to);

            // Warehouse operations allowed
            expect(paths).toContain('/wms-ops');
            expect(paths).toContain('/wms-dashboard');
            expect(paths).toContain('/inventory');
            expect(paths).toContain('/procurement');
            expect(paths).toContain('/employees');
            expect(paths).toContain('/admin'); // CEO escape hatch back to Central Ops

            // POS & Store-specific operations strictly forbidden
            expect(paths).not.toContain('/pos');
            expect(paths).not.toContain('/pos-dashboard');
            expect(paths).not.toContain('/sales');
            expect(paths).not.toContain('/customers');
            expect(paths).not.toContain('/network-inventory');
            expect(paths).not.toContain('/pricing');
            expect(paths).not.toContain('/finance');
            expect(paths).not.toContain('/settings');
        });

        it('scopes Super Admin strictly to Executive Suite when at Administration HQ', () => {
            const allowed = simulateSiteNavFilter('Administration', 'super_admin');
            const paths = allowed.map(i => i.to);

            // HQ Executive operations allowed
            expect(paths).toContain('/admin');
            expect(paths).toContain('/network-inventory');
            expect(paths).toContain('/pricing');
            expect(paths).toContain('/finance');
            expect(paths).toContain('/customers');
            expect(paths).toContain('/employees');
            expect(paths).toContain('/settings');

            // Floor-level terminals strictly hidden in HQ
            expect(paths).not.toContain('/pos');
            expect(paths).not.toContain('/pos-dashboard');
            expect(paths).not.toContain('/sales');
            expect(paths).not.toContain('/wms-ops');
            expect(paths).not.toContain('/wms-dashboard');
            expect(paths).not.toContain('/procurement');
            expect(paths).not.toContain('/inventory');
        });
    });
});
