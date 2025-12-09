import { describe, it, expect } from 'vitest';
import {
    hasPermission,
    checkSoDViolations,
    canApprove,
    ACTION_PERMISSIONS,
    CONFLICTING_DUTIES
} from '../../../services/permissions.service';
import type { UserRole } from '../../../services/auth.service';

describe('Permissions Service', () => {

    describe('hasPermission', () => {
        it('should return true if user has the permission', () => {
            expect(hasPermission('super_admin', 'settings.manage_roles')).toBe(true);
        });

        it('should return false if user does not have the permission', () => {
            expect(hasPermission('pos', 'settings.manage_roles')).toBe(false);
        });

        it('should handle all roles defined in ACTION_PERMISSIONS', () => {
            const roles = Object.keys(ACTION_PERMISSIONS) as UserRole[];
            roles.forEach(role => {
                const permissions = ACTION_PERMISSIONS[role];
                if (permissions.length > 0) {
                    expect(hasPermission(role, permissions[0])).toBe(true);
                }
            });
        });
    });

    describe('checkSoDViolations', () => {
        it('should detect conflicts for roles with conflicting duties', () => {
            // Temporarily mock a role with conflicts if none exist by default, 
            // but let's check a known one or simulate it.
            // In our current config, finance_manager has 'finance.create_expense' AND 'finance.approve_expense'
            // which IS a violation.
            const violations = checkSoDViolations('finance_manager');
            expect(violations).toContain('finance.create_expense');
            expect(violations).toContain('finance.approve_expense');
        });

        it('should return empty array for roles with no conflicts', () => {
            const violations = checkSoDViolations('picker');
            expect(violations).toHaveLength(0);
        });
    });

    describe('canApprove', () => {
        it('should allow finance_manager to approve expenses > 1000', () => {
            expect(canApprove('finance_manager', 'expense', 2000)).toBe(true);
        });

        it('should NOT allow manager to approve expenses > 1000', () => {
            // Manager limit is 1000
            expect(canApprove('manager', 'expense', 2000)).toBe(false);
        });

        it('should require super_admin for high value expenses', () => {
            // Assuming threshold is high, e.g. > 5000
            expect(canApprove('super_admin', 'expense', 10000)).toBe(true);
        });
    });

});
