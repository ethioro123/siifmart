/**
 * Zero-Trust Dynamic Policies and Runtime Permission Engine
 * 
 * Enforces dynamic role policies (session timeout, password complexity,
 * MFA flags, working hours) and custom dynamic role permissions
 * configured in RoleSettings.tsx at runtime.
 */

export interface RolePolicy {
    mfa_required: boolean;
    session_timeout: number; // in minutes
    ip_restriction: boolean;
    time_restriction: boolean;
    password_complexity: 'low' | 'medium' | 'high';
}

export type ManagedRoleId = 'admin' | 'store_manager' | 'cashier' | 'warehouse';

export const DEFAULT_ROLE_POLICIES: Record<ManagedRoleId, RolePolicy> = {
    admin: { mfa_required: true, session_timeout: 15, ip_restriction: false, time_restriction: false, password_complexity: 'high' },
    store_manager: { mfa_required: true, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
    cashier: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
    warehouse: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' }
};

// Map internal Permission keys & codes to RoleSettings item IDs
const PERMISSION_TO_ITEM_ID: Record<string, string> = {
    // POS & Sales
    'pos.access': 'pos_access',
    'ACCESS_POS': 'pos_access',
    'pos.view': 'pos_access',
    'ACCESS_SALES': 'pos_access',
    'VIEW_ALL_TRANSACTIONS': 'pos_access',
    'pos.void': 'void_bill',
    'VOID_SALE': 'void_bill',
    'pos.discount': 'give_discount',
    'APPLY_DISCOUNT': 'give_discount',

    // Inventory
    'inventory.view': 'view_stock',
    'ACCESS_INVENTORY': 'view_stock',
    'inventory.adjust': 'adjust_stock',
    'ADJUST_STOCK': 'adjust_stock',
    'inventory.view_cost': 'cost_price',
    'VIEW_COST_PRICE': 'cost_price',

    // Finance
    'reports.view': 'view_reports',
    'ACCESS_FINANCE': 'view_reports',
    'VIEW_REVENUE': 'view_reports',
    'VIEW_EXPENSES': 'view_reports',
    'finance.approve_expense': 'approve_expense',
    'APPROVE_EXPENSES': 'approve_expense',

    // Alerts
    'alert_low_stock': 'alert_low_stock',
    'alert_void': 'alert_void',
    'alert_security': 'alert_security',
    'alert_shift': 'alert_shift'
};

// Map any UserRole to one of the 4 managed role categories
export function mapUserRoleToManagedRole(userRole?: string): ManagedRoleId | null {
    if (!userRole) return null;
    const r = userRole.toLowerCase().trim().replace(/[\s-]/g, '_');
    if (['super_admin', 'admin', 'ceo'].includes(r)) return 'admin';
    if (['store_manager', 'assistant_manager', 'store_supervisor'].includes(r)) return 'store_manager';
    if (['cashier', 'pos', 'shift_lead'].includes(r)) return 'cashier';
    if (['warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist', 'inventory_manager', 'warehouse'].includes(r)) return 'warehouse';
    return null;
}

let activeRolePolicies: Record<string, RolePolicy> = { ...DEFAULT_ROLE_POLICIES };
let activeRolePermissions: Record<string, any[]> | null = null;

export function setActiveRolePolicies(policies?: Record<string, RolePolicy> | null) {
    if (policies && typeof policies === 'object' && Object.keys(policies).length > 0) {
        activeRolePolicies = { ...DEFAULT_ROLE_POLICIES, ...policies };
    } else {
        activeRolePolicies = { ...DEFAULT_ROLE_POLICIES };
    }
}

export function getActiveRolePolicy(userRole?: string): RolePolicy {
    const managed = mapUserRoleToManagedRole(userRole) || 'cashier';
    return activeRolePolicies[managed] || DEFAULT_ROLE_POLICIES[managed] || DEFAULT_ROLE_POLICIES.cashier;
}

export function setActiveRolePermissions(permissions?: Record<string, any[]> | null) {
    activeRolePermissions = permissions || null;
}

/**
 * Check if a permission is dynamically granted or revoked for a role in RoleSettings
 * Returns:
 *   true: explicitly allowed by policy
 *   false: explicitly revoked by policy
 *   undefined: not managed by dynamic role permissions (defer to static matrix)
 */
export function checkDynamicRolePermission(userRole?: string, permission?: string): boolean | undefined {
    if (!userRole || !permission) return undefined;
    const normRole = userRole.toLowerCase().trim().replace(/[\s-]/g, '_');
    
    // CEO / super_admin always has complete sovereign access
    if (normRole === 'super_admin' || normRole === 'ceo') return true;

    const managedRole = mapUserRoleToManagedRole(normRole);
    if (!managedRole || !activeRolePermissions) return undefined;

    const itemId = PERMISSION_TO_ITEM_ID[permission];
    if (!itemId) return undefined;

    // Search for the item across configured permission categories
    for (const categoryItems of Object.values(activeRolePermissions)) {
        if (!Array.isArray(categoryItems)) continue;
        const matchedItem = categoryItems.find((it: any) => it.id === itemId);
        if (matchedItem && matchedItem[managedRole] !== undefined) {
            return Boolean(matchedItem[managedRole]);
        }
    }

    return undefined;
}

/**
 * Password complexity validator based on Zero-Trust role policy
 */
export function validatePasswordAgainstPolicy(
    password: string,
    complexity: 'low' | 'medium' | 'high' = 'medium'
): { valid: boolean; reason?: string } {
    if (!password) return { valid: false, reason: 'Password cannot be empty.' };

    if (complexity === 'high') {
        if (password.length < 12) return { valid: false, reason: 'High-security role policy requires at least 12 characters.' };
        if (!/[A-Z]/.test(password)) return { valid: false, reason: 'High-security role policy requires an uppercase letter.' };
        if (!/[a-z]/.test(password)) return { valid: false, reason: 'High-security role policy requires a lowercase letter.' };
        if (!/[0-9]/.test(password)) return { valid: false, reason: 'High-security role policy requires a number.' };
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            return { valid: false, reason: 'High-security role policy requires a special character.' };
        }
    } else if (complexity === 'medium') {
        if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters.' };
        if (!(/[A-Za-z]/.test(password) && /[0-9]/.test(password))) {
            return { valid: false, reason: 'Password must contain both letters and numbers.' };
        }
    } else {
        if (password.length < 6) return { valid: false, reason: 'Password must be at least 6 characters.' };
    }

    return { valid: true };
}

