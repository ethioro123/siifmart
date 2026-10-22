import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, PERMISSIONS } from '../../utils/permissions';
import type { UserRole } from '../../types';

describe('POS Staff Inventory Access Strict Isolation (WMS Sovereignty)', () => {
    // List of all POS frontline and store supervisory roles
    const posStaffRoles: UserRole[] = ['cashier', 'sales_associate', 'shift_supervisor', 'assistant_store_manager', 'store_manager'];

    it('strictly forbids all POS staff roles from accessing the inventory module', () => {
        posStaffRoles.forEach(role => {
            const hasModuleAccess = canAccessModule(role, 'inventory');
            expect(hasModuleAccess, `Role "${role}" should NOT be permitted to access inventory module`).toBe(false);
        });
    });

    it('ensures no POS staff role is listed in PERMISSIONS.ACCESS_INVENTORY', () => {
        posStaffRoles.forEach(role => {
            const isListed = (PERMISSIONS.ACCESS_INVENTORY as readonly string[]).includes(role);
            expect(isListed, `Role "${role}" must NOT be in PERMISSIONS.ACCESS_INVENTORY`).toBe(false);
        });
    });

    it('ensures no POS staff role has granular inventory permissions (view, count, adjust, transfer, create, edit, delete)', () => {
        const inventoryActions = [
            'inventory.view',
            'inventory.count',
            'inventory.adjust',
            'inventory.transfer',
            'inventory.create',
            'inventory.edit',
            'inventory.delete'
        ] as const;

        posStaffRoles.forEach(role => {
            inventoryActions.forEach(action => {
                const hasAction = authService.checkPermission(role, action);
                expect(hasAction, `Role "${role}" must NOT have permission "${action}"`).toBe(false);
            });
        });
    });
});
