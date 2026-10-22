/**
 * Role-to-Dashboard Route Resolver
 * Maps each organizational role to their sovereign operational dashboard.
 * Prevents unauthorized redirection loops and cross-role permission warnings.
 */

import { native } from './native';
import { canAccessModule } from './permissions';
import { getDefaultFulfillmentTab } from './fulfillmentTabPermissions';
import type { UserRole } from '../types';

export function getRoleDashboardRoute(role?: UserRole | string, siteType?: string): string {
    if (!role) return '/profile';

    // Site hydration can lag authentication; never assume a missing site means POS.
    if (native.isCleanMobileMode()) {
        const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType || '');
        const isStore = ['Store', 'Retail', 'POS'].includes(siteType || '');
        if ((isWarehouse || !siteType) && canAccessModule(role as UserRole, 'warehouse')) {
            const defaultTab = getDefaultFulfillmentTab(role);
            return `/wms-ops?tab=${defaultTab}`;
        }
        if ((isStore || !siteType) && canAccessModule(role as UserRole, 'pos')) return '/pos';
        return '/profile';
    }

    const isWarehouseSite = siteType && ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
    const isStoreSite = siteType && ['Store', 'Retail', 'POS'].includes(siteType);

    // 1. Regional Command: Regional Operations and Department Managers command from /regional-ops
    if (role === 'regional_operations_manager' || role === 'area_operations_manager' || ['regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager'].includes(role)) {
        return '/regional-ops';
    }

    // 1.5. Corporate HQ Executive Deck
    const isHQExecutive = ['group_ceo', 'group_coo', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_compliance_manager'].includes(role);
    if (isHQExecutive) {
        if (isWarehouseSite) return '/wms-ops';
        if (isStoreSite) return '/pos-dashboard';
        return '/admin';
    }

    // 2. Level 2 - Specialized Directors & Department Heads
    switch (role) {
        case 'group_cco':
        case 'country_commercial_director':
        case 'buyer':
        case 'demand_planner':
        case 'vendor_relations_manager':
        case 'customs_import_specialist':
            return '/procurement';

        case 'group_csco':
        case 'country_supply_chain_director':
            return '/wms-ops';

        case 'group_cfo':
        case 'country_finance_director':
        case 'country_compliance_manager':
        case 'auditor':
        case 'accountant':
        case 'payroll_specialist':
        case 'treasury_officer':
        case 'tax_compliance_officer':
        case 'credit_control_officer':
            return '/finance';

        case 'group_chro':
        case 'country_hr_director':
        case 'hr':
        case 'hr_generalist':
        case 'talent_recruiter':
        case 'training_coordinator':
            return '/employees';

        case 'merchandising_specialist':
        case 'regional_merchandising_manager':
        case 'merchandiser':
            return '/pricing';

        case 'group_cto':
        case 'group_cio':
        case 'country_technology_director':
        case 'it_support':
        case 'regional_security_manager':
            return '/settings';

        case 'cs_manager':
        case 'customer_service':
            return '/customers';

        case 'store_operations_auditor':
            return isStoreSite ? '/pos-dashboard' : '/sales';

        // 3. Level 6-10 - Warehouse & Logistics Roles (Direct sovereign role landing)
        case 'warehouse_manager':
        case 'warehouse_operations_manager':
        case 'transport_fleet_manager':
        case 'regional_supply_chain_manager':
        case 'dispatch_supervisor':
        case 'inventory_control_supervisor':
        case 'putaway_replenishment_supervisor':
        case 'picking_supervisor':
        case 'packing_supervisor':
        case 'returns_waste_supervisor':
        case 'fleet_maintenance_supervisor':
        case 'receiving_team_leader':
        case 'picking_team_leader':
        case 'packing_team_leader':
        case 'dispatch_team_leader':
        case 'inbound_qc_inspector':
        case 'inventory_specialist':
        case 'stock_clerk':
        case 'receiving_operator':
        case 'putaway_operator':
        case 'replenishment_operator':
        case 'inventory_controller':
        case 'stock_counter':
        case 'dispatch_operator':
        case 'returns_operator':
        case 'fleet_mechanic':
        case 'picker':
        case 'packer':
        case 'receiver':
        case 'driver':
        case 'forklift_operator':
        case 'returns_clerk':
        case 'dispatcher':
        case 'wms': {
            const defaultTab = getDefaultFulfillmentTab(role);
            return `/wms-ops?tab=${defaultTab}`;
        }

        case 'replenishment_planner':
            return '/wms-ops?tab=REPLENISH';

        case 'inventory_manager':
            return '/inventory';

        // 4. Store Operations Roles
        case 'store_manager':
        case 'assistant_store_manager':
        case 'shift_supervisor':
        case 'pos_supervisor':
        case 'stock_control_supervisor':
        case 'receiving_supervisor':
            return '/pos-dashboard';

        case 'cashier':
        case 'sales_associate':
        case 'store_associate':
            return '/pos';

        case 'loss_prevention':
        case 'data_analyst':
            return '/sales';
    }

    // 5. Site-type fallback for non-specialized roles
    if (isWarehouseSite) {
        const defaultTab = getDefaultFulfillmentTab(role);
        return `/wms-ops?tab=${defaultTab}`;
    }
    if (isStoreSite) return '/pos-dashboard';

    // 6. Dynamic Permission-Gated Fallback (ensures user never loops to an inaccessible module)
    if (canAccessModule(role as UserRole, 'procurement')) return '/procurement';
    if (canAccessModule(role as UserRole, 'finance')) return '/finance';
    if (canAccessModule(role as UserRole, 'employees')) return '/employees';
    if (canAccessModule(role as UserRole, 'warehouse')) {
        const defaultTab = getDefaultFulfillmentTab(role);
        return `/wms-ops?tab=${defaultTab}`;
    }
    if (canAccessModule(role as UserRole, 'pos')) return '/pos-dashboard';
    if (canAccessModule(role as UserRole, 'inventory')) return '/inventory';
    if (canAccessModule(role as UserRole, 'sales')) return '/sales';
    if (canAccessModule(role as UserRole, 'customers')) return '/customers';
    if (canAccessModule(role as UserRole, 'pricing')) return '/pricing';
    if (canAccessModule(role as UserRole, 'settings')) return '/settings';
    if (canAccessModule(role as UserRole, 'admin')) return '/admin';

    // 7. Universal safe harbor for any authenticated user
    return '/profile';
}
