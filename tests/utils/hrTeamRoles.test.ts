import { describe, it, expect } from 'vitest';
import { SYSTEM_ROLES, getRoleHierarchy, canEmployRole } from '../../utils/roles';
import { getRequiredSiteType, canRoleBeAtSiteType, getRecommendedDepartment } from '../../utils/roleSegregation';
import { canAccessRoute, ROLE_PERMISSIONS } from '../../services/auth.rbac';
import { ACTION_PERMISSIONS } from '../../services/permissions.matrix';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { getRoleDept, getRoleLevel, getRoleRank } from '../../components/org-chart/hooks/orgRoles';
import { ROLE_LABELS } from '../../components/org-chart/types';

describe('Human Resources Department Team Roles Architecture (HR Manager & Team)', () => {
    describe('Role Definitions & System Styling', () => {
        it('registers payroll_specialist and talent_recruiter in SYSTEM_ROLES', () => {
            const payroll = SYSTEM_ROLES.find(r => r.id === 'payroll_specialist');
            const recruiter = SYSTEM_ROLES.find(r => r.id === 'talent_recruiter');
            const trainer = SYSTEM_ROLES.find(r => r.id === 'training_coordinator');

            expect(payroll).toBeDefined();
            expect(payroll?.level).toBe(4);
            expect(payroll?.label).toBe('Payroll Specialist');

            expect(recruiter).toBeDefined();
            expect(recruiter?.level).toBe(4);
            expect(recruiter?.label).toBe('Talent Recruiter');

            expect(trainer).toBeDefined();
            expect(trainer?.level).toBe(4);
        });

        it('defines labels in org chart ROLE_LABELS', () => {
            expect(ROLE_LABELS.payroll_specialist).toBe('Payroll Specialist');
            expect(ROLE_LABELS.talent_recruiter).toBe('Talent Recruiter');
            expect(ROLE_LABELS.training_coordinator).toBe('Training Coord.');
        });
    });

    describe('Workplace Location & Role Segregation (Administration HQ)', () => {
        it('pins all HR team roles strictly to Administration facilities', () => {
            expect(getRequiredSiteType('hr_manager')).toBe('Administration');
            expect(getRequiredSiteType('payroll_specialist')).toBe('Administration');
            expect(getRequiredSiteType('talent_recruiter')).toBe('Administration');
            expect(getRequiredSiteType('training_coordinator')).toBe('Administration');

            expect(canRoleBeAtSiteType('payroll_specialist', 'Administration')).toBe(true);
            expect(canRoleBeAtSiteType('payroll_specialist', 'Store')).toBe(false);
            expect(canRoleBeAtSiteType('payroll_specialist', 'Warehouse')).toBe(false);

            expect(canRoleBeAtSiteType('talent_recruiter', 'Administration')).toBe(true);
            expect(canRoleBeAtSiteType('talent_recruiter', 'Store')).toBe(false);
            expect(canRoleBeAtSiteType('talent_recruiter', 'Warehouse')).toBe(false);
        });

        it('assigns HR team roles to the Human Resources department', () => {
            expect(getRecommendedDepartment('hr_manager')).toBe('Human Resources');
            expect(getRecommendedDepartment('payroll_specialist')).toBe('Human Resources');
            expect(getRecommendedDepartment('talent_recruiter')).toBe('Human Resources');
            expect(getRecommendedDepartment('training_coordinator')).toBe('Human Resources');
        });
    });

    describe('Hierarchy & Supervisory Reporting Lines', () => {
        it('places HR Manager above all HR team roles in hierarchy rank', () => {
            const hrMgrRank = getRoleHierarchy('hr_manager');
            const payrollRank = getRoleHierarchy('payroll_specialist');
            const recruiterRank = getRoleHierarchy('talent_recruiter');
            const trainerRank = getRoleHierarchy('training_coordinator');

            expect(hrMgrRank).toBe(85);
            expect(payrollRank).toBeLessThan(hrMgrRank);
            expect(recruiterRank).toBeLessThan(hrMgrRank);
            expect(trainerRank).toBeLessThan(hrMgrRank);

            // HR Manager can employ and onboard team roles
            expect(canEmployRole('hr_manager', 'payroll_specialist')).toBe(true);
            expect(canEmployRole('hr_manager', 'talent_recruiter')).toBe(true);
            expect(canEmployRole('hr_manager', 'training_coordinator')).toBe(true);

            // Staff cannot employ their superiors
            expect(canEmployRole('payroll_specialist', 'hr_manager')).toBe(false);
            expect(canEmployRole('talent_recruiter', 'hr_manager')).toBe(false);
        });

        it('resolves org chart department and rank to hr', () => {
            expect(getRoleDept('hr_manager')).toBe('hr');
            expect(getRoleDept('payroll_specialist')).toBe('hr');
            expect(getRoleDept('talent_recruiter')).toBe('hr');
            expect(getRoleDept('training_coordinator')).toBe('hr');

            expect(getRoleLevel('payroll_specialist')).toBe(4);
            expect(getRoleLevel('talent_recruiter')).toBe(4);
            expect(getRoleRank('hr_manager')).toBe(21);
            expect(getRoleRank('payroll_specialist')).toBe(53);
            expect(getRoleRank('talent_recruiter')).toBe(55);
        });
    });

    describe('RBAC Route & Granular Permission Matrix Governance', () => {
        it('grants payroll_specialist access to employees and financials with salary views', () => {
            expect(canAccessRoute('payroll_specialist', '/employees')).toBe(true);
            expect(canAccessRoute('payroll_specialist', '/finance')).toBe(true);
            expect(canAccessRoute('payroll_specialist', '/pos')).toBe(false);
            expect(canAccessRoute('payroll_specialist', '/wms-ops')).toBe(false);

            expect(canAccessModule('payroll_specialist', 'employees')).toBe(true);
            expect(canAccessModule('payroll_specialist', 'finance')).toBe(true);
            expect(hasPermission('payroll_specialist', 'VIEW_SALARY')).toBe(true);
            expect(hasPermission('payroll_specialist', 'VIEW_PAYROLL')).toBe(true);

            // Separation of Duties: payroll_specialist cannot unilaterally approve salary changes
            expect(hasPermission('payroll_specialist', 'APPROVE_SALARY')).toBe(false);
            expect(ACTION_PERMISSIONS.payroll_specialist).toContain('employees.view_salary');
            expect(ACTION_PERMISSIONS.payroll_specialist).not.toContain('employees.approve_salary');
        });

        it('grants talent_recruiter access to directory and candidate onboarding without salary visibility', () => {
            expect(canAccessRoute('talent_recruiter', '/employees')).toBe(true);
            expect(canAccessRoute('talent_recruiter', '/finance')).toBe(false);
            expect(canAccessRoute('talent_recruiter', '/pos')).toBe(false);

            expect(canAccessModule('talent_recruiter', 'employees')).toBe(true);
            expect(canAccessModule('talent_recruiter', 'finance')).toBe(false);
            expect(hasPermission('talent_recruiter', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('talent_recruiter', 'VIEW_SALARY')).toBe(false);
            expect(hasPermission('talent_recruiter', 'APPROVE_SALARY')).toBe(false);

            expect(ACTION_PERMISSIONS.talent_recruiter).toContain('employees.create');
            expect(ACTION_PERMISSIONS.talent_recruiter).not.toContain('employees.view_salary');
        });

        it('ensures training_coordinator has employee and attendance access', () => {
            expect(canAccessRoute('training_coordinator', '/employees')).toBe(true);
            expect(canAccessModule('training_coordinator', 'employees')).toBe(true);
            expect(ACTION_PERMISSIONS.training_coordinator).toContain('employees.manage_attendance');
        });
    });
});
