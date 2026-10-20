import type { OpTab } from '../components/fulfillment/FulfillmentContext';
import { FLOOR_WORKER_ROLES } from './fulfillmentRoles';

const CORE_FLOOR_TABS: OpTab[] = ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK'];

const FLOOR_WORKER_EXTRA_TABS: Record<string, OpTab[]> = {
    receiver: ['TRANSFER'],
    inventory_specialist: ['TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS'],
    stock_clerk: ['COUNT', 'REPLENISH', 'LABELS'],
};

const SPECIALIST_TAB_ACCESS: Record<string, OpTab[]> = {
    driver: [...CORE_FLOOR_TABS, 'DRIVER'],
    replenishment_planner: ['TRANSFER', 'REPLENISH'],
    returns_clerk: ['RETURNS'],
    dispatch_manager: ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN'],
    dispatcher: ['DOCKS', 'DRIVER', 'ASSIGN'],
    fleet_maintenance_supervisor: ['DOCKS', 'DRIVER', 'ASSIGN'],
    regional_logistics_lead: ['DOCKS', 'DRIVER', 'RECEIVE', 'TRANSFER'],
    supply_chain_manager: ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'DRIVER', 'REPLENISH'],
};

const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    RECEIVE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    PUTAWAY: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    TRANSFER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', 'replenishment_planner'],
    PICK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    PACK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    DOCKS: ['super_admin', 'admin', 'operations_manager', 'regional_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'fleet_maintenance_supervisor'],
    DRIVER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'driver', 'logistics_manager', 'fleet_maintenance_supervisor'],
    REPLENISH: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'replenishment_planner', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    COUNT: ['super_admin', 'operations_manager', 'warehouse_manager', 'inventory_manager', 'store_manager', 'inventory_specialist', 'stock_clerk'],
    WASTE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    RETURNS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    ASSIGN: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'fleet_maintenance_supervisor'],
    LABELS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'fleet_maintenance_supervisor', 'replenishment_planner', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
};

export function getVisibleFulfillmentTabs(role?: string | null): OpTab[] {
    const normalizedRole = role?.trim().toLowerCase() ?? '';
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
    dispatch_manager: 'DOCKS',
    fleet_maintenance_supervisor: 'DOCKS',
    warehouse_manager: 'DOCKS',
    logistics_manager: 'DOCKS',
    wms: 'RECEIVE',
    manager: 'DOCKS',
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
