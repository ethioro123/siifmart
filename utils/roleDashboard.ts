/**
 * Role-to-Dashboard Route Resolver
 * Maps each organizational role to their sovereign operational dashboard.
 * Prevents unauthorized redirection loops and cross-role permission warnings.
 */

import { native } from './native';
import { canAccessModule } from './permissions';
import type { UserRole } from '../types';

export function getRoleDashboardRoute(role?: UserRole | string, siteType?: string): string {
    if (!role) return '/profile';

    // 0. Clean Mobile / Android Mode: strictly route to WMS Fulfillment or POS Terminal
    if (native.isCleanMobileMode()) {
        const isWarehouse = siteType && ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
        if (isWarehouse) return '/wms-ops';
        return '/pos';
    }

    const isWarehouseSite = siteType && ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
    const isStoreSite = siteType && ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);

    // 1. Regional Command: Regional Managers & Functional Leads command from /regional-ops
    if (role === 'regional_manager' || [
        'regional_procurement_lead',
        'regional_finance_officer',
        'regional_hr_officer',
        'regional_logistics_lead',
        'regional_security_supervisor'
    ].includes(role)) {
        return '/regional-ops';
    }

    // 1.5. Corporate HQ Executive Deck
    const isHQExecutive = ['super_admin', 'CEO', 'ceo', 'operations_manager', 'admin'].includes(role);
    if (isHQExecutive) {
        if (isWarehouseSite) return '/wms-ops';
        if (isStoreSite) return '/pos-dashboard';
        return '/admin';
    }

    // 2. Level 2 - Specialized Directors & Department Heads
    switch (role) {
        case 'procurement_manager':
        case 'supply_chain_manager':
        case 'buyer':
        case 'demand_planner':
        case 'vendor_relations_manager':
        case 'customs_import_specialist':
            return '/procurement';

        case 'finance_manager':
        case 'auditor':
        case 'accountant':
        case 'payroll_specialist':
        case 'treasury_officer':
        case 'tax_compliance_officer':
        case 'credit_control_officer':
            return '/finance';

        case 'hr_manager':
        case 'hr':
        case 'talent_recruiter':
        case 'training_coordinator':
            return '/employees';

        case 'merchandising_manager':
        case 'merchandiser':
            return '/pricing';

        case 'it_support':
        case 'security_manager':
            return '/settings';

        case 'cs_manager':
        case 'customer_service':
            return '/customers';

        case 'store_operations_auditor':
            return isStoreSite ? '/pos-dashboard' : '/sales';

        // 3. Level 3 & 4 - Warehouse & Logistics Roles
        case 'warehouse_manager':
        case 'logistics_manager':
        case 'dispatch_manager':
        case 'fleet_maintenance_supervisor':
        case 'inbound_qc_inspector':
        case 'inventory_specialist':
        case 'stock_clerk':
        case 'picker':
        case 'packer':
        case 'receiver':
        case 'driver':
        case 'forklift_operator':
        case 'returns_clerk':
        case 'dispatcher':
        case 'wms':
            return '/wms-ops';

        case 'inventory_manager':
        case 'replenishment_planner':
            return '/inventory';

        // 4. Store Operations Roles
        case 'store_manager':
        case 'assistant_manager':
        case 'shift_lead':
        case 'store_supervisor':
            return '/pos-dashboard';

        case 'cashier':
        case 'sales_associate':
        case 'pos':
            return '/pos';

        case 'loss_prevention':
        case 'data_analyst':
            return '/sales';
    }

    // 5. Site-type fallback for non-specialized roles
    if (isWarehouseSite) return '/wms-ops';
    if (isStoreSite) return '/pos-dashboard';

    // 6. Dynamic Permission-Gated Fallback (ensures user never loops to an inaccessible module)
    if (canAccessModule(role as UserRole, 'procurement')) return '/procurement';
    if (canAccessModule(role as UserRole, 'finance')) return '/finance';
    if (canAccessModule(role as UserRole, 'employees')) return '/employees';
    if (canAccessModule(role as UserRole, 'warehouse')) return '/wms-ops';
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