/**
 * Evaluates whether the user is permitted to operate at the current time
 * based on the Zero-Trust time restriction policy.
 * Frontline shift roles (cashier, warehouse, store_manager) with time_restriction=true
 * are only permitted during operational hours (06:00 - 22:00 local time).
 */
export function checkTimeRestriction(userRole?: string): { allowed: boolean; reason?: string } {
    if (!userRole) return { allowed: true };
    const norm = userRole.toLowerCase().trim().replace(/[\s-]/g, '_');
    if (norm === 'super_admin' || norm === 'ceo') return { allowed: true };

    const policy = getActiveRolePolicy(userRole);
    if (!policy.time_restriction) return { allowed: true };

    const currentHour = new Date().getHours();
    // Authorized operational hours: 06:00 (6 AM) to 22:00 (10 PM)
    if (currentHour < 6 || currentHour >= 22) {
        return {
            allowed: false,
            reason: `Zero-Trust Policy: Access denied for role "${userRole}" outside authorized operational shift hours (06:00 - 22:00). Current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        };
    }

    return { allowed: true };
}

/**
 * Evaluates network / IP restrictions based on the Zero-Trust role policy.
 * Ensures terminals assigned to constrained roles connect through trusted networks/endpoints.
 */
export function checkIpRestriction(userRole?: string, hostOrIp?: string): { allowed: boolean; reason?: string } {
    if (!userRole) return { allowed: true };
    const norm = userRole.toLowerCase().trim().replace(/[\s-]/g, '_');
    if (norm === 'super_admin' || norm === 'ceo') return { allowed: true };

    const policy = getActiveRolePolicy(userRole);
    if (!policy.ip_restriction) return { allowed: true };

    const host = hostOrIp || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
    const isTrustedNetwork =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.') ||
        host.endsWith('.internal') ||
        host.endsWith('.siifmart.com') ||
        host.includes('preview') ||
        host.includes('supabase');

    if (!isTrustedNetwork) {
        return {
            allowed: false,
            reason: `Zero-Trust Network Guard: Access for role "${userRole}" is restricted to authorized store / corporate networks.`
        };
    }

    return { allowed: true };
}

/**
 * Evaluates whether Multi-Factor Authentication is required for the user's role.
 */
export function checkMfaRequirement(userRole?: string, assuranceLevel?: string): { required: boolean; satisfied: boolean; reason?: string } {
    if (!userRole) return { required: false, satisfied: true };
    const norm = userRole.toLowerCase().trim().replace(/[\s-]/g, '_');

    const policy = getActiveRolePolicy(userRole);
    if (!policy.mfa_required) return { required: false, satisfied: true };

    // Only Supabase's current session assurance level proves that MFA was completed.
    // User metadata and enrolled factors alone are not proof of an AAL2 session.
    const isMfaActive = assuranceLevel === 'aal2';

    if (!isMfaActive) {
        return {
            required: true,
            satisfied: false,
            reason: `Zero-Trust Governance: Role "${userRole}" requires Multi-Factor Authentication (MFA). Please ensure MFA is configured.`
        };
    }

    return { required: true, satisfied: true };
}
