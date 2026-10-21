import { describe, expect, it } from 'vitest';
import { mapStagingEmployee, selectRepresentativeStagingAccounts, type StagingEmployeeRow } from '../../utils/stagingQuickLogin';

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
    it('excludes retired online-store staff and maps headquarters', () => {
        const online = mapStagingEmployee({ ...row, site: { ...row.site!, type: 'Dark Store' } });
        expect(online).toBeNull();
        const executive = mapStagingEmployee({ ...row, role: 'super_admin', site: null });
        expect(executive?.country).toBe('GLOBAL');
        expect(executive?.facilityTier).toBe('HQ');
    });
    it('excludes unsupported country records rather than classifying them as Ethiopia', () => {
        expect(mapStagingEmployee({ ...row, site: { ...row.site!, country: 'ZZ' } })).toBeNull();
    });
    it('keeps one representative site per country and facility type, including administration', () => {
        const makeAccount = (id: string, country: 'ET' | 'KE', code: string, type: string, regionCode: string | null = null, name = type) =>
            mapStagingEmployee({ ...row, id, site: { code, name, type, country, region_code: regionCode } })!;
        const roster = [
            makeAccount('et-hq', 'ET', 'ET-HQ', 'Administration'),
            makeAccount('et-region', 'ET', 'ET-ADD', 'Administration', 'ET-ADD', 'Regional Administration'),
            makeAccount('et-store-1a', 'ET', 'ET-ADD-STORE-01', 'Store', 'ET-ADD'),
            makeAccount('et-store-1b', 'ET', 'ET-ADD-STORE-01', 'Store', 'ET-ADD'),
            makeAccount('et-store-2', 'ET', 'ET-ADD-STORE-02', 'Store', 'ET-ADD'),
            makeAccount('et-wh', 'ET', 'ET-ADD-WH-01', 'Warehouse', 'ET-ADD'),
            makeAccount('et-dc', 'ET', 'ET-ADD-DC-01', 'Distribution Center', 'ET-ADD'),
            makeAccount('ke-hq', 'KE', 'KE-HQ', 'Administration'),
            makeAccount('ke-region', 'KE', 'KE-NRB', 'Administration', 'KE-NRB', 'Regional Administration'),
            makeAccount('ke-store', 'KE', 'KE-NRB-STORE-01', 'Store', 'KE-NRB'),
            makeAccount('ke-wh', 'KE', 'KE-NRB-WH-01', 'Warehouse', 'KE-NRB'),
            makeAccount('ke-dc', 'KE', 'KE-NRB-DC-01', 'Distribution Center', 'KE-NRB'),
            mapStagingEmployee({ ...row, id: 'global-admin', role: 'super_admin', site: null })!
        ];

        const selected = selectRepresentativeStagingAccounts(roster);
        expect(selected.map(account => account.id)).toEqual([
            'et-hq', 'et-region', 'et-store-1a', 'et-store-1b', 'et-wh', 'et-dc',
            'ke-hq', 'ke-region', 'ke-store', 'ke-wh', 'ke-dc', 'global-admin'
        ]);
    });
});
