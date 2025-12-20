/**
 * Supabase Authentication Service
 * Handles user authentication, session management, and role-based access
 */

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { employeesService } from './supabase.service';
import { systemLogsService } from './systemLogs.service';
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

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'warehouse_manager' | 'dispatcher' | 'pos' | 'picker' | 'packer' | 'hr' | 'auditor' | 'driver' | 'finance_manager' | 'procurement_manager' | 'store_supervisor' | 'inventory_specialist' | 'cs_manager' | 'it_support';

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

        // Create employee record
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

            // Log account creation
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
        console.log('AuthService: Signing in...', identifier);

        let email = identifier;

        // Check if identifier is an email
        const isEmail = identifier.includes('@');

        if (!isEmail) {
            console.log('AuthService: Identifier is username, looking up email...');

            // Try standard lookup first
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
            console.log('AuthService: Found email for username:', email);
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('AuthService: Sign in error', error);
            throw error;
        }

        console.log('AuthService: Sign in successful', data.user?.id);

        // Log the signin
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
        // Log logout before signing out
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

    /**
     * Get current session
     */
    async getSession(): Promise<Session | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Get current auth user with employee data
     */
    async getCurrentAuthUser(): Promise<UserProfile | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            // Get employee data
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

    /**
     * Update user password
     */
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        // Log password change
        this.logSecurityEvent('PASSWORD_CHANGED', 'User changed their password');
    },

    /**
     * Update user metadata
     */
    async updateUserMetadata(metadata: Record<string, any>) {
        const { data, error } = await supabase.auth.updateUser({
            data: metadata
        });

        if (error) throw error;

        return data;
    },

    /**
     * Reset password via email
     */
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;

        systemLogsService.logSecurity('PASSWORD_RESET_REQUEST', `Password reset requested for ${email}`);
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    // ============================================================================
    // PERMISSION HELPERS
    // ============================================================================

    /**
     * Check if user has required role
     */
    hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
        return requiredRoles.includes(userRole);
    },

    /**
     * Check if user is admin or super admin
     */
    isAdmin(userRole: UserRole): boolean {
        return ['super_admin', 'admin'].includes(userRole);
    },

    /**
     * Check if user has a specific permission
     */
    checkPermission(userRole: UserRole, permission: Permission): boolean {
        return hasPermission(userRole, permission);
    },

    /**
     * Check if user has all specified permissions
     */
    checkAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
        return hasAllPermissions(userRole, permissions);
    },

    /**
     * Check if user has any of the specified permissions
     */
    checkAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
        return hasAnyPermission(userRole, permissions);
    },

    /**
     * Get all permissions for a role
     */
    getUserPermissions(userRole: UserRole): Permission[] {
        return getRolePermissions(userRole);
    },

    /**
     * Check for separation of duties violations
     */
    validateSeparationOfDuties(userRole: UserRole): Permission[] {
        const violations = checkSoDViolations(userRole);
        if (violations.length > 0) {
            this.logSecurityEvent('SOD_VIOLATION', `SoD violations detected for role ${userRole}: ${violations.join(', ')}`, 'WARNING');
        }
        return violations;
    },

    /**
     * Check if user can approve a workflow
     */
    canApproveWorkflow(userRole: UserRole, workflowName: string, amount?: number): boolean {
        return canApprove(userRole, workflowName, amount);
    },

    /**
     * Get list of approvers for a workflow
     */
    getWorkflowApprovers(workflowName: string, amount?: number): UserRole[] {
        return getRequiredApprovers(workflowName, amount);
    },

    /**
     * Log a security event
     */
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
// ROLE-BASED ACCESS CONTROL
// ============================================================================

