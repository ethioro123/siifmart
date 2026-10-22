import { describe, it, expect } from 'vitest';
import {
    validatePasswordAgainstPolicy,
    checkTimeRestriction,
    checkIpRestriction,
    checkMfaRequirement,
    checkDynamicRolePermission,
    setActiveRolePolicies,
    setActiveRolePermissions,
    DEFAULT_ROLE_POLICIES
} from '../../services/zeroTrustPolicies.service';

describe('zeroTrustPolicies.service runtime enforcement', () => {
    describe('validatePasswordAgainstPolicy', () => {
        it('enforces high complexity: >= 12 chars with upper, lower, number, special char', () => {
            expect(validatePasswordAgainstPolicy('short', 'high').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('alllowercase123!', 'high').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('ALLUPPERCASE123!', 'high').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('NoSpecialChar123', 'high').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('NoNumberHere!@#A', 'high').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('SiifMart@2026', 'high').valid).toBe(true);
        });

        it('enforces medium complexity: >= 8 chars with letters and numbers', () => {
            expect(validatePasswordAgainstPolicy('1234567', 'medium').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('onlyletters', 'medium').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('12345678', 'medium').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('SiifMart1', 'medium').valid).toBe(true);
        });

        it('enforces low complexity: >= 6 chars', () => {
            expect(validatePasswordAgainstPolicy('12345', 'low').valid).toBe(false);
            expect(validatePasswordAgainstPolicy('123456', 'low').valid).toBe(true);
        });
    });

    describe('checkTimeRestriction', () => {
        it('always allows CEO and super_admin regardless of time', () => {
            expect(checkTimeRestriction('group_ceo').allowed).toBe(true);
            expect(checkTimeRestriction('group_ceo').allowed).toBe(true);
        });

        it('evaluates frontline role based on policy time_restriction flag', () => {
            setActiveRolePolicies({
                cashier: { ...DEFAULT_ROLE_POLICIES.cashier, time_restriction: false }
            });
            expect(checkTimeRestriction('cashier').allowed).toBe(true);
        });
    });

    describe('checkIpRestriction', () => {
        it('permits localhost, internal networks, and corporate domains', () => {
            setActiveRolePolicies({
                cashier: { ...DEFAULT_ROLE_POLICIES.cashier, ip_restriction: true }
            });
            expect(checkIpRestriction('cashier', 'localhost').allowed).toBe(true);
            expect(checkIpRestriction('cashier', '127.0.0.1').allowed).toBe(true);
            expect(checkIpRestriction('cashier', '192.168.1.50').allowed).toBe(true);
            expect(checkIpRestriction('cashier', 'pos-01.addis.internal').allowed).toBe(true);
            expect(checkIpRestriction('cashier', 'terminal.siifmart.com').allowed).toBe(true);
        });

        it('rejects untrusted external hosts when ip_restriction is enabled', () => {
            setActiveRolePolicies({
                cashier: { ...DEFAULT_ROLE_POLICIES.cashier, ip_restriction: true }
            });
            const result = checkIpRestriction('cashier', 'untrusted-public-ip.com');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Zero-Trust Network Guard');
        });

        it('allows unrestricted roles or roles with ip_restriction disabled', () => {
            setActiveRolePolicies({
                admin: { ...DEFAULT_ROLE_POLICIES.admin, ip_restriction: false }
            });
            expect(checkIpRestriction('country_managing_director', 'external-wifi.org').allowed).toBe(true);
        });
    });

    describe('checkMfaRequirement', () => {
        it('verifies MFA satisfaction for privileged roles', () => {
            setActiveRolePolicies({
                admin: { ...DEFAULT_ROLE_POLICIES.admin, mfa_required: true }
            });

            // Without MFA (factor enrolled: nextLevel === 'aal2', currentLevel === 'aal1')
            const unverified = checkMfaRequirement('country_managing_director', 'aal1', 'aal2');
            expect(unverified.required).toBe(true);
            expect(unverified.satisfied).toBe(false);

            // With AAL2 MFA
            const verifiedAal2 = checkMfaRequirement('country_managing_director', 'aal2', 'aal2');
            expect(verifiedAal2.required).toBe(true);
            expect(verifiedAal2.satisfied).toBe(true);

            // An enrolled factor or user-editable metadata alone is not an AAL2 session.
            const enrolledOnly = checkMfaRequirement('country_managing_director', undefined);
            expect(enrolledOnly.required).toBe(true);
            expect(enrolledOnly.satisfied).toBe(false);

            // When no verified MFA factor is enrolled on the account (nextLevel === 'aal1'), do not emit a false session warning.
            const noFactorEnrolled = checkMfaRequirement('country_managing_director', 'aal1', 'aal1');
            expect(noFactorEnrolled.required).toBe(false);
            expect(noFactorEnrolled.satisfied).toBe(true);

            // Store managers do not require MFA by default
            setActiveRolePolicies(null);
            const storeManagerCheck = checkMfaRequirement('store_manager', 'aal1');
            expect(storeManagerCheck.required).toBe(false);
            expect(storeManagerCheck.satisfied).toBe(true);
        });
    });

    describe('checkDynamicRolePermission', () => {
        it('sovereign CEO and super_admin bypass dynamic permission restrictions', () => {
            expect(checkDynamicRolePermission('group_ceo', 'pos.void')).toBe(true);
            expect(checkDynamicRolePermission('group_ceo', 'inventory.adjust')).toBe(true);
        });

        it('respects explicitly toggled dynamic role permissions', () => {
            setActiveRolePermissions({
                pos: [
                    { id: 'void_bill', admin: true, store_manager: true, cashier: false, warehouse: false }
                ]
            });

            expect(checkDynamicRolePermission('cashier', 'pos.void')).toBe(false);
            expect(checkDynamicRolePermission('store_manager', 'pos.void')).toBe(true);
        });
    });
});
