import { describe, it, expect, vi } from 'vitest';
import { validateRoleSiteAssignment, autoSelectSiteForRole, canRoleBeAtSiteType, getRequiredSiteType } from '../../utils/roleSegregation';
import { employeesService } from '../../services/employees.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('Employee Mandatory Workplace Location & Segregation Rules', () => {
    const mockSites = [
        { id: 'site-hq-1', name: 'SIIFMART Headquarters', type: 'Administration' },
        { id: 'site-store-1', name: 'Merkato Retail Store', type: 'Store' },
        { id: 'site-wh-1', name: 'Kality Central Warehouse', type: 'Warehouse' }
    ];

    describe('Service-Level Mandatory Location Enforcement', () => {
        it('throws an error if siteId is omitted or undefined', async () => {
            await expect(employeesService.create({
                id: 'emp-101',
                code: 'SIIF-0101',
                siteId: '',
                name: 'Test Candidate',
                role: 'cashier',
                email: 'test@siifmart.com',
                phone: '+251911000000',
                status: 'Active',
                joinDate: '2026-09-30',
                department: 'Retail Operations',
                avatar: '',
                performanceScore: 100,
                attendanceRate: 100
            })).rejects.toThrow('Workplace location is mandatory');
        });

        it('throws an error if siteId is whitespace only', async () => {
            await expect(employeesService.create({
                id: 'emp-102',
                code: 'SIIF-0102',
                siteId: '   ',
                name: 'Test Candidate',
                role: 'cashier',
                email: 'test@siifmart.com',
                phone: '+251911000000',
                status: 'Active',
                joinDate: '2026-09-30',
                department: 'Retail Operations',
                avatar: '',
                performanceScore: 100,
                attendanceRate: 100
            })).rejects.toThrow('Workplace location is mandatory');
        });
    });

    describe('Workplace Location Role Segregation & Compatibility', () => {
        it('requires retail store roles to be deployed to Store facilities', () => {
            expect(getRequiredSiteType('cashier')).toBe('Store');
            expect(getRequiredSiteType('sales_associate')).toBe('Store');
            expect(getRequiredSiteType('store_manager')).toBe('Store');

            expect(canRoleBeAtSiteType('cashier', 'Store')).toBe(true);
            expect(canRoleBeAtSiteType('cashier', 'Retail Store')).toBe(true);
            expect(canRoleBeAtSiteType('cashier', 'Administration')).toBe(false);
            expect(canRoleBeAtSiteType('cashier', 'Warehouse')).toBe(false);

            const invalidStoreAssignment = validateRoleSiteAssignment('cashier', 'Administration');
            expect(invalidStoreAssignment).toContain('must be assigned to a Store location');

            const validStoreAssignment = validateRoleSiteAssignment('cashier', 'Store');
            expect(validStoreAssignment).toBeNull();
        });

        it('requires warehouse logistics roles to be deployed to Warehouse facilities', () => {
            expect(getRequiredSiteType('picker')).toBe('Warehouse');
            expect(getRequiredSiteType('packer')).toBe('Warehouse');
            expect(getRequiredSiteType('forklift_operator')).toBe('Warehouse');
            expect(getRequiredSiteType('warehouse_manager')).toBe('Warehouse');

            expect(canRoleBeAtSiteType('picker', 'Warehouse')).toBe(true);
            expect(canRoleBeAtSiteType('picker', 'Store')).toBe(false);
            expect(canRoleBeAtSiteType('picker', 'Administration')).toBe(false);

            const invalidWarehouseAssignment = validateRoleSiteAssignment('picker', 'Store');
            expect(invalidWarehouseAssignment).toContain('must be assigned to a Warehouse location');
        });

        it('requires executive and director roles to be deployed to Administration facilities', () => {
            expect(getRequiredSiteType('super_admin')).toBe('Administration');
            expect(getRequiredSiteType('head_of_hr')).toBe('Administration');
            expect(getRequiredSiteType('payroll_specialist')).toBe('Administration');
            expect(getRequiredSiteType('talent_recruiter')).toBe('Administration');
            expect(getRequiredSiteType('head_of_finance')).toBe('Administration');
            expect(getRequiredSiteType('head_of_procurement')).toBe('Administration');

            expect(canRoleBeAtSiteType('head_of_hr', 'Administration')).toBe(true);
            expect(canRoleBeAtSiteType('head_of_hr', 'Store')).toBe(false);
            expect(canRoleBeAtSiteType('head_of_hr', 'Warehouse')).toBe(false);

            const invalidHrAssignment = validateRoleSiteAssignment('head_of_hr', 'Store');
            expect(invalidHrAssignment).toContain('must be assigned to a Administration location');
        });

        it('auto-selects the appropriate site ID based on the candidates role requirements', () => {
            const hqSiteId = autoSelectSiteForRole('head_of_hr', mockSites);
            expect(hqSiteId).toBe('site-hq-1');

            const storeSiteId = autoSelectSiteForRole('cashier', mockSites);
            expect(storeSiteId).toBe('site-store-1');

            const whSiteId = autoSelectSiteForRole('picker', mockSites);
            expect(whSiteId).toBe('site-wh-1');
        });
    });
});
