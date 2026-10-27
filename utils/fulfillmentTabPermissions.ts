import type { OpTab } from '../components/fulfillment/FulfillmentContext';
import { FLOOR_WORKER_ROLES } from './fulfillmentRoles';

const CORE_FLOOR_TABS: OpTab[] = ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK'];

const FLOOR_WORKER_EXTRA_TABS: Record<string, OpTab[]> = {
    receiver: ['TRANSFER'],
    replenishment_operator: ['REPLENISH'],
    inventory_specialist: ['TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS'],
    inventory_controller: ['REPLENISH', 'COUNT', 'WASTE', 'LABELS'],
    stock_clerk: ['COUNT', 'REPLENISH', 'LABELS'],
    stock_counter: ['COUNT'],
    dispatch_operator: ['DOCKS'],
    returns_clerk: ['RETURNS'],
    returns_operator: ['RETURNS'],
    fleet_mechanic: ['DOCKS'],
};

const SPECIALIST_TAB_ACCESS: Record<string, OpTab[]> = {
    driver: [...CORE_FLOOR_TABS, 'DRIVER'],
    replenishment_planner: ['TRANSFER', 'REPLENISH'],
    returns_clerk: ['RETURNS'],
    dispatcher: ['DOCKS', 'DRIVER', 'ASSIGN'],
    fleet_maintenance_supervisor: ['DOCKS', 'DRIVER', 'ASSIGN'],
    regional_logistics_manager: ['DOCKS', 'DRIVER', 'RECEIVE', 'TRANSFER'],
    country_supply_chain_director: ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'DRIVER', 'REPLENISH'],
    warehouse_operations_manager: ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'DRIVER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'ASSIGN', 'LABELS'],
    transport_fleet_manager: ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN'],
    inventory_control_supervisor: ['COUNT', 'TRANSFER', 'WASTE', 'LABELS', 'ASSIGN'],
    putaway_replenishment_supervisor: ['PUTAWAY', 'REPLENISH', 'TRANSFER', 'ASSIGN'],
    picking_supervisor: ['PICK', 'PACK', 'ASSIGN'],
    packing_supervisor: ['PACK', 'LABELS', 'ASSIGN'],
    dispatch_supervisor: ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN'],
    returns_waste_supervisor: ['RETURNS', 'WASTE', 'COUNT', 'ASSIGN'],
    receiving_team_leader: ['RECEIVE', 'PUTAWAY', 'TRANSFER', 'ASSIGN'],
    picking_team_leader: ['PICK', 'PACK', 'ASSIGN'],
    packing_team_leader: ['PACK', 'LABELS', 'ASSIGN'],
    dispatch_team_leader: ['DOCKS', 'DRIVER', 'ASSIGN'],
};

const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    RECEIVE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'receiving_operator', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'receiving_team_leader'],
    PUTAWAY: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'putaway_operator', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'putaway_replenishment_supervisor', 'receiving_team_leader'],
    TRANSFER: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'regional_supply_chain_manager', 'inventory_manager', 'replenishment_planner', 'inventory_control_supervisor', 'transport_fleet_manager', 'dispatch_supervisor'],
    PICK: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'picking_supervisor', 'picking_team_leader'],
    PACK: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'packing_supervisor', 'packing_team_leader'],
    DOCKS: ['group_ceo', 'country_managing_director', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'warehouse_manager', 'warehouse_operations_manager', 'transport_fleet_manager', 'dispatcher', 'regional_supply_chain_manager', 'fleet_maintenance_supervisor', 'dispatch_supervisor', 'dispatch_team_leader', 'dispatch_operator'],
    DRIVER: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'transport_fleet_manager', 'dispatcher', 'driver', 'regional_supply_chain_manager', 'fleet_maintenance_supervisor', 'dispatch_supervisor'],
    REPLENISH: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'replenishment_planner', 'picker', 'packer', 'receiver', 'replenishment_operator', 'putaway_replenishment_supervisor', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    COUNT: ['group_ceo', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager', 'inventory_control_supervisor', 'inventory_controller', 'stock_counter', 'inventory_specialist', 'stock_clerk'],
    WASTE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'regional_supply_chain_manager', 'inventory_manager', 'returns_waste_supervisor', 'inventory_control_supervisor', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    RETURNS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'returns_waste_supervisor', 'returns_operator', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector', 'returns_clerk'],
    ASSIGN: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'area_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'transport_fleet_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'fleet_maintenance_supervisor', 'picking_supervisor', 'packing_supervisor', 'dispatch_supervisor', 'inventory_control_supervisor'],
    LABELS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'warehouse_operations_manager', 'dispatcher', 'regional_supply_chain_manager', 'inventory_manager', 'fleet_maintenance_supervisor', 'replenishment_planner', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
};

