/**
 * Role & Security Policy Types
 * Defines Zero-Trust access control, role policies, and permission structures.
 */

import type { Country } from '../utils/localization';

export interface RolePolicy {
    mfa_required: boolean;
    session_timeout: number; // in minutes (5 - 120)
    ip_restriction: boolean;
    time_restriction: boolean;
    password_complexity: 'low' | 'medium' | 'high';
}

export type ManagedRoleId = 'admin' | 'store_manager' | 'cashier' | 'warehouse';

export interface RolePermissionItem {
    id: string;
    label: string;
    description?: string;
    hqApprovalRequired?: boolean;
    admin: boolean;
    store_manager: boolean;
    cashier: boolean;
    warehouse: boolean;
}

export type RolePermissionCategory = Record<string, RolePermissionItem[]>;

export interface RoleDefinition {
    id: ManagedRoleId;
    name: string;
    users: number;
    badge: string;
    description: string;
}

export interface RoleSettingsPayload {
    section: 'policies' | 'permissions';
    roleId?: ManagedRoleId;
    policies?: Record<ManagedRoleId, RolePolicy>;
    permissions?: RolePermissionCategory;
    targetCountry?: Country;
}
