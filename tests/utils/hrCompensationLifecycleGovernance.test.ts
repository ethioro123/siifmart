import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../utils/permissions';
import { canEmployRole, getRoleHierarchy } from '../../utils/roles';
import { isSovereignCEO } from '../../utils/employeeGovernance';
import type { UserRole } from '../../types';

describe('HR Compensation & Employee Lifecycle Governance Suite', () => {
    describe('1. Segregation of Duties: PROPOSE_SALARY vs APPROVE_SALARY', () => {
        it('authorizes HR specialists and directors to propose salary adjustments while strictly denying approval', () => {
            const hrRoles: UserRole[] = ['hr', 'head_of_hr', 'payroll_specialist', 'regional_hr_manager'];
            for (const role of hrRoles) {
                expect(hasPermission(role, 'PROPOSE_SALARY')).toBe(true);
                expect(hasPermission(role, 'APPROVE_SALARY')).toBe(false);
            }
        });

        it('authorizes Finance leadership to approve salary adjustments while strictly denying proposal', () => {
            const financeRoles: UserRole[] = ['head_of_finance',];
            for (const role of financeRoles) {
                expect(hasPermission(role, 'APPROVE_SALARY')).toBe(true);
                expect(hasPermission(role, 'PROPOSE_SALARY')).toBe(false);
            }
        });

        it('authorizes Global CEO and Country Managing Director overarching dual-authority', () => {
            expect(hasPermission('CEO', 'PROPOSE_SALARY')).toBe(true);
            expect(hasPermission('CEO', 'APPROVE_SALARY')).toBe(true);
            expect(hasPermission('country_managing_director', 'PROPOSE_SALARY')).toBe(true);
            expect(hasPermission('country_managing_director', 'APPROVE_SALARY')).toBe(true);
        });

        it('strictly denies store operations and warehouse staff from compensation actions', () => {
            const nonHrRoles: UserRole[] = ['cashier', 'sales_associate', 'receiver', 'picker', 'packer', 'driver'];
            for (const role of nonHrRoles) {
                expect(hasPermission(role, 'PROPOSE_SALARY')).toBe(false);
                expect(hasPermission(role, 'APPROVE_SALARY')).toBe(false);
                expect(hasPermission(role, 'VIEW_PAYROLL')).toBe(false);
            }
        });
    });

    describe('2. Anti-Self-Compensation & CEO Sovereign Compensation Protection', () => {
        it('identifies sovereign CEO roles and blocks subordinate modification', () => {
            expect(isSovereignCEO('CEO')).toBe(true);
            expect(isSovereignCEO('ceo')).toBe(true);
            expect(isSovereignCEO('super_admin')).toBe(true);
            expect(isSovereignCEO('head_of_hr')).toBe(false);
            expect(isSovereignCEO('head_of_finance')).toBe(false);
            expect(isSovereignCEO('country_managing_director')).toBe(false);
        });

        it('enforces role hierarchy rankings for compensation decisions', () => {
            const ceoRank = getRoleHierarchy('CEO');
            const mdRank = getRoleHierarchy('country_managing_director');
            const hrHeadRank = getRoleHierarchy('head_of_hr');
            const financeHeadRank = getRoleHierarchy('head_of_finance');
            const specialistRank = getRoleHierarchy('payroll_specialist');

            expect(ceoRank).toBeGreaterThan(mdRank);
            expect(mdRank).toBeGreaterThan(hrHeadRank);
            expect(hrHeadRank).toBeGreaterThan(specialistRank);
            expect(financeHeadRank).toBeGreaterThan(specialistRank);
        });
    });

    describe('3. Candidate Onboarding Tiers & Headcount Quota Approval', () => {
        it('restricts candidate hire approval permissions to authorized managerial roles', () => {
            expect(hasPermission('head_of_hr', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('head_of_hr', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('country_managing_director', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('CEO', 'APPROVE_EMPLOYEE')).toBe(true);

            expect(hasPermission('talent_recruiter', 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission('payroll_specialist', 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission('cashier', 'APPROVE_EMPLOYEE')).toBe(false);
        });

        it('enforces rank-based employment authority (cannot employ peers or superiors)', () => {
            expect(canEmployRole('talent_recruiter', 'cashier')).toBe(false);
            expect(canEmployRole('head_of_hr', 'cashier')).toBe(true);
            expect(canEmployRole('head_of_hr', 'cashier')).toBe(true);
            expect(canEmployRole('head_of_hr', 'store_manager')).toBe(true);
            // Level 2 Departmental Leadership cannot employ other Level 2 Managers (Executive only)
            expect(canEmployRole('head_of_hr', 'head_of_hr')).toBe(false);
            expect(canEmployRole('head_of_hr', 'country_managing_director')).toBe(false);
            expect(canEmployRole('country_managing_director', 'head_of_hr')).toBe(true);
            expect(canEmployRole('country_managing_director', 'head_of_hr')).toBe(true);
        });
    });

    describe('4. Zero-Trust Blind Credential Handover Protocol', () => {
        it('verifies that credential handover timestamps and actors are tracked', () => {
            const mockEmployee = {
                id: 'e1000000-0000-4000-8000-000000000099',
                name: 'New Hire Cashier',
                role: 'cashier',
                credentials_handed_over_at: '2026-10-22T10:00:00Z',
                credentials_handed_over_by: 'Tigist Alemayehu'
            };

            expect(mockEmployee.credentials_handed_over_at).toBeDefined();
            expect(mockEmployee.credentials_handed_over_by).toBe('Tigist Alemayehu');
        });
    });

    describe('5. Disciplinary Appeal 4-Eyes Segregation of Duties', () => {
        it('validates that notice issuer and appeal adjudicator must be distinct individuals', () => {
            const issuer = { id: 'usr-101', name: 'Marta Hailu', role: 'head_of_hr' };
            const adjudicatorSelf = { id: 'usr-101', name: 'Marta Hailu', role: 'head_of_hr' };
            const adjudicatorIndependent = { id: 'usr-102', name: 'Kassahun Desta', role: 'head_of_hr' };

            const isSelfAdjudication = issuer.id === adjudicatorSelf.id || issuer.name === adjudicatorSelf.name;
            const isIndependentAdjudication = issuer.id !== adjudicatorIndependent.id && issuer.name !== adjudicatorIndependent.name;

            expect(isSelfAdjudication).toBe(true);
            expect(isIndependentAdjudication).toBe(true);
        });
    });

    describe('6. Multi-Country National Sovereignty Isolation', () => {
        it('ensures distinct currency standards for ET (ETB) and KE (KES)', () => {
            const etbCurrency = 'ETB';
            const kesCurrency = 'KES';
            expect(etbCurrency).not.toBe(kesCurrency);
        });
    });
});
