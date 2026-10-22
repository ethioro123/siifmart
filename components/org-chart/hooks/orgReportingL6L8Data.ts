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
        reportsToRole: 'area_operations_manager',
        reportsToLabel: 'Area Operations Manager (Multi-Store Cluster Lead)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Retail Oversight)',
        managesRoles: [
            'assistant_store_manager', 'assistant_manager',
            'shift_supervisor', 'store_supervisor', 'shift_lead',
            'stock_control_supervisor', 'receiving_supervisor', 'pos_supervisor',
            'merchandiser', 'returns_clerk'
        ],
        isManagerial: true
    },
    warehouse_manager: {
        role: 'warehouse_manager',
        level: 6,
        levelCategory: 'supervisor',
        levelTag: 'L6 Fulfillment Captain',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager (Regional Warehousing & Distribution)',
        dottedLineRole: 'country_supply_chain_director',
        dottedLineLabel: 'Country Supply Chain Director (National Supply Chain Governance)',
        managesRoles: [
            'warehouse_operations_manager', 'transport_fleet_manager',
            'receiving_supervisor', 'inventory_control_supervisor',
            'putaway_replenishment_supervisor', 'picking_supervisor',
            'packing_supervisor', 'dispatch_supervisor', 'returns_waste_supervisor',
            'receiver', 'picker', 'packer', 'forklift_operator'
        ],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 7: FUNCTIONAL & DEPARTMENT MANAGERS
    // =========================================================================
    warehouse_operations_manager: {
        role: 'warehouse_operations_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Warehouse Operations',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager (Fulfillment Center Lead)',
        managesRoles: ['putaway_replenishment_supervisor', 'picking_supervisor', 'packing_supervisor'],
        isManagerial: true
    },
    transport_fleet_manager: {
        role: 'transport_fleet_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Fleet Operations Lead',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Dock & Loading Coordination)',
        managesRoles: ['dispatch_supervisor', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
        isManagerial: true
    },
    logistics_manager: {
        role: 'logistics_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Logistics Lead',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager',
        dottedLineRole: 'head_of_supply_chain',
        dottedLineLabel: 'Head of Supply Chain (HQ Supply Chain)',
        managesRoles: ['dispatch_manager', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
        isManagerial: true
    },
    inventory_manager: {
        role: 'inventory_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Stock Integrity Lead',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager',
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
        reportsToRole: 'transport_fleet_manager',
        reportsToLabel: 'Transport & Fleet Manager',
        dottedLineRole: 'logistics_manager',
        dottedLineLabel: 'Logistics Manager',
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
    // LEVEL 8: DEPUTY & SHIFT SUPERVISORS & TEAM LEADERS
    // =========================================================================
    assistant_store_manager: {
        role: 'assistant_store_manager',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Store Deputy',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['shift_supervisor', 'shift_lead', 'store_associate', 'cashier', 'sales_associate'],
        isManagerial: true
    },
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
    shift_supervisor: {
        role: 'shift_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Shift Supervisor',
        reportsToRole: 'assistant_store_manager',
        reportsToLabel: 'Assistant Store Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Floor Continuity)',
        managesRoles: ['cashier', 'store_associate', 'sales_associate', 'pos'],
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
    },
    stock_control_supervisor: {
        role: 'stock_control_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Stock Supervisor',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['stock_clerk'],
        isManagerial: true
    },
    pos_supervisor: {
        role: 'pos_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 POS Supervisor',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['cashier', 'pos'],
        isManagerial: true
    },
    receiving_supervisor: {
        role: 'receiving_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Inbound Supervisor',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse / Store Facility Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Store Inbound Dock)',
        managesRoles: ['receiving_team_leader', 'receiving_operator', 'receiver'],
        isManagerial: true
    },
    inventory_control_supervisor: {
        role: 'inventory_control_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Stock Integrity Supervisor',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        dottedLineRole: 'country_supply_chain_director',
        dottedLineLabel: 'Supply Chain Governance (Cycle Count Integrity)',
        managesRoles: ['inventory_controller', 'stock_counter', 'inventory_specialist'],
        isManagerial: true
    },
    putaway_replenishment_supervisor: {
        role: 'putaway_replenishment_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Putaway/Replen Supervisor',
        reportsToRole: 'warehouse_operations_manager',
        reportsToLabel: 'Warehouse Operations Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager',
        managesRoles: ['putaway_operator', 'replenishment_operator'],
        isManagerial: true
    },
    picking_supervisor: {
        role: 'picking_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Picking Supervisor',
        reportsToRole: 'warehouse_operations_manager',
        reportsToLabel: 'Warehouse Operations Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager',
        managesRoles: ['picking_team_leader', 'picker'],
        isManagerial: true
    },
    packing_supervisor: {
        role: 'packing_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Packing Supervisor',
        reportsToRole: 'warehouse_operations_manager',
        reportsToLabel: 'Warehouse Operations Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager',
        managesRoles: ['packing_team_leader', 'packer'],
        isManagerial: true
    },
    dispatch_supervisor: {
        role: 'dispatch_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Dispatch Supervisor',
        reportsToRole: 'transport_fleet_manager',
        reportsToLabel: 'Transport & Fleet Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Outbound Staging)',
        managesRoles: ['dispatch_team_leader', 'dispatch_operator', 'driver'],
        isManagerial: true
    },
    returns_waste_supervisor: {
        role: 'returns_waste_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Returns & Waste Supervisor',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        dottedLineRole: 'country_compliance_manager',
        dottedLineLabel: 'Country Compliance Manager (Authorised Scrap / Write-Offs)',
        managesRoles: ['returns_operator', 'returns_clerk'],
        isManagerial: true
    },
    fleet_maintenance_supervisor: {
        role: 'fleet_maintenance_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Transport Supervisor',
        reportsToRole: 'transport_fleet_manager',
        reportsToLabel: 'Transport & Fleet Manager',
        dottedLineRole: 'dispatch_supervisor',
        dottedLineLabel: 'Dispatch Supervisor (Vehicle Availability)',
        managesRoles: ['fleet_mechanic', 'driver'],
        isManagerial: true
    },
    receiving_team_leader: {
        role: 'receiving_team_leader',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Receiving Team Lead',
        reportsToRole: 'receiving_supervisor',
        reportsToLabel: 'Receiving Supervisor',
        managesRoles: ['receiving_operator', 'receiver'],
        isManagerial: true
    },
    picking_team_leader: {
        role: 'picking_team_leader',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Picking Team Lead',
        reportsToRole: 'picking_supervisor',
        reportsToLabel: 'Picking Supervisor',
        managesRoles: ['picker'],
        isManagerial: true
    },
    packing_team_leader: {
        role: 'packing_team_leader',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Packing Team Lead',
        reportsToRole: 'packing_supervisor',
        reportsToLabel: 'Packing Supervisor',
        managesRoles: ['packer'],
        isManagerial: true
    },
    dispatch_team_leader: {
        role: 'dispatch_team_leader',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Dispatch Team Lead',
        reportsToRole: 'dispatch_supervisor',
        reportsToLabel: 'Dispatch Supervisor',
        managesRoles: ['dispatch_operator', 'driver'],
        isManagerial: true
    }
};
