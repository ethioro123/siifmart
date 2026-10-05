import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, canViewAllSites, canViewAllEmployees, canSwitchCountry } from '../../utils/permissions';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';

describe('Store Manager Role & Retail Governance Engine (SOP-MGT-026)', () => {
    describe('Module & Single-Site Access Controls', () => {
        it('allows store_manager to access retail operations modules', () => {
            expect(canAccessModule('store_manager', 'pos')).toBe(true);
            expect(canAccessModule('store_manager', 'sales')).toBe(true);
            expect(canAccessModule('store_manager', 'customers')).toBe(true);
            expect(canAccessModule('store_manager', 'inventory')).toBe(true);
            expect(canAccessModule('store_manager', 'employees')).toBe(true);
        });

        it('strictly blocks store_manager from administrative, central pricing, and finance modules', () => {
            expect(canAccessModule('store_manager', 'admin')).toBe(false);
            expect(canAccessModule('store_manager', 'pricing')).toBe(false);
            expect(canAccessModule('store_manager', 'finance')).toBe(false);
            expect(canAccessModule('store_manager', 'settings')).toBe(false);
            expect(canAccessModule('store_manager', 'warehouse')).toBe(false);
        });

        it('enforces single-site and invisible tenancy isolation (Zero-Trust)', () => {
            expect(canViewAllSites('store_manager')).toBe(false);
            expect(canViewAllEmployees('store_manager')).toBe(false);
            expect(canViewCostPrice('store_manager')).toBe(false);
            expect(canSwitchCountry({ role: 'store_manager' })).toBe(false);
        });
    });

    describe('POS Supervisory & Cash Reconciliation Permissions', () => {
        it('grants full supervisory POS control within assigned store', () => {
            expect(authService.checkPermission('store_manager', 'pos.view')).toBe(true);
            expect(authService.checkPermission('store_manager', 'pos.create_sale')).toBe(true);
            expect(authService.checkPermission('store_manager', 'pos.refund')).toBe(true);
            expect(authService.checkPermission('store_manager', 'pos.void_sale')).toBe(true);
            expect(authService.checkPermission('store_manager', 'pos.hold_order')).toBe(true);
        });

        it('blocks unilateral inventory adjustments and retail price tampering (Zero Autonomous Authority)', () => {
            expect(authService.checkPermission('store_manager', 'inventory.adjust')).toBe(false);
            expect(authService.checkPermission('store_manager', 'inventory.transfer')).toBe(false);
            expect(authService.checkPermission('store_manager', 'pricing.edit')).toBe(false);
            expect(authService.checkPermission('store_manager', 'pricing.approve_promo')).toBe(false);
        });
    });

    describe('Frontline Store Hiring Authority (canEmployRole)', () => {
        it('authorizes store_manager to hire store subordinates strictly below Rank 80', () => {
            expect(canEmployRole('store_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('store_manager', 'shift_lead')).toBe(true);
            expect(canEmployRole('store_manager', 'cashier')).toBe(true);
            expect(canEmployRole('store_manager', 'sales_associate')).toBe(true);
            expect(canEmployRole('store_manager', 'stock_clerk')).toBe(true);
        });

        it('blocks store_manager from hiring peer site managers or superiors', () => {
            expect(canEmployRole('store_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('store_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'store_manager')).toBe(false);
        });
    });
});
