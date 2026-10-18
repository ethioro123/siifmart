import type { OpTab } from '../components/fulfillment/FulfillmentContext';

const WORKER_TAB_ACCESS: Record<string, OpTab[]> = {
    picker: ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK'],
    packer: ['RECEIVE', 'PUTAWAY', 'PICK', 'PACK'],
    receiver: ['RECEIVE', 'PUTAWAY', 'TRANSFER'],
    forklift_operator: ['PUTAWAY'],
    inventory_specialist: ['TRANSFER', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'LABELS'],
    driver: ['DRIVER'],
    inbound_qc_inspector: ['RECEIVE'],
    replenishment_planner: ['TRANSFER', 'REPLENISH'],
    returns_clerk: ['RETURNS'],
    stock_clerk: ['PUTAWAY', 'COUNT', 'REPLENISH', 'LABELS'],
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
    const workerTabs = WORKER_TAB_ACCESS[normalizedRole];
    if (workerTabs) return [...workerTabs];

    return (Object.keys(TAB_PERMISSIONS) as OpTab[])
        .filter(tab => TAB_PERMISSIONS[tab].includes(normalizedRole));
}
