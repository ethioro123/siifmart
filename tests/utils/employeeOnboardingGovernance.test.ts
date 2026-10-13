import { describe, it, expect } from 'vitest';
import {
    isDirectOnboardingAuthorized,
    getOnboardingSubmitLabel,
    getOnboardingModalTitle,
    DIRECT_ONBOARDING_ROLES
} from '../../utils/employeeOnboardingGovernance';
import { canEmployRole } from '../../utils/roles';

describe('Employee Onboarding Governance & 4-Eyes Maker-Checker Rules', () => {
    describe('1. Direct Onboarding Authority Check', () => {
        it('authorizes only executive admins and HR leadership for direct activation', () => {
            const authorizedRoles = ['super_admin', 'CEO', 'ceo', 'admin', 'hr', 'hr_manager'];
            for (const role of authorizedRoles) {
                expect(isDirectOnboardingAuthorized(role)).toBe(true);
            }
        });

        it('strictly forbids site and facility managers from direct onboarding', () => {
            const siteManagerRoles = [
                'warehouse_manager',
                'store_manager',
                'dispatch_manager',
                'assistant_manager',
                'shift_lead',
                'store_supervisor',
                'logistics_manager',
                'inventory_manager',
                'operations_manager',
                'fleet_maintenance_supervisor'
            ];

            for (const role of siteManagerRoles) {
                expect(isDirectOnboardingAuthorized(role)).toBe(false);
            }
        });

        it('strictly forbids floor staff from direct onboarding', () => {
            const staffRoles = ['cashier', 'picker', 'packer', 'receiver', 'driver', 'stock_clerk'];
            for (const role of staffRoles) {
                expect(isDirectOnboardingAuthorized(role)).toBe(false);
            }
        });

        it('returns false for missing or null roles', () => {
            expect(isDirectOnboardingAuthorized(null)).toBe(false);
            expect(isDirectOnboardingAuthorized(undefined)).toBe(false);
            expect(isDirectOnboardingAuthorized('')).toBe(false);
        });
    });

    describe('2. Submit Action Label Adaptation', () => {
        it('renders direct onboarding labels for HR and Executive roles', () => {
            expect(getOnboardingSubmitLabel('hr', false)).toBe('Confirm & Onboard Talent');
            expect(getOnboardingSubmitLabel('hr', true)).toBe('Creating Employee...');
            expect(getOnboardingSubmitLabel('super_admin', false)).toBe('Confirm & Onboard Talent');
            expect(getOnboardingSubmitLabel('super_admin', true)).toBe('Creating Employee...');
            expect(getOnboardingSubmitLabel('CEO', false)).toBe('Confirm & Onboard Talent');
        });

        it('renders draft and HR submission labels for warehouse and store managers', () => {
            expect(getOnboardingSubmitLabel('warehouse_manager', false)).toBe('Submit to HR for Approval');
            expect(getOnboardingSubmitLabel('warehouse_manager', true)).toBe('Submitting to HR...');
            expect(getOnboardingSubmitLabel('store_manager', false)).toBe('Submit to HR for Approval');
            expect(getOnboardingSubmitLabel('store_manager', true)).toBe('Submitting to HR...');
            expect(getOnboardingSubmitLabel('assistant_manager', false)).toBe('Submit to HR for Approval');
        });
    });

    describe('3. Modal Header Title Adaptation', () => {
        it('renders standard title for HR and Executive roles', () => {
            expect(getOnboardingModalTitle('hr')).toBe('Onboard Talent');
            expect(getOnboardingModalTitle('super_admin')).toBe('Onboard Talent');
        });

        it('renders draft proposal title for site managers', () => {
            expect(getOnboardingModalTitle('warehouse_manager')).toBe('Draft Candidate (HR Approval)');
            expect(getOnboardingModalTitle('store_manager')).toBe('Draft Candidate (HR Approval)');
        });
    });

    describe('4. Dual-Control Supervisory Sign-Off & Authorization (SOP-HR-003)', () => {
        it('authorizes HR Manager to approve warehouse and store candidate drafts', () => {
            const hrRoles = ['hr_manager', 'hr', 'super_admin', 'CEO'];
            const candidateRoles = ['picker', 'packer', 'receiver', 'cashier', 'driver', 'stock_clerk'];

            for (const hrRole of hrRoles) {
                for (const candidateRole of candidateRoles) {
                    expect(canEmployRole(hrRole, candidateRole)).toBe(true);
                }
            }
        });

        it('strictly blocks frontline floor staff from approving candidates', () => {
            const floorRoles = ['picker', 'cashier', 'driver', 'receiver'];
            for (const floorRole of floorRoles) {
                expect(canEmployRole(floorRole, 'picker')).toBe(false);
            }
        });

        it('strictly blocks self-approval or peer manager approval across same hierarchy tier', () => {
            expect(canEmployRole('warehouse_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('hr_manager', 'hr_manager')).toBe(false);
        });
    });
});