export function getVisibleFulfillmentTabs(role?: string | null): OpTab[] {
    const normalizedRole = role?.trim().toLowerCase() ?? '';
    // Global CEO, Country Managing Director, and Country Operations Director have complete access to all fulfillment tabs
    if (
        normalizedRole === 'group_ceo' ||
        normalizedRole === 'country_managing_director' ||
        normalizedRole === 'country_operations_director'
    ) {
        return Object.keys(TAB_PERMISSIONS) as OpTab[];
    }

    if (FLOOR_WORKER_ROLES.some(workerRole => workerRole === normalizedRole)) {
        return [...CORE_FLOOR_TABS, ...(FLOOR_WORKER_EXTRA_TABS[normalizedRole] ?? [])];
    }

    const specialistTabs = SPECIALIST_TAB_ACCESS[normalizedRole];
    if (specialistTabs) return [...specialistTabs];

    return (Object.keys(TAB_PERMISSIONS) as OpTab[])
        .filter(tab => TAB_PERMISSIONS[tab].includes(normalizedRole));
}

export const ROLE_DEFAULT_TABS: Record<string, OpTab> = {
    picker: 'PICK',
    packer: 'PACK',
    receiver: 'RECEIVE',
    inbound_qc_inspector: 'RECEIVE',
    forklift_operator: 'PUTAWAY',
    driver: 'DRIVER',
    stock_clerk: 'COUNT',
    inventory_specialist: 'COUNT',
    returns_clerk: 'RETURNS',
    replenishment_planner: 'REPLENISH',
    dispatcher: 'DOCKS',
    fleet_maintenance_supervisor: 'DOCKS',
    warehouse_manager: 'DOCKS',
    warehouse_operations_manager: 'DOCKS',
    transport_fleet_manager: 'DOCKS',
    inventory_control_supervisor: 'COUNT',
    putaway_replenishment_supervisor: 'PUTAWAY',
    picking_supervisor: 'PICK',
    packing_supervisor: 'PACK',
    dispatch_supervisor: 'DOCKS',
    returns_waste_supervisor: 'RETURNS',
    receiving_team_leader: 'RECEIVE',
    picking_team_leader: 'PICK',
    packing_team_leader: 'PACK',
    dispatch_team_leader: 'DOCKS',
    receiving_operator: 'RECEIVE',
    putaway_operator: 'PUTAWAY',
    replenishment_operator: 'REPLENISH',
    inventory_controller: 'COUNT',
    stock_counter: 'COUNT',
    dispatch_operator: 'DOCKS',
    returns_operator: 'RETURNS',
    fleet_mechanic: 'DOCKS',
    regional_supply_chain_manager: 'DOCKS',
    regional_logistics_manager: 'DOCKS',
    wms: 'RECEIVE',
    manager: 'DOCKS',
    country_managing_director: 'DOCKS',
    admin: 'DOCKS',
    country_operations_director: 'DOCKS',
};

export function getDefaultFulfillmentTab(role?: string | null): OpTab {
    const normalizedRole = role?.trim().toLowerCase() ?? '';
    const preferred = ROLE_DEFAULT_TABS[normalizedRole];
    const visible = getVisibleFulfillmentTabs(role);
    if (preferred && visible.includes(preferred)) {
        return preferred;
    }
    return visible[0] ?? 'RECEIVE';
}
