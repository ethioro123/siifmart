/**
 * Supabase Authentication Service
 * Handles user authentication, session management, and role-based access
 */

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { employeesService } from './supabase.service';
import { systemLogsService } from './local-logs.service';
import {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getRolePermissions,
    checkSoDViolations,
    canApprove,
    getRequiredApprovers,
    type Permission
} from './permissions.service';

// 4-Level Role Hierarchy for Multi-Store/Warehouse Operations
export type UserRole =
    // Level 1 - Executive
    | 'super_admin'
    // Level 2 - Regional/Directors
    | 'regional_manager' | 'operations_manager' | 'finance_manager'
    | 'hr_manager' | 'procurement_manager' | 'supply_chain_manager'
    // Level 3 - Site Managers
    | 'store_manager' | 'warehouse_manager' | 'dispatch_manager'
    | 'assistant_manager' | 'shift_lead'
    // Level 4 - Staff
    | 'cashier' | 'sales_associate' | 'stock_clerk' | 'picker' | 'packer'
    | 'receiver' | 'driver' | 'forklift_operator' | 'inventory_specialist'
    | 'customer_service' | 'auditor' | 'it_support'
    // Legacy (backwards compatibility)
    | 'admin' | 'hr' | 'pos' | 'dispatcher'
    | 'cs_manager' | 'returns_clerk' | 'merchandiser' | 'loss_prevention'
    | 'accountant' | 'data_analyst' | 'training_coordinator' | 'store_supervisor'
    // New roles
    | 'buyer' | 'demand_planner' | 'inventory_manager' | 'logistics_manager' | 'security_manager';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    siteId?: string;
    avatar_url?: string;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authService = {
    /**
     * Sign up a new user (admin only)
     */
    async signUp(email: string, password: string, role: UserRole, name: string, siteId: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role, name, siteId }
            }
        });

        if (error) throw error;

        if (data.user) {
            await employeesService.create({
                id: data.user.id,
                name,
                email,
                role,
                siteId,
                code: `EMP-${Math.floor(Math.random() * 10000)}`,
                status: 'Active',
                joinDate: new Date().toISOString(),
                phone: '',
                department: role,
                avatar: '',
                performanceScore: 0
            });

            systemLogsService.logSecurity('ACCOUNT_CREATED', `Created account for ${name} (${role})`, {
                id: data.user.id,
                name,
                role
            });
        }

        return data;
    },

    /**
     * Sign in with email/username and password
     */
    async signIn(identifier: string, password: string) {
        let email = identifier;
        const isEmail = identifier.includes('@');

        if (!isEmail) {
            let { data: employee, error } = await supabase
                .from('employees')
                .select('email')
                .ilike('name', identifier)
                .single();

            if (error || !employee) {
                console.error('AuthService: Username lookup failed', error);
                throw new Error('Username not found');
            }

            email = employee.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('AuthService: Sign in error', error);
            throw error;
        }

        if (data.user) {
            try {
                systemLogsService.logSecurity('LOGIN', `User logged in from ${identifier}`, {
                    id: data.user.id,
                    email: data.user.email
                });
            } catch (e) {
                console.warn('Failed to log signin event', e);
            }
        }

        return data;
    },

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const user = await this.getCurrentUser();
            if (user) {
                systemLogsService.logSecurity('LOGOUT', `User logged out`, {
                    id: user.id,
                    email: user.email
                });
            }
        } catch (e) {
            console.warn('Failed to log logout event', e);
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession(): Promise<Session | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async getCurrentAuthUser(): Promise<UserProfile | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            const employee = await employeesService.getByEmail(user.email!);

            return {
                id: user.id,
                email: user.email!,
                name: employee.name,
                role: employee.role as UserRole,
                siteId: employee.siteId || employee.site_id,
                avatar_url: employee.avatar
            };
        } catch (error) {
            console.warn('AuthService: Error getting auth user', error);
            return null;
        }
    },

    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        this.logSecurityEvent('PASSWORD_CHANGED', 'User changed their password');
    },

    async updateUserMetadata(metadata: Record<string, any>) {
        const { data, error } = await supabase.auth.updateUser({ data: metadata });
        if (error) throw error;
        return data;
    },

    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        systemLogsService.logSecurity('PASSWORD_RESET_REQUEST', `Password reset requested for ${email}`);
    },

    /**
     * Admin: Directly set a user's password via Edge Function
     * The service_role key stays server-side — never exposed to the client
     */
    async adminResetPassword(userId: string, newPassword: string) {
        const { data, error } = await supabase.functions.invoke('admin-reset-password', {
            body: { userId, newPassword }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
    },

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    // ============================================================================
    // PERMISSION HELPERS
    // ============================================================================

    hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
        return requiredRoles.includes(userRole);
    },

    isAdmin(userRole: UserRole): boolean {
        const adminRoles: UserRole[] = [
            'super_admin',
            'regional_manager', 'operations_manager', 'finance_manager',
            'hr_manager', 'procurement_manager', 'supply_chain_manager',
            'admin', 'hr'
        ];
        return adminRoles.includes(userRole);
    },

    checkPermission(userRole: UserRole, permission: Permission): boolean {
        return hasPermission(userRole, permission);
    },

    checkAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
        return hasAllPermissions(userRole, permissions);
    },

    checkAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
        return hasAnyPermission(userRole, permissions);
    },

    getUserPermissions(userRole: UserRole): Permission[] {
        return getRolePermissions(userRole);
    },

    validateSeparationOfDuties(userRole: UserRole): Permission[] {
        const violations = checkSoDViolations(userRole);
        if (violations.length > 0) {
            this.logSecurityEvent('SOD_VIOLATION', `SoD violations detected for role ${userRole}: ${violations.join(', ')}`, 'WARNING');
        }
        return violations;
    },

    canApproveWorkflow(userRole: UserRole, workflowName: string, amount?: number): boolean {
        return canApprove(userRole, workflowName, amount);
    },

    getWorkflowApprovers(workflowName: string, amount?: number): UserRole[] {
        return getRequiredApprovers(workflowName, amount);
    },

    async logSecurityEvent(action: string, details: string, severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') {
        const user = await this.getCurrentAuthUser();
        if (user) {
            systemLogsService.logSecurity(action, details, {
                id: user.id,
                name: user.name,
                role: user.role
            }, severity);
        }
    }
};

// ============================================================================
// RE-EXPORTS (backwards compatibility — consumers can still import from here)
// ============================================================================
export { ROLE_PERMISSIONS, canAccessRoute, getAvailableSections, canAccessSite } from './auth.rbac';
export { sessionService } from './auth.session';
