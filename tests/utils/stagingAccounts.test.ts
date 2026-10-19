import { describe, expect, it } from 'vitest';
import { mapStagingEmployee, type StagingEmployeeRow } from '../../utils/stagingQuickLogin';

const row: StagingEmployeeRow = {
    id: 'test-employee', name: '[TEST] DC Picker', role: 'picker', job_title: 'Warehouse Order Picker',
    code: 'ET-SIIF0200', email: 'et.add.dc01.picker@role-coverage.staging.siifmart.invalid',
    site: { code: 'ET-ADD-DC-01', name: 'Distribution Center', type: 'Distribution Center', country: 'ET', region_code: 'ET-ADD' }
};
describe('live staging roster mapping', () => {
    it('includes newly provisioned floor staff at their actual distribution center', () => {
        const account = mapStagingEmployee(row)!;
        expect(account.roleId).toBe('picker');
        expect(account.role).toBe('Warehouse Order Picker');
        expect(account.level).toBe(4);
        expect(account.facilityTier).toBe('Operation Sites');
        expect(account.siteCode).toBe('ET-ADD-DC-01');
        expect(account.country).toBe('ET');
        expect(account).not.toHaveProperty('password');
    });
    it('keeps two centers in the same country distinct and preserves Kenya isolation', () => {
        const first = mapStagingEmployee(row)!;
        const second = mapStagingEmployee({ ...row, site: { ...row.site!, code: 'ET-ADA-DC-01' } })!;
        const kenya = mapStagingEmployee({ ...row, site: { ...row.site!, code: 'KE-NRB-DC-01', country: 'KE', region_code: 'KE-NRB' } })!;
        expect(first.siteCode).not.toBe(second.siteCode);
        expect(kenya.country).toBe('KE');
    });
    it('maps online-store staff and headquarters without relying on old fixed account counts', () => {
        const online = mapStagingEmployee({ ...row, site: { ...row.site!, type: 'Dark Store' } });
        expect(online?.siteType).toBe('Online Store');
        const executive = mapStagingEmployee({ ...row, role: 'super_admin', site: null });
        expect(executive?.country).toBe('GLOBAL');
        expect(executive?.facilityTier).toBe('HQ');
    });
    it('excludes unsupported country records rather than classifying them as Ethiopia', () => {
        expect(mapStagingEmployee({ ...row, site: { ...row.site!, country: 'ZZ' } })).toBeNull();
    });
});
