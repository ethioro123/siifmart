/**
 * Frontline & Execution Staff Permission Sets (Level 10)
 * Split from permissions.matrix.ts to adhere to Rule 2 (500-line limit).
 */

import type { Permission } from './permissions.service';

export type FrontlineRole =
    | 'cashier'
    | 'sales_associate'
    | 'store_associate'
    | 'merchandiser'
    | 'inventory_specialist'
    | 'customer_service'
    | 'stock_clerk'
    | 'picker'
    | 'packer'
    | 'receiver'
    | 'receiving_operator'
    | 'putaway_operator'
    | 'replenishment_operator'
    | 'inventory_controller'
    | 'stock_counter'
    | 'dispatch_operator'
    | 'returns_operator'
    | 'returns_clerk'
    | 'driver'
    | 'forklift_operator'
    | 'fleet_mechanic'
    | 'warehouse_administrator';

export const FRONTLINE_PERMISSIONS: Record<FrontlineRole, Permission[]> = {
    // ═══ LEVEL 10: FRONTLINE STORE & WAREHOUSE STAFF ═══
    cashier: [
        'dashboard.view', 'pos.view', 'pos.create_sale', 'customers.view'
    ],
    sales_associate: [
        'dashboard.view', 'pos.view', 'pos.create_sale', 'customers.view', 'customers.create'
    ],
    store_associate: [
        'dashboard.view', 'pos.view', 'pos.create_sale', 'inventory.view', 'customers.view', 'customers.create'
    ],
    merchandiser: [
        'dashboard.view', 'inventory.view', 'inventory.count', 'pricing.view', 'pricing.create_promo'
    ],
    inventory_specialist: [
        'dashboard.view', 'inventory.view', 'inventory.count', 'inventory.adjust', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count'
    ],
    customer_service: [
        'dashboard.view', 'customers.view', 'customers.create', 'customers.edit', 'customers.view_history',
        'sales.view', 'sales.refund'
    ],
    stock_clerk: [
        'dashboard.view', 'inventory.view', 'inventory.count', 'warehouse.view'
    ],
    picker: [
        'dashboard.view', 'warehouse.view', 'warehouse.pick', 'warehouse.receive', 'warehouse.pack', 'warehouse.putaway', 'inventory.view'
    ],
    packer: [
        'dashboard.view', 'warehouse.view', 'warehouse.pack', 'warehouse.receive', 'warehouse.pick', 'warehouse.putaway', 'inventory.view'
    ],
    receiver: [
        'dashboard.view', 'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.putaway',
        'inventory.view', 'procurement.receive'
    ],
    receiving_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.putaway',
        'inventory.view', 'procurement.receive'
    ],
    putaway_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.putaway', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack',
        'inventory.view'
    ],
    replenishment_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.putaway', 'warehouse.pick', 'warehouse.pack', 'warehouse.receive',
        'inventory.view', 'inventory.transfer'
    ],
    inventory_controller: [
        'dashboard.view', 'inventory.view', 'inventory.count', 'inventory.adjust', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count'
    ],
    stock_counter: [
        'dashboard.view', 'inventory.view', 'inventory.count', 'warehouse.view', 'warehouse.count'
    ],
    dispatch_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.dispatch', 'warehouse.pack', 'warehouse.pick', 'warehouse.receive', 'warehouse.putaway',
        'inventory.view'
    ],
    returns_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.receive', 'warehouse.putaway',
        'inventory.view', 'customers.view', 'sales.refund'
    ],
    returns_clerk: [
        'dashboard.view', 'warehouse.view', 'inventory.view',
        'customers.view', 'customers.view_history', 'sales.refund'
    ],
    driver: [
        'dashboard.view', 'warehouse.view', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.putaway'
    ],
    forklift_operator: [
        'dashboard.view', 'warehouse.view', 'warehouse.putaway', 'inventory.view'
    ],
    fleet_mechanic: [
        'dashboard.view', 'warehouse.view', 'inventory.view'
    ],
    warehouse_administrator: [
        'dashboard.view', 'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch', 'warehouse.receive', 'inventory.view'
    ]
};
