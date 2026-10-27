import { describe, it, expect } from 'vitest';
import { canAccessRoute, ROLE_PERMISSIONS } from '../../services/auth.rbac';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { authService } from '../../services/auth.service';

describe('Merchandising Approvers Access & Navigation Governance', () => {
    describe('1. Regional Supply Chain Manager Access', () => {
        const role = 'regional_supply_chain_manager';

        it('has permission to access pricing & merchandising module', () => {
            expect(canAccessModule(role, 'pricing')).toBe(true);
            expect(hasPermission(role, 'ACCESS_PRICING')).toBe(true);
            expect(authService.checkPermission(role, 'pricing.view')).toBe(true);
        });

        it('has route permissions to navigate to /pricing', () => {
            expect(canAccessRoute(role, '/pricing')).toBe(true);
            expect(ROLE_PERMISSIONS[role]).toContain('pricing');
        });
    });

    describe('2. Regional Finance Manager Access', () => {
        const role = 'regional_finance_manager';

        it('has permission to access pricing & merchandising module', () => {
            expect(canAccessModule(role, 'pricing')).toBe(true);
            expect(hasPermission(role, 'ACCESS_PRICING')).toBe(true);
            expect(authService.checkPermission(role, 'pricing.view')).toBe(true);
        });

        it('has route permissions to navigate to /pricing', () => {
            expect(canAccessRoute(role, '/pricing')).toBe(true);
            expect(ROLE_PERMISSIONS[role]).toContain('pricing');
        });
    });
});
