import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessRoute } from '../../services/auth.rbac';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { getRoleHierarchy, SYSTEM_ROLES, canEmployRole } from '../../utils/roles';
import { getRoleDept, getRoleLevel } from '../../components/org-chart/hooks/orgRoles';
import { recruitmentService } from '../../services/recruitment.service';

describe('HR & Talent Directorate Team Roles & Hierarchy', () => {
    describe('1. Head of Human Resources (head_of_hr)', () => {
        const role = 'country_hr_director' as const;

        it('has correct route and module access', () => {
            expect(canAccessRoute(role, '/employees')).toBe(true);
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);

            expect(canAccessModule(role, 'employees')).toBe(true);
            expect(canAccessModule(role, 'finance')).toBe(false); // General GL module is reserved; HR manages payroll via employee telemetry and /finance route
        });

        it('has supervisory staff approval, termination and payroll management permissions', () => {
            expect(authService.checkPermission(role, 'employees.view')).toBe(true);
            expect(authService.checkPermission(role, 'employees.create')).toBe(true);
            expect(authService.checkPermission(role, 'employees.edit')).toBe(true);
            expect(authService.checkPermission(role, 'employees.approve')).toBe(true);
            expect(authService.checkPermission(role, 'employees.view_salary')).toBe(true);
            expect(authService.checkPermission(role, 'employees.propose_salary')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view_payroll')).toBe(true);
            expect(authService.checkPermission(role, 'finance.manage_payroll')).toBe(true);

            expect(hasPermission(role, 'ACCESS_EMPLOYEES')).toBe(true);
            expect(hasPermission(role, 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission(role, 'TERMINATE_EMPLOYEE')).toBe(true);
        });

        it('has Level 3 ranking and hierarchy rank 97 in hr department', () => {
            expect(getRoleHierarchy(role)).toBe(97);
            expect(getRoleLevel(role)).toBe(3);
            expect(getRoleDept(role)).toBe('hr');
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(3);
            expect(sysRole?.label).toBe('Head of Human Resources');
        });

        it('can employ Level 3 and Level 4 staff, but cannot hire peers (Level 2) or CEO (Level 1)', () => {
            expect(canEmployRole(role, 'store_manager')).toBe(true);
            expect(canEmployRole(role, 'stock_clerk')).toBe(true);
            expect(canEmployRole(role, 'talent_recruiter')).toBe(true);
            expect(canEmployRole(role, 'payroll_specialist')).toBe(true);

            // Cannot hire peer or higher
            expect(canEmployRole(role, 'country_finance_director')).toBe(false);
            expect(canEmployRole(role, 'country_operations_director')).toBe(false);
            expect(canEmployRole(role, 'group_ceo')).toBe(false);
        });
    });

    describe('2. Compensation & Payroll Specialist (payroll_specialist)', () => {
        const role = 'payroll_specialist' as const;

        it('has employees and finance route access for payroll runs and compensation', () => {
            expect(canAccessRoute(role, '/employees')).toBe(true);
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessModule(role, 'employees')).toBe(true);
            expect(canAccessModule(role, 'finance')).toBe(true);
        });

        it('is a Maker: can draft payroll runs and propose salary, but cannot approve recruits or salary', () => {
            expect(authService.checkPermission(role, 'employees.view')).toBe(true);
            expect(authService.checkPermission(role, 'employees.view_salary')).toBe(true);
            expect(authService.checkPermission(role, 'finance.manage_payroll')).toBe(true);

            // Cannot approve onboarding or approve salary
            expect(authService.checkPermission(role, 'employees.approve')).toBe(false);
            expect(hasPermission(role, 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission(role, 'APPROVE_SALARY')).toBe(false);
            expect(hasPermission(role, 'PROPOSE_SALARY')).toBe(true);
        });

        it('has Level 9 ranking and hierarchy rank 40', () => {
            expect(getRoleHierarchy(role)).toBe(40);
            expect(getRoleLevel(role)).toBe(9);
            expect(getRoleDept(role)).toBe('hr');
        });

        it('cannot employ any roles as frontline staff', () => {
            expect(canEmployRole(role, 'cashier')).toBe(false);
            expect(canEmployRole(role, 'stock_clerk')).toBe(false);
        });
    });

    describe('3. Talent Acquisition Specialist (talent_recruiter)', () => {
        const role = 'talent_recruiter' as const;

        it('has employees route access for recruitment pipeline', () => {
            expect(canAccessRoute(role, '/employees')).toBe(true);
            expect(canAccessModule(role, 'employees')).toBe(true);
        });

        it('is a Maker: can source candidates, but cannot unilaterally approve recruits or salary', () => {
            expect(authService.checkPermission(role, 'employees.view')).toBe(true);
            expect(authService.checkPermission(role, 'employees.create')).toBe(true);
            expect(authService.checkPermission(role, 'employees.edit')).toBe(true);

            expect(authService.checkPermission(role, 'employees.approve')).toBe(false);
            expect(hasPermission(role, 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission(role, 'APPROVE_SALARY')).toBe(false);
        });

        it('can manage candidate intake in recruitment service', () => {
            expect(recruitmentService.canManageCandidates(role)).toBe(true);
            // Cannot create headcount requisitions (reserved for Level <= 3)
            expect(recruitmentService.canManageHiring(role)).toBe(false);
        });

        it('has Level 9 ranking and hierarchy rank 35', () => {
            expect(getRoleHierarchy(role)).toBe(35);
            expect(getRoleLevel(role)).toBe(9);
            expect(getRoleDept(role)).toBe('hr');
        });
    });

    describe('4. L&D Training Coordinator (training_coordinator)', () => {
        const role = 'training_coordinator' as const;

        it('has employees route access for training and attendance', () => {
            expect(canAccessRoute(role, '/employees')).toBe(true);
            expect(canAccessModule(role, 'employees')).toBe(true);
        });

        it('is a Maker: tracks training compliance, but cannot approve recruits or salary', () => {
            expect(authService.checkPermission(role, 'employees.view')).toBe(true);
            expect(authService.checkPermission(role, 'employees.edit')).toBe(true);
            expect(authService.checkPermission(role, 'employees.manage_attendance')).toBe(true);

            expect(authService.checkPermission(role, 'employees.approve')).toBe(false);
            expect(hasPermission(role, 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission(role, 'APPROVE_SALARY')).toBe(false);
        });

        it('has Level 9 ranking and hierarchy rank 35 in hr department', () => {
            expect(getRoleHierarchy(role)).toBe(35);
            expect(getRoleLevel(role)).toBe(9);
            expect(getRoleDept(role)).toBe('hr');
        });
    });
});
