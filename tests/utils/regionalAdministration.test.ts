import { expect, it } from 'vitest';
import { isEligibleRegionalHub, isEligibleRegionalManager } from '../../utils/regionalAdministration';
import type { Site, Region } from '../../types';
import type { RegionalAdminEmployee } from '../../types/regionalAdministration';
const hub = { id: 'hub', code: 'ADD', country: 'ET', status: 'Active', type: 'Administration', region_code: 'ADD' } as Site;
it('prevents taking another region hub or assigning country headquarters', () => {
    expect(isEligibleRegionalHub(hub, 'ADD', [])).toBe(true);
    expect(isEligibleRegionalHub(hub, 'ADA', [])).toBe(false);
    expect(isEligibleRegionalHub({ ...hub, code: 'ET-HQ', region_code: undefined }, 'ADD', [])).toBe(false);
    expect(isEligibleRegionalHub({ ...hub, region_code: undefined }, 'ADD', [{ code: 'ADA', admin_hub_site_id: 'hub' } as Region])).toBe(false);
    expect(isEligibleRegionalHub({ ...hub, status: 'Closed' }, 'ADD', [])).toBe(false);
});
it('only offers an active manager in the actual employee region', () => {
    const employee = { id: 'manager', role: 'regional_operations_manager', status: 'Active', region_code: 'ADD' } as RegionalAdminEmployee;
    expect(isEligibleRegionalManager(employee, 'ADD')).toBe(true);
    expect(isEligibleRegionalManager(employee, 'ADA')).toBe(false);
    expect(isEligibleRegionalManager({ ...employee, status: 'Terminated' }, 'ADD')).toBe(false);
    expect(isEligibleRegionalManager({ ...employee, role: 'store_manager' }, 'ADD')).toBe(false);
});
