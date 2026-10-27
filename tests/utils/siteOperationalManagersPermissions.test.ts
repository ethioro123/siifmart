import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, canViewAllSites, canViewAllEmployees, canSwitchCountry } from '../../utils/permissions';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canWorkerPerformJob } from '../../utils/fulfillmentRoles';

describe('Site Operational Managers Governance Engine (SOP-028, SOP-029, SOP-030)', () => {
    describe('Logistics Manager (SOP-MGT-028, Rank 80)', () => {
        it('allows access to warehouse fulfillment, inventory, procurement, regional-ops, sales, and employees modules', () => {
            expect(canAccessModule('regional_supply_chain_manager', 'dashboard')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'regional-ops')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'inventory')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'procurement')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'sales')).toBe(true);
            expect(canAccessModule('regional_supply_chain_manager', 'employees')).toBe(true);
        });

        it('blocks access to POS till, central finance, and system settings modules', () => {
            expect(canAccessModule('regional_supply_chain_manager', 'pos')).toBe(false);
            expect(canAccessModule('regional_supply_chain_manager', 'finance')).toBe(false);
            expect(canAccessModule('regional_supply_chain_manager', 'pricing')).toBe(false);
            expect(canAccessModule('regional_supply_chain_manager', 'settings')).toBe(false);
            expect(canAccessModule('regional_supply_chain_manager', 'admin')).toBe(false);
        });

        it('grants transit dispatch, transfer, inbound PO receiving, and workforce management permissions while enforcing segregation of duties', () => {
            expect(authService.checkPermission('regional_supply_chain_manager', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'warehouse.view_tasks')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'procurement.view')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'procurement.receive')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'sales.view')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'employees.view')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'employees.manage_attendance')).toBe(true);
            expect(authService.checkPermission('regional_supply_chain_manager', 'procurement.create_po')).toBe(false);
            expect(authService.checkPermission('regional_supply_chain_manager', 'procurement.approve_po')).toBe(false);
            expect(authService.checkPermission('regional_supply_chain_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of drivers and fleet personnel strictly below Rank 80', () => {
            expect(canEmployRole('regional_supply_chain_manager', 'driver')).toBe(true);
            expect(canEmployRole('regional_supply_chain_manager', 'dispatcher')).toBe(true);
            expect(canEmployRole('regional_supply_chain_manager', 'forklift_operator')).toBe(true);

            expect(canEmployRole('regional_supply_chain_manager', 'group_ceo')).toBe(false);
            expect(canEmployRole('regional_supply_chain_manager', 'country_operations_director')).toBe(false);
            expect(canEmployRole('regional_supply_chain_manager', 'country_supply_chain_director')).toBe(false);
            expect(canEmployRole('regional_supply_chain_manager', 'regional_supply_chain_manager')).toBe(false);
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

            expect(canEmployRole('inventory_manager', 'group_ceo')).toBe(false);
            expect(canEmployRole('inventory_manager', 'country_operations_director')).toBe(false);
            expect(canEmployRole('inventory_manager', 'inventory_manager')).toBe(false);
        });
    });

    describe('Security & Loss Prevention Manager (SOP-MGT-030, Rank 75)', () => {
        it('allows access to audit settings and employee rosters, blocking stock management (Departmental Isolation)', () => {
            expect(canAccessModule('regional_security_manager', 'settings')).toBe(true);
            expect(canAccessModule('regional_security_manager', 'inventory')).toBe(false);
            expect(canAccessModule('regional_security_manager', 'employees')).toBe(true);
        });

        it('grants audit logs inspection while blocking stock adjustments and pos sales', () => {
            expect(authService.checkPermission('regional_security_manager', 'settings.view_logs')).toBe(true);
            expect(authService.checkPermission('regional_security_manager', 'settings.view')).toBe(true);
            expect(authService.checkPermission('regional_security_manager', 'inventory.view')).toBe(false);

            // Prohibits unilateral stock adjustments (requires dual-control with Ops)
            expect(authService.checkPermission('regional_security_manager', 'inventory.adjust')).toBe(false);
            expect(authService.checkPermission('regional_security_manager', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of loss prevention staff', () => {
            expect(canEmployRole('regional_security_manager', 'loss_prevention')).toBe(true);
            expect(canEmployRole('regional_security_manager', 'group_ceo')).toBe(false);
            expect(canEmployRole('regional_security_manager', 'country_operations_director')).toBe(false);
            expect(canEmployRole('regional_security_manager', 'store_manager')).toBe(false);
        });
    });

    describe('Dispatch Manager (SOP-MGT-031, Rank 75)', () => {
        it('allows access to warehouse fulfillment, inventory, and employees modules', () => {
            expect(canAccessModule('dispatch_supervisor', 'warehouse')).toBe(true);
            expect(canAccessModule('dispatch_supervisor', 'inventory')).toBe(true);
            expect(canAccessModule('dispatch_supervisor', 'employees')).toBe(true);
        });

        it('blocks access to POS till, central finance, and system settings modules', () => {
            expect(canAccessModule('dispatch_supervisor', 'pos')).toBe(false);
            expect(canAccessModule('dispatch_supervisor', 'finance')).toBe(false);
            expect(canAccessModule('dispatch_supervisor', 'pricing')).toBe(false);
            expect(canAccessModule('dispatch_supervisor', 'settings')).toBe(false);
            expect(canAccessModule('dispatch_supervisor', 'admin')).toBe(false);
        });

        it('grants transit dispatch, transfer staging, and task assignment permissions', () => {
            expect(authService.checkPermission('dispatch_supervisor', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('dispatch_supervisor', 'inventory.transfer')).toBe(true);
            expect(authService.checkPermission('dispatch_supervisor', 'pos.create_sale')).toBe(false);
        });

        it('authorizes hiring of dispatchers and drivers strictly below Rank 75', () => {
            expect(canEmployRole('dispatch_supervisor', 'driver')).toBe(true);
            expect(canEmployRole('dispatch_supervisor', 'dispatcher')).toBe(true);

            expect(canEmployRole('dispatch_supervisor', 'group_ceo')).toBe(false);
            expect(canEmployRole('dispatch_supervisor', 'country_operations_director')).toBe(false);
            expect(canEmployRole('dispatch_supervisor', 'regional_supply_chain_manager')).toBe(false);
            expect(canEmployRole('dispatch_supervisor', 'dispatch_supervisor')).toBe(false);
        });
    });

    describe('Super Admin / CEO Context-Aware Site Navigation Scoping', () => {
        const simulateSiteNavFilter = (siteType: string, userRole: string = 'group_ceo') => {
            const isStore = ['Store', 'Retail', 'POS'].includes(siteType);
            const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
            const isHQ = !isStore && !isWarehouse;
            const isSuperAdminOrCeo = userRole === 'group_ceo';

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
                    if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_operations_manager', 'country_operations_director'].includes(userRole)) isAllowed = false;
                } else if (isStore) {
                    if (['warehouse', 'procurement', 'pricing', 'finance', 'settings'].includes(item.section)) isAllowed = false;
                    if (item.to === '/network-inventory' || item.to === '/roadmap') isAllowed = false;
                    if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_operations_manager', 'country_operations_director'].includes(userRole)) isAllowed = false;
                } else if (isHQ) {
                    if (['warehouse', 'pos', 'procurement'].includes(item.section) || item.to === '/sales') isAllowed = false;
                    if (item.to === '/inventory') isAllowed = false;
                }
                return isAllowed;
            });
        };

        it('scopes Super Admin strictly to Store Manager view when at a Store', () => {
            const allowed = simulateSiteNavFilter('Store', 'group_ceo');
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
            const allowed = simulateSiteNavFilter('Warehouse', 'group_ceo');
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
            const allowed = simulateSiteNavFilter('Administration', 'group_ceo');
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
