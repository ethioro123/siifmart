import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 6 through 8: Facility Captains, Dept Managers & Shift Supervisors
export const L6_L8_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 6: FACILITY CAPTAINS (STORE & WAREHOUSE)
    // =========================================================================
    store_manager: {
        role: 'store_manager',
        level: 6,
        levelCategory: 'supervisor',
        levelTag: 'L6 Store Captain',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (HQ Operational Standards)',
        managesRoles: ['assistant_manager', 'store_supervisor', 'shift_lead', 'merchandiser', 'returns_clerk'],
        isManagerial: true
    },
    warehouse_manager: {
        role: 'warehouse_manager',
        level: 6,
        levelCategory: 'supervisor',
        levelTag: 'L6 Fulfillment Captain',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (HQ Operational Standards)',
        managesRoles: ['receiver', 'picker', 'packer', 'forklift_operator'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 7: FUNCTIONAL & DEPARTMENT MANAGERS
    // =========================================================================
    logistics_manager: {
        role: 'logistics_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Logistics Lead',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        managesRoles: ['dispatch_manager', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
        isManagerial: true
    },
    inventory_manager: {
        role: 'inventory_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Stock Integrity Lead',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        dottedLineRole: 'head_of_finance',
        dottedLineLabel: 'Internal Auditor (Variance Deep-Dives)',
        managesRoles: ['inventory_specialist', 'stock_clerk'],
        isManagerial: true
    },
    security_manager: {
        role: 'security_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Security Lead',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['loss_prevention'],
        isManagerial: true
    },
    dispatch_manager: {
        role: 'dispatch_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Fleet Lead',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        managesRoles: ['driver', 'dispatcher'],
        isManagerial: true
    },
    cs_manager: {
        role: 'cs_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Customer Lead',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['customer_service'],
        isManagerial: true
    },
    vendor_relations_manager: {
        role: 'vendor_relations_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Vendor Lead',
        reportsToRole: 'head_of_procurement',
        reportsToLabel: 'Head of Procurement',
        managesRoles: ['buyer', 'customs_import_specialist'],
        isManagerial: true
    },
    manager: {
        role: 'manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Manager',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['sales_associate', 'cashier'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 8: DEPUTY & SHIFT SUPERVISORS
    // =========================================================================
    assistant_manager: {
        role: 'assistant_manager',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Store Deputy',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['shift_lead', 'cashier', 'sales_associate'],
        isManagerial: true
    },
    fleet_maintenance_supervisor: {
        role: 'fleet_maintenance_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Transport Supervisor',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        dottedLineRole: 'dispatch_manager',
        dottedLineLabel: 'Dispatch Manager (Vehicle Availability)',
        managesRoles: ['driver'],
        isManagerial: true
    },
    store_supervisor: {
        role: 'store_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Floor Supervisor',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['merchandiser', 'stock_clerk'],
        isManagerial: true
    },
    shift_lead: {
        role: 'shift_lead',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Shift Lead',
        reportsToRole: 'assistant_manager',
        reportsToLabel: 'Assistant Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Floor Continuity)',
        managesRoles: ['cashier', 'sales_associate', 'pos'],
        isManagerial: true
    }
};
