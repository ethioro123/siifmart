import { z } from 'zod';

// --- Shared Utility Schemas ---
export const timestamp = z.string().datetime().or(z.string());
export const optionalString = z.string().optional().nullable();
export const optionalNumber = z.number().optional().nullable();

// --- Role Registry ---
export const UserRoleSchema = z.enum([
    'group_ceo', 'group_coo', 'group_cfo', 'super_admin', 'regional_operations_manager', 'head_of_operations', 'head_of_finance',
    'head_of_hr', 'head_of_procurement', 'head_of_supply_chain', 'store_manager',
    'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead',
    'store_supervisor', 'cashier', 'sales_associate', 'stock_clerk', 'picker',
    'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist',
    'customer_service', 'auditor', 'it_support', 'admin', 'hr', 'pos',
    'dispatcher', 'cs_manager', 'returns_clerk', 'merchandiser', 'loss_prevention',
    'accountant', 'data_analyst', 'training_coordinator', 'merchandising_specialist',
    'regional_merchandising_manager'
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
