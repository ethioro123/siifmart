/**
 * Supabase Authentication Service
 * Handles user authentication, session management, and role-based access
 */

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { employeesService } from './supabase.service';
import { systemLogsService } from './local-logs.service';
import { buildCodeFilterFromLoginEmail } from '../utils/employeeIdGenerator';
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

// 4-Level Role Hierarchy for Multi-Store/Warehouse Operations (Source of truth: types/auth.ts)
import type { UserRole } from '../types/auth';
export type { UserRole };

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    jobTitle?: string;
    siteId?: string;
    avatar_url?: string;
    employeeId?: string;
    code?: string;
    regionCode?: string;
    region_code?: string;
    scopeLevel?: 'HQ' | 'REGIONAL';
    scope_level?: 'HQ' | 'REGIONAL';
    country_code?: string;
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
                .or(`name.ilike.${identifier},code.ilike.${identifier}`)
                .limit(1)
                .maybeSingle();

            if (error || !employee) {
                console.error('AuthService: Username or Worker ID lookup failed', error);
                throw new Error('Username or Worker ID not found');
            }

            email = employee.email;
        }

        const { data: firstData, error: firstError } = await supabase.auth.signInWithPassword({ email, password });
        let data = firstData;
        let error = firstError;

        // Code-style emails (KE-SIIF0043@siifmart.com or legacy siif-0043@siifmart.com) resolve through the
        // employee's worker code to their real auth email, so old and new formats both keep working.
        if (error && isEmail) {
            const codeFilter = buildCodeFilterFromLoginEmail(identifier);
            if (codeFilter) {
                const { data: emp } = await supabase
                    .from('employees')
                    .select('email')
                    .or(codeFilter)
                    .limit(1)
                    .maybeSingle();
                if (emp?.email && emp.email.toLowerCase() !== email.toLowerCase()) {
                    const retry = await supabase.auth.signInWithPassword({ email: emp.email, password });
                    data = retry.data;
                    error = retry.error;
                }
            }
        }

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

        try {
            localStorage.removeItem('siifmart_offline_profile');
        } catch {
            // Safe ignore
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getCachedAuthProfile(): UserProfile | null {
        try {
            const raw = localStorage.getItem('siifmart_offline_profile');
            return raw ? (JSON.parse(raw) as UserProfile) : null;
        } catch {
            return null;
        }
    },

    async getSession(): Promise<Session | null> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                const msg = (error.message || '').toLowerCase();
                const isNetworkFailure = !navigator.onLine || msg.includes('fetch') || msg.includes('network');
                if (!isNetworkFailure && (error.message?.includes('Refresh Token') || (error as any).status === 400)) {
                    console.warn('AuthService: Invalid refresh token while online, resetting session:', error.message);
                    await supabase.auth.signOut().catch(() => {});
                }
                return null;
            }
            return session;
        } catch (e: any) {
            const msg = String(e?.message || '').toLowerCase();
            const isNetworkFailure = !navigator.onLine || msg.includes('fetch') || msg.includes('network');
            if (!isNetworkFailure) {
                console.warn('AuthService: getSession exception, resetting session:', e?.message);
                await supabase.auth.signOut().catch(() => {});
            }
            return null;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            if (!navigator.onLine) {
                const { data: { session } } = await supabase.auth.getSession();
                return session?.user ?? null;
            }
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                const { data: { session } } = await supabase.auth.getSession();
                return session?.user ?? null;
            }
            return user;
        } catch {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                return session?.user ?? null;
            } catch {
                return null;
            }
        }
    },

    async getCurrentAuthUser(): Promise<UserProfile | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                return !navigator.onLine ? this.getCachedAuthProfile() : null;
            }

            if (!navigator.onLine) {
                const cached = this.getCachedAuthProfile();
                if (cached && (!user.id || cached.id === user.id)) {
                    return cached;
                }
            }

            const employee = await employeesService.getByEmail(user.email!);

            const profile: UserProfile = {
                id: user.id,
                email: user.email!,
                name: employee.name,
                jobTitle: employee.jobTitle || employee.job_title,
                role: employee.role as UserRole,
                siteId: employee.siteId || employee.site_id,
                avatar_url: employee.avatar,
                employeeId: employee.id,
                code: employee.code,
                regionCode: employee.regionCode || (employee as any).region_code,
                region_code: employee.regionCode || (employee as any).region_code,
                scopeLevel: employee.scopeLevel || (employee as any).scope_level,
                scope_level: employee.scopeLevel || (employee as any).scope_level,
                country_code: employee.country || (employee as any).country_code
            };

            try {
                localStorage.setItem('siifmart_offline_profile', JSON.stringify(profile));
            } catch {
                // Safe ignore
            }

            return profile;
        } catch (error) {
            console.warn('AuthService: Error getting auth user, falling back to cached offline profile', error);
            return this.getCachedAuthProfile();
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
        const adminRoles: UserRole[] = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_finance_director', 'country_hr_director', 'hr_generalist', 'country_commercial_director', 'country_supply_chain_director', 'country_technology_director', 'country_compliance_manager'];
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
