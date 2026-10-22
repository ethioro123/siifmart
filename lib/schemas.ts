import { z } from 'zod';

// --- Shared Utility Schemas ---
export const timestamp = z.string().datetime().or(z.string());
export const optionalString = z.string().optional().nullable();
export const optionalNumber = z.number().optional().nullable();

// --- Role Registry ---
export const UserRoleSchema = z.enum([
    'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco',
    'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
    'country_managing_director', 'country_operations_director', 'country_finance_director',
    'country_commercial_director', 'country_supply_chain_director', 'country_hr_director',
    'country_technology_director', 'country_compliance_manager',
    'super_admin', 'regional_operations_manager', 'area_operations_manager',
    'head_of_operations', 'head_of_finance', 'head_of_hr', 'head_of_procurement',
    'head_of_supply_chain', 'head_of_merchandising', 'head_of_it', 'head_of_audit',
    'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager',
    'regional_hr_manager', 'regional_merchandising_manager', 'regional_logistics_manager', 'regional_security_manager',
    'store_manager', 'warehouse_manager',
    'warehouse_operations_manager', 'transport_fleet_manager',
    'logistics_manager', 'inventory_manager', 'security_manager',
    'dispatch_manager', 'cs_manager', 'vendor_relations_manager',
    'assistant_store_manager', 'assistant_manager',
    'shift_supervisor', 'store_supervisor', 'shift_lead',
    'receiving_supervisor', 'stock_control_supervisor', 'pos_supervisor',
    'inventory_control_supervisor', 'putaway_replenishment_supervisor',
    'picking_supervisor', 'packing_supervisor', 'dispatch_supervisor',
    'returns_waste_supervisor', 'fleet_maintenance_supervisor',
    'receiving_team_leader', 'picking_team_leader', 'packing_team_leader', 'dispatch_team_leader',
    'store_operations_auditor', 'auditor', 'payroll_specialist',
    'treasury_officer', 'tax_compliance_officer', 'credit_control_officer',
    'accountant', 'data_analyst', 'training_coordinator', 'talent_recruiter',
    'hr_generalist', 'merchandising_specialist', 'customs_import_specialist',
    'it_support', 'dispatcher', 'buyer', 'demand_planner',
    'replenishment_planner', 'inbound_qc_inspector', 'loss_prevention',
    'cashier', 'store_associate', 'sales_associate', 'pos', 'merchandiser',
    'inventory_specialist', 'customer_service', 'stock_clerk',
    'receiving_operator', 'putaway_operator', 'replenishment_operator',
    'inventory_controller', 'stock_counter', 'dispatch_operator',
    'returns_operator', 'fleet_mechanic',
    'picker', 'packer', 'receiver', 'returns_clerk',
    'driver', 'forklift_operator', 'admin', 'hr', 'CEO', 'ceo'
]);

// --- Core App Entities ---

export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    role: UserRoleSchema,
    avatar: z.string().url().or(z.string()),
    title: z.string(),
    siteId: optionalString,
});

export const NotificationSchema = z.object({
    id: z.string(),
    type: z.enum(['alert', 'success', 'info', 'warning']),
    message: z.string(),
    timestamp: timestamp,
    read: z.boolean(),
});

export const SiteSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    type: z.enum(['Administration', 'Administrative', 'Central Operations', 'Warehouse', 'Store', 'Distribution Center', 'HQ', 'Headquarters']),
    address: z.string(),
    contact: optionalString,
    status: z.enum(['Active', 'Maintenance', 'Closed']),
    manager: optionalString,
    capacity: optionalNumber,
    terminalCount: optionalNumber,
    language: z.enum(['en', 'am', 'or']).default('en'),
}).passthrough();

// --- Inference Exports (The Magic) ---
export type AppUser = z.infer<typeof UserSchema>;
export type AppNotification = z.infer<typeof NotificationSchema>;
export type AppSite = z.infer<typeof SiteSchema>;
export type AppUserRole = z.infer<typeof UserRoleSchema>;
