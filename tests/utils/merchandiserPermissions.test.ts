import { describe, it, expect } from 'vitest';
import { canAccessRoute } from '../../services/auth.rbac';
import { hasPermission } from '../../services/permissions.service';

describe('Merchandiser Role Permissions & SOP-MER-037 Governance', () => {
    it('grants floor merchandiser access to the pricing route', () => {
        expect(canAccessRoute('merchandiser', '/pricing')).toBe(true);
    });

    it('grants floor merchandiser view and audit permissions', () => {
        expect(hasPermission('merchandiser', 'dashboard.view')).toBe(true);
        expect(hasPermission('merchandiser', 'inventory.view')).toBe(true);
        expect(hasPermission('merchandiser', 'inventory.count')).toBe(true);
        expect(hasPermission('merchandiser', 'pricing.view')).toBe(true);
    });

    it('grants promo proposal capability but enforces zero-trust direct price edit lockout', () => {
        expect(hasPermission('merchandiser', 'pricing.create_promo')).toBe(true);
        // Floor merchandiser must NEVER have direct price edit authority (Rule: Zero-Trust Pricing SOP-MER-037)
        expect(hasPermission('merchandiser', 'pricing.edit')).toBe(false);
        expect(hasPermission('merchandiser', 'pricing.approve_promo')).toBe(false);
    });
});
