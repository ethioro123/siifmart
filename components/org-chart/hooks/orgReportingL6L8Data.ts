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
        reportsToLabel: 'Area Manager (Multi-Store Cluster Lead)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Retail Oversight)',
        managesRoles: ['assistant_store_manager', 'merchandiser', 'returns_clerk'],
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
        managesRoles: ['warehouse_operations_manager', 'transport_fleet_manager', 'inventory_manager', 'receiving_supervisor', 'inventory_control_supervisor', 'putaway_replenishment_supervisor', 'picking_supervisor', 'packing_supervisor', 'dispatch_supervisor', 'returns_waste_supervisor'],
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
        dottedLineRole: 'regional_supply_chain_manager',
        dottedLineLabel: 'Regional Supply Chain Manager (Regional Operations & Wave Governance)',
        managesRoles: [],
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
    inventory_manager: {
        role: 'inventory_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Stock Integrity Lead',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager',
        dottedLineRole: 'country_finance_director',
        dottedLineLabel: 'Internal Auditor (Variance Deep-Dives)',
        managesRoles: ['inventory_specialist', 'stock_clerk'],
        isManagerial: true
    },
    cs_manager: {
        role: 'cs_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Customer Lead',
        reportsToRole: 'country_operations_director',
        reportsToLabel: 'Country Operations Director',
        managesRoles: ['customer_service'],
        isManagerial: true
    },
    vendor_relations_manager: {
        role: 'vendor_relations_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Vendor Lead',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director',
        managesRoles: ['buyer', 'customs_import_specialist'],
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
        reportsToLabel: 'Store Manager (Store Facility Lead)',
        dottedLineRole: 'area_operations_manager',
        dottedLineLabel: 'Area Manager (Multi-Store Operational Standards)',
        managesRoles: ['shift_supervisor', 'pos_supervisor', 'stock_control_supervisor', 'store_associate', 'cashier', 'sales_associate', 'customer_service'],
        isManagerial: true
    },
    shift_supervisor: {
        role: 'shift_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Shift Supervisor',
        reportsToRole: 'assistant_store_manager',
        reportsToLabel: 'Assistant Store Manager (Store Operations)',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Floor Continuity & Customer Experience)',
        managesRoles: ['cashier', 'store_associate', 'sales_associate', 'customer_service'],
        isManagerial: true
    },
    stock_control_supervisor: {
        role: 'stock_control_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Stock Supervisor',
        reportsToRole: 'assistant_store_manager',
        reportsToLabel: 'Assistant Store Manager (Store Operations)',
        dottedLineRole: 'regional_security_manager',
        dottedLineLabel: 'Regional Security Manager (Shrinkage & Stock Loss Mitigation)',
        managesRoles: ['stock_clerk'],
        isManagerial: true
    },
    pos_supervisor: {
        role: 'pos_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 POS Supervisor',
        reportsToRole: 'assistant_store_manager',
        reportsToLabel: 'Assistant Store Manager (Store Operations)',
        dottedLineRole: 'regional_finance_manager',
        dottedLineLabel: 'Regional Finance Manager (Cash Office, Till Limits & Variance Auditing)',
        managesRoles: ['cashier', 'cash_office_officer'],
        isManagerial: true
    },
    receiving_supervisor: {
        role: 'receiving_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Inbound Supervisor',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse / Store Facility Manager',
        dottedLineRole: 'regional_supply_chain_manager',
        dottedLineLabel: 'Regional Supply Chain Manager (Inbound Compliance & PO Variance)',
        managesRoles: ['receiving_team_leader'],
        isManagerial: true
    },
    inventory_control_supervisor: {
        role: 'inventory_control_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Stock Integrity Supervisor',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager (Fulfillment Center Lead)',
        dottedLineRole: 'country_compliance_manager',
        dottedLineLabel: 'Country Compliance Manager (Cycle Count Integrity & Shrinkage Governance)',
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
        dottedLineLabel: 'Warehouse Manager (Storage Allocation & Bin Integrity)',
        managesRoles: ['putaway_operator', 'replenishment_operator', 'forklift_operator'],
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
        dottedLineLabel: 'Warehouse Manager (Wave Execution & Order Accuracy)',
        managesRoles: ['picking_team_leader'],
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
        dottedLineLabel: 'Warehouse Manager (Packaging QC & Barcode Sealing)',
        managesRoles: ['packing_team_leader'],
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
        dottedLineLabel: 'Warehouse Manager (Outbound Dock Staging & Carrier Manifests)',
        managesRoles: ['dispatch_team_leader'],
        isManagerial: true
    },
    inbound_operations_supervisor: {
        role: 'inbound_operations_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Inbound Supervisor',
        reportsToRole: 'warehouse_operations_manager',
        reportsToLabel: 'Warehouse Operations Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Facility Inbound Coordination)',
        managesRoles: [],
        isManagerial: true
    },
    outbound_operations_supervisor: {
        role: 'outbound_operations_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Outbound Supervisor',
        reportsToRole: 'warehouse_operations_manager',
        reportsToLabel: 'Warehouse Operations Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Facility Outbound Staging & Manifests)',
        managesRoles: [],
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
