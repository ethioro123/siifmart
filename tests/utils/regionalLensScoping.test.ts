import { describe, it, expect } from 'vitest';
import { canSwitchRegion, getUserRegion } from '../../utils/permissions';
import type { Site, Employee } from '../../types';

describe('Regional Authority & Lens Scoping', () => {
    describe('canSwitchRegion', () => {
        it('permits National HQ executive roles to switch regional lenses', () => {
            expect(canSwitchRegion({ role: 'ceo' })).toBe(true);
            expect(canSwitchRegion({ role: 'super_admin' })).toBe(true);
            expect(canSwitchRegion({ role: 'admin' })).toBe(true);
            expect(canSwitchRegion({ role: 'operations_manager' })).toBe(true);
            expect(canSwitchRegion({ role: 'finance_manager' })).toBe(true);
            expect(canSwitchRegion({ role: 'auditor' })).toBe(true);
            expect(canSwitchRegion({ title: 'Chief Executive Officer' })).toBe(true);
        });

        it('denies decentralized regional staff and branch floor staff from switching regional lenses', () => {
            expect(canSwitchRegion({ role: 'regional_manager' })).toBe(false);
            expect(canSwitchRegion({ role: 'regional_procurement_lead' })).toBe(false);
            expect(canSwitchRegion({ role: 'regional_finance_officer' })).toBe(false);
            expect(canSwitchRegion({ role: 'regional_hr_officer' })).toBe(false);
            expect(canSwitchRegion({ role: 'store_manager' })).toBe(false);
            expect(canSwitchRegion({ role: 'cashier' })).toBe(false);
            expect(canSwitchRegion({ role: 'picker' })).toBe(false);
            expect(canSwitchRegion(null)).toBe(false);
        });
    });

    describe('getUserRegion', () => {
        const mockSites: Partial<Site>[] = [
            { id: 'site-nrb-hub', code: 'NRB-01', regionCode: 'ke_nairobi', country: 'KE' },
            { id: 'site-msa-hub', code: 'MSA-01', regionCode: 'ke_mombasa', country: 'KE' },
            { id: 'site-add-hub', code: 'ADD-01', regionCode: 'et_addis', country: 'ET' }
        ];

        const mockEmployees: Partial<Employee>[] = [
            { id: 'emp-1', name: 'Amina', role: 'regional_manager', regionCode: 'ke_mombasa', siteId: 'site-msa-hub' },
            { id: 'emp-2', name: 'Dawit', role: 'regional_procurement_lead', region_code: 'et_addis', siteId: 'site-add-hub' },
            { id: 'emp-3', name: 'John', role: 'cashier', siteId: 'site-nrb-hub' }
        ];

        it('resolves region directly from employee profile', () => {
            const userAmina = { id: 'emp-1', role: 'regional_manager' };
            const region = getUserRegion(userAmina, mockSites as Site[], mockEmployees as Employee[]);
            expect(region).toBe('ke_mombasa');
        });

        it('resolves region from snake_case region_code employee profile', () => {
            const userDawit = { id: 'emp-2', role: 'regional_procurement_lead' };
            const region = getUserRegion(userDawit, mockSites as Site[], mockEmployees as Employee[]);
            expect(region).toBe('et_addis');
        });

        it('resolves region fallback from assigned site', () => {
            const userJohn = { id: 'emp-3', role: 'cashier', siteId: 'site-nrb-hub' };
            const region = getUserRegion(userJohn, mockSites as Site[], mockEmployees as Employee[]);
            expect(region).toBe('ke_nairobi');
        });

        it('returns null for unassigned or global users', () => {
            const userHQ = { id: 'ceo-user', role: 'ceo' };
            const region = getUserRegion(userHQ, mockSites as Site[], mockEmployees as Employee[]);
            expect(region).toBeNull();
        });
    });
});
