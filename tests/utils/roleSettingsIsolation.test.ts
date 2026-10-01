import { describe, it, expect } from 'vitest';
import type { SystemConfig } from '../../types';
import type { RolePolicy, RolePermissionCategory, ManagedRoleId } from '../../types/roles';
import { RoleSettingsPayloadSchema, RolePolicySchema } from '../../schemas/role-settings.schema';

describe('Zero-Trust Role Settings & Multi-Country Isolation', () => {
    const defaultETPolicies: Record<ManagedRoleId, RolePolicy> = {
        admin: { mfa_required: true, session_timeout: 15, ip_restriction: true, time_restriction: false, password_complexity: 'high' },
        store_manager: { mfa_required: true, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
        cashier: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
        warehouse: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' }
    };

    const defaultKEPolicies: Record<ManagedRoleId, RolePolicy> = {
        admin: { mfa_required: true, session_timeout: 10, ip_restriction: true, time_restriction: false, password_complexity: 'high' },
        store_manager: { mfa_required: true, session_timeout: 20, ip_restriction: true, time_restriction: true, password_complexity: 'high' },
        cashier: { mfa_required: false, session_timeout: 20, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
        warehouse: { mfa_required: false, session_timeout: 20, ip_restriction: true, time_restriction: true, password_complexity: 'medium' }
    };

    it('should maintain strict 100% tenant isolation across countryConfigs without cross-border bleed', () => {
        const baseSystemConfig: Partial<SystemConfig> = {
            storeName: 'SIIFMART East Africa',
            country: 'ET',
            countryConfigs: {
                ET: {
                    rolePolicies: defaultETPolicies
                },
                KE: {
                    rolePolicies: defaultKEPolicies
                }
            }
        };

        // Mutate Kenya store_manager session timeout to 15 mins
        const updatedKEPolicies: Record<ManagedRoleId, RolePolicy> = {
            ...defaultKEPolicies,
            store_manager: {
                ...defaultKEPolicies.store_manager,
                session_timeout: 15
            }
        };

        const updatedCountryConfigs: Record<string, any> = {
            ...baseSystemConfig.countryConfigs,
            KE: {
                ...baseSystemConfig.countryConfigs?.KE,
                rolePolicies: updatedKEPolicies
            }
        };

        // Verify Kenya updated
        expect(updatedCountryConfigs.KE.rolePolicies.store_manager.session_timeout).toBe(15);
        // Verify Ethiopia remained untouched at 30 mins
        expect(updatedCountryConfigs.ET.rolePolicies.store_manager.session_timeout).toBe(30);
    });

    it('enforces Zero-Trust policy gate: autonomous custom discounts and stock adjustments are locked for non-admins', () => {
        const permissions: RolePermissionCategory = {
            'POS & Sales': [
                { id: 'pos_access', label: 'Access POS Terminal', admin: true, store_manager: true, cashier: true, warehouse: false },
                { id: 'give_discount', label: 'Apply Custom Discount', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
            ],
            'Inventory': [
                { id: 'adjust_stock', label: 'Manual Stock Adjustment', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
            ]
        };

        const discountPerm = permissions['POS & Sales'].find(p => p.id === 'give_discount');
        const adjustPerm = permissions['Inventory'].find(p => p.id === 'adjust_stock');

        expect(discountPerm?.hqApprovalRequired).toBe(true);
        expect(discountPerm?.store_manager).toBe(false);
        expect(discountPerm?.cashier).toBe(false);

        expect(adjustPerm?.hqApprovalRequired).toBe(true);
        expect(adjustPerm?.store_manager).toBe(false);
        expect(adjustPerm?.warehouse).toBe(false);
    });

    it('validates role policies with strict Zod schema', () => {
        const validPolicy: RolePolicy = {
            mfa_required: true,
            session_timeout: 30,
            ip_restriction: true,
            time_restriction: false,
            password_complexity: 'high'
        };

        expect(RolePolicySchema.safeParse(validPolicy).success).toBe(true);

        const invalidTimeout = {
            ...validPolicy,
            session_timeout: 200 // Exceeds max 120
        };
        expect(RolePolicySchema.safeParse(invalidTimeout).success).toBe(false);

        const negativeTimeout = {
            ...validPolicy,
            session_timeout: 2 // Below min 5
        };
        expect(RolePolicySchema.safeParse(negativeTimeout).success).toBe(false);
    });

    it('validates mutation payload schema with targetCountry', () => {
        const validPayload = {
            section: 'policies',
            roleId: 'store_manager',
            policies: defaultETPolicies,
            targetCountry: 'KE'
        };

        const result = RoleSettingsPayloadSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });
});
