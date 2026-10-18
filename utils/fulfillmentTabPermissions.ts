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
    dispatcher: ['DOCKS', 'DRIVER', 'TRANSFER', 'ASSIGN'],
    fleet_maintenance_supervisor: ['DOCKS', 'DRIVER', 'ASSIGN'],
    regional_logistics_lead: ['DOCKS', 'RECEIVE', 'PUTAWAY', 'TRANSFER', 'PICK', 'PACK', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'DRIVER', 'ASSIGN', 'LABELS'],
};

const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    RECEIVE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    PUTAWAY: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    TRANSFER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'retail_manager', 'logistics_manager', 'inventory_manager', 'demand_planner', 'replenishment_planner', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    PICK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    PACK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    DOCKS: ['super_admin', 'admin', 'operations_manager', 'regional_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'fleet_maintenance_supervisor'],
    DRIVER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'driver', 'logistics_manager', 'fleet_maintenance_supervisor'],
    REPLENISH: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'replenishment_planner', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
    COUNT: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', 'picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'],
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