export const ROLE_PERMISSIONS = {
    super_admin: ['*'], // CEO / Owner - Full Access to EVERYTHING
    admin: [
        'dashboard', 'settings', 'employees', 'profile'  // System admin - technical/IT access only
    ],
    manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'pricing', 'profile'  // Store operations only (NO warehouse, NO procurement)
    ],
    warehouse_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'profile'
    ],
    dispatcher: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'profile'
    ],
    finance_manager: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees', 'profile'
    ],
    procurement_manager: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance', 'profile'
    ],
    cs_manager: [
        'dashboard', 'customers', 'sales', 'profile'
    ],
    it_support: [
        'dashboard', 'settings', 'employees', 'profile'
    ],
    store_supervisor: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'  // Added inventory
    ],
    inventory_specialist: [
        'dashboard', 'inventory', 'warehouse', 'profile'
    ],
    pos: [
        'dashboard', 'pos', 'customers', 'inventory', 'profile'  // Added inventory (read-only)
    ],
    picker: [
        'dashboard', 'warehouse', 'inventory', 'profile'  // Added inventory (read-only)
    ],
    hr: [
        'dashboard', 'employees', 'finance', 'profile'  // HR - employee and payroll management
    ],
    auditor: [
        'dashboard', 'sales', 'inventory', 'finance', 'profile'  // Auditor - read-only financial oversight
    ],
    driver: [
        'dashboard', 'warehouse', 'profile'
    ],
    packer: [
        'dashboard', 'warehouse', 'inventory', 'profile'
    ]
};

export function canAccessRoute(userRole: UserRole, route: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];

    // Super admin has access to everything
    if (permissions.includes('*')) return true;

    // Check if route is in permissions
    return permissions.some(permission =>
        route.toLowerCase().includes(permission.toLowerCase())
    );
}

/**
 * Get available sections filtered by site type
 * Prevents warehouse workers at stores from seeing warehouse sections and vice versa
 */
export function getAvailableSections(userRole: UserRole, siteType?: string): string[] {
    const basePermissions = ROLE_PERMISSIONS[userRole];

    // Super admin always gets all permissions
    if (basePermissions.includes('*')) return basePermissions;

    // If no site type provided, return base permissions
    if (!siteType) return basePermissions;

    // Filter out warehouse sections if user is at a Store
    if (siteType === 'Store' || siteType === 'Dark Store') {
        return basePermissions.filter(p =>
            p !== 'warehouse' && p !== 'procurement'
        );
    }

    // Filter out POS sections if user is at a Warehouse
    if (siteType === 'Warehouse' || siteType === 'Distribution Center') {
        return basePermissions.filter(p => p !== 'pos');
    }

    return basePermissions;
}

/**
 * Check if user can access a specific site
 * Enforces site-level data isolation
 */
export function canAccessSite(userRole: UserRole, userSiteId: string, targetSiteId: string): boolean {
    // Super admin can access all sites
    if (userRole === 'super_admin') return true;

    // Admin, HR, Finance Manager, Procurement Manager, CS Manager, IT Support, and Auditor can access all sites (Admin roles)
    const adminRoles: UserRole[] = ['admin', 'hr', 'finance_manager', 'procurement_manager', 'cs_manager', 'it_support', 'auditor'];
    if (adminRoles.includes(userRole)) return true;

    // All other roles can only access their assigned site
    return userSiteId === targetSiteId;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const sessionService = {
    /**
     * Store session in localStorage (backup)
     */
    storeSession(session: Session) {
        localStorage.setItem('siif_session', JSON.stringify(session));
    },

    /**
     * Get stored session
     */
    getStoredSession(): Session | null {
        const stored = localStorage.getItem('siif_session');
        return stored ? JSON.parse(stored) : null;
    },

    /**
     * Clear stored session
     */
    clearSession() {
        localStorage.removeItem('siif_session');
    },

    /**
     * Check if session is valid
     */
    isSessionValid(session: Session): boolean {
        if (!session) return false;

        const expiresAt = session.expires_at;
        if (!expiresAt) return false;

        return new Date(expiresAt * 1000) > new Date();
    }
};
