import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Level 10: Frontline Store, Warehouse & Fleet Staff
export const L10_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // --- Store Frontline ---
    cashier: {
        role: 'cashier',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 POS Specialist',
        reportsToRole: 'pos_supervisor',
        reportsToLabel: 'POS Supervisor / Shift Supervisor',
        dottedLineRole: 'regional_finance_manager',
        dottedLineLabel: 'Regional Finance Manager (Daily Drawer Reconciliations & Till Limits)',
        managesRoles: [],
        isManagerial: false
    },
    store_associate: {
        role: 'store_associate',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Store Associate',
        reportsToRole: 'shift_supervisor',
        reportsToLabel: 'Shift Supervisor',
        dottedLineRole: 'assistant_store_manager',
        dottedLineLabel: 'Assistant Store Manager (Customer Service Standards)',
        managesRoles: [],
        isManagerial: false
    },
    sales_associate: {
        role: 'sales_associate',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Retail Associate',
        reportsToRole: 'shift_supervisor',
        reportsToLabel: 'Shift Supervisor',
        dottedLineRole: 'assistant_store_manager',
        dottedLineLabel: 'Assistant Store Manager (Customer Service & Floor Standards)',
        managesRoles: [],
        isManagerial: false
    },
    stock_clerk: {
        role: 'stock_clerk',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Stock Specialist',
        reportsToRole: 'stock_control_supervisor',
        reportsToLabel: 'Stock Control Supervisor',
        dottedLineRole: 'assistant_store_manager',
        dottedLineLabel: 'Assistant Store Manager (Stock Availability & Backroom Flow)',
        managesRoles: [],
        isManagerial: false
    },
    merchandiser: {
        role: 'merchandiser',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Store Display Specialist',
        reportsToRole: 'shift_supervisor',
        reportsToLabel: 'Store Supervisor',
        dottedLineRole: 'regional_merchandising_manager',
        dottedLineLabel: 'Regional Merchandising Manager (Planogram & Promotional Facing)',
        managesRoles: [],
        isManagerial: false
    },
    returns_clerk: {
        role: 'returns_clerk',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Returns Specialist',
        reportsToRole: 'assistant_store_manager',
        reportsToLabel: 'Assistant Store Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (RMA Governance & Shrinkage Authorization)',
        managesRoles: [],
        isManagerial: false
    },
    customer_service: {
        role: 'customer_service',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Support Specialist',
        reportsToRole: 'cs_manager',
        reportsToLabel: 'Customer Service Manager',
        dottedLineRole: 'assistant_store_manager',
        dottedLineLabel: 'Assistant Store Manager (Store Escalations & Returns)',
        managesRoles: [],
        isManagerial: false
    },

    // --- Warehouse Inbound & Inventory Frontline ---
    receiver: {
        role: 'receiver',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Inbound Specialist',
        reportsToRole: 'receiving_team_leader',
        reportsToLabel: 'Receiving Team Leader / Supervisor',
        dottedLineRole: 'receiving_supervisor',
        dottedLineLabel: 'Receiving Supervisor (PO Variance Verification)',
        managesRoles: [],
        isManagerial: false
    },
    receiving_operator: {
        role: 'receiving_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Receiving Operator',
        reportsToRole: 'receiving_team_leader',
        reportsToLabel: 'Receiving Team Leader',
        dottedLineRole: 'receiving_supervisor',
        dottedLineLabel: 'Receiving Supervisor (Inbound Dock Inspection)',
        managesRoles: [],
        isManagerial: false
    },
    putaway_operator: {
        role: 'putaway_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Putaway Operator',
        reportsToRole: 'putaway_replenishment_supervisor',
        reportsToLabel: 'Putaway & Replenishment Supervisor',
        managesRoles: [],
        isManagerial: false
    },
    replenishment_operator: {
        role: 'replenishment_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Replenishment Operator',
        reportsToRole: 'putaway_replenishment_supervisor',
        reportsToLabel: 'Putaway & Replenishment Supervisor',
        managesRoles: [],
        isManagerial: false
    },
    inventory_controller: {
        role: 'inventory_controller',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Inventory Controller',
        reportsToRole: 'inventory_control_supervisor',
        reportsToLabel: 'Inventory Control Supervisor',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Stock Accuracy)',
        managesRoles: [],
        isManagerial: false
    },
    stock_counter: {
        role: 'stock_counter',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Stock Counter',
        reportsToRole: 'inventory_control_supervisor',
        reportsToLabel: 'Inventory Control Supervisor',
        dottedLineRole: 'inventory_manager',
        dottedLineLabel: 'Inventory Manager (Blind Cycle Count Verification)',
        managesRoles: [],
        isManagerial: false
    },
    inventory_specialist: {
        role: 'inventory_specialist',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Audit Specialist',
        reportsToRole: 'inventory_control_supervisor',
        reportsToLabel: 'Inventory Control Supervisor / Manager',
        dottedLineRole: 'country_finance_director',
        dottedLineLabel: 'Senior Auditor (Blind Cycle Count Verifications)',
        managesRoles: [],
        isManagerial: false
    },

    // --- Warehouse Outbound & Fulfillment Frontline ---
    picker: {
        role: 'picker',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Fulfillment Specialist',
        reportsToRole: 'picking_team_leader',
        reportsToLabel: 'Picking Team Leader',
        dottedLineRole: 'picking_supervisor',
        dottedLineLabel: 'Picking Supervisor (Order Accuracy)',
        managesRoles: [],
        isManagerial: false
    },
    packer: {
        role: 'packer',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Outbound Specialist',
        reportsToRole: 'packing_team_leader',
        reportsToLabel: 'Packing Team Leader',
        dottedLineRole: 'packing_supervisor',
        dottedLineLabel: 'Packing Supervisor (Packing & Order Readiness)',
        managesRoles: [],
        isManagerial: false
    },
    dispatch_operator: {
        role: 'dispatch_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Dispatch Operator',
        reportsToRole: 'dispatch_team_leader',
        reportsToLabel: 'Dispatch Team Leader',
        dottedLineRole: 'dispatch_supervisor',
        dottedLineLabel: 'Dispatch Supervisor (Staging & Manifest Verification)',
        managesRoles: [],
        isManagerial: false
    },
    returns_operator: {
        role: 'returns_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Returns Operator',
        reportsToRole: 'returns_waste_supervisor',
        reportsToLabel: 'Returns & Waste Supervisor',
        dottedLineRole: 'cs_manager',
        dottedLineLabel: 'Customer Service (RMA Exception Resolution)',
        managesRoles: [],
        isManagerial: false
    },
    forklift_operator: {
        role: 'forklift_operator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Equipment Operator',
        reportsToRole: 'putaway_replenishment_supervisor',
        reportsToLabel: 'Putaway & Replenishment Supervisor',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Heavy Material Flow)',
        managesRoles: [],
        isManagerial: false
    },
    driver: {
        role: 'driver',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Transport Driver',
        reportsToRole: 'dispatch_supervisor',
        reportsToLabel: 'Dispatch Supervisor',
        dottedLineRole: 'fleet_maintenance_supervisor',
        dottedLineLabel: 'Fleet Maint. Supervisor (Pre-Trip Inspection)',
        managesRoles: [],
        isManagerial: false
    },
    fleet_mechanic: {
        role: 'fleet_mechanic',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Fleet Mechanic',
        reportsToRole: 'fleet_maintenance_supervisor',
        reportsToLabel: 'Fleet Maintenance Supervisor',
        dottedLineRole: 'transport_fleet_manager',
        dottedLineLabel: 'Transport & Fleet Manager (Roadworthiness Signoff)',
        managesRoles: [],
        isManagerial: false
    },
    warehouse_administrator: {
        role: 'warehouse_administrator',
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Manifest & Documentation',
        reportsToRole: 'dispatch_supervisor',
        reportsToLabel: 'Dispatch Supervisor',
        dottedLineRole: 'warehouse_operations_manager',
        dottedLineLabel: 'Warehouse Operations Manager (Document Control & Manifest Audit)',
        managesRoles: [],
        isManagerial: false
    }
};
