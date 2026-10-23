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
        expect(account.role).toBe('Order Picker');
        expect(account.level).toBe(10);
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
        const executive = mapStagingEmployee({ ...row, role: 'group_ceo', site: null });
        expect(executive?.country).toBe('GLOBAL');
        expect(executive?.facilityTier).toBe('HQ');
    });
    it('excludes unsupported country records rather than classifying them as Ethiopia', () => {
        expect(mapStagingEmployee({ ...row, site: { ...row.site!, country: 'ZZ' } })).toBeNull();
    });
    it('keeps all regional offices and receiving hubs with representative HQ and stores', () => {
        const makeAccount = (id: string, country: 'ET' | 'KE', code: string, type: string, regionCode: string | null = null, name = type) =>
            mapStagingEmployee({ ...row, id, site: { code, name, type, country, region_code: regionCode } })!;
        const roster = [
            makeAccount('et-hq', 'ET', 'ET-HQ', 'Administration'),
            makeAccount('et-region', 'ET', 'ET-ADD', 'Administration', 'ET-ADD', 'Regional Administration'),
            makeAccount('et-region-2', 'ET', 'ET-ADA', 'Administration', 'ET-ADA', 'Regional Administration'),
            makeAccount('et-store-1a', 'ET', 'ET-ADD-STORE-01', 'Store', 'ET-ADD'),
            makeAccount('et-store-1b', 'ET', 'ET-ADD-STORE-01', 'Store', 'ET-ADD'),
            makeAccount('et-store-2', 'ET', 'ET-ADD-STORE-02', 'Store', 'ET-ADD'),
            makeAccount('et-wh', 'ET', 'ET-ADD-WH-01', 'Warehouse', 'ET-ADD'),
            makeAccount('et-wh-2', 'ET', 'ET-ADA-WH-01', 'Warehouse', 'ET-ADA'),
            makeAccount('et-dc-2', 'ET', 'ET-ADA-DC-01', 'Distribution Center', 'ET-ADA'),
            makeAccount('et-dc', 'ET', 'ET-ADD-DC-01', 'Distribution Center', 'ET-ADD'),
            makeAccount('ke-hq', 'KE', 'KE-HQ', 'Administration'),
            makeAccount('ke-region', 'KE', 'KE-NRB', 'Administration', 'KE-NRB', 'Regional Administration'),
            makeAccount('ke-store', 'KE', 'KE-NRB-STORE-01', 'Store', 'KE-NRB'),
            makeAccount('ke-wh', 'KE', 'KE-NRB-WH-01', 'Warehouse', 'KE-NRB'),
            makeAccount('ke-dc', 'KE', 'KE-NRB-DC-01', 'Distribution Center', 'KE-NRB'),
            mapStagingEmployee({ ...row, id: 'global-admin', role: 'group_ceo', site: null })!
        ];

        const selected = selectRepresentativeStagingAccounts(roster);
        expect(selected.map(account => account.id)).toEqual([
            'et-hq', 'et-region', 'et-region-2', 'et-store-1a', 'et-store-1b', 'et-wh', 'et-wh-2', 'et-dc-2', 'et-dc',
            'ke-hq', 'ke-region', 'ke-store', 'ke-wh', 'ke-dc', 'global-admin'
        ]);
    });
    it('guarantees strictly one employee per role for Addis Ababa DC in quick login selection', () => {
        const makeDcAccount = (id: string, role: string, email: string, name: string) =>
            mapStagingEmployee({
                ...row, id, role, email, name,
                site: { code: 'ET-ADD-DC-01', name: 'Addis Ababa Distribution Center', type: 'Distribution Center', country: 'ET', region_code: 'ET-ADD' }
            })!;
        const duplicateRoster = [
            makeDcAccount('et-inv-fixture', 'inventory_specialist', 'et-add-dc-01.inventory_specialist@role-coverage.staging.siifmart.invalid', '[TEST] ET-ADD-DC-01 - Inventory Control Specialist'),
            makeDcAccount('et-inv-named', 'inventory_specialist', 'et.inventoryspecialist@staging.siifmart.com', 'Kalkidan Gezahegn'),
            makeDcAccount('et-ret-named', 'returns_clerk', 'et.returnsclerk@staging.siifmart.com', 'Diribe Welteji'),
            makeDcAccount('et-ret-fixture', 'returns_clerk', 'et-add-dc-01.returns_clerk@role-coverage.staging.siifmart.invalid', '[TEST] ET-ADD-DC-01 - Returns Specialist'),
            makeDcAccount('et-wh-mgr', 'warehouse_manager', 'et-add-dc-01.warehouse_manager@role-coverage.staging.siifmart.invalid', '[TEST] ET-ADD-DC-01 - Warehouse Manager')
        ];

        const selected = selectRepresentativeStagingAccounts(duplicateRoster);
        expect(selected.map(a => a.id)).toEqual(['et-inv-named', 'et-ret-named', 'et-wh-mgr']);
        expect(selected.filter(a => a.roleId === 'inventory_specialist')).toHaveLength(1);
        expect(selected.filter(a => a.roleId === 'returns_clerk')).toHaveLength(1);
        expect(selected.filter(a => a.roleId === 'warehouse_manager')).toHaveLength(1);
    });

    it('excludes Bishoftu and includes Piassa Heritage and CMC Summit supermarkets in quick login', () => {
        const makeStoreAccount = (id: string, siteCode: string, siteName: string, role = 'cashier', email = `${id}@staging.siifmart.com`, name = id) =>
            mapStagingEmployee({
                ...row, id, role, email, name,
                site: { code: siteCode, name: siteName, type: 'Store', country: 'ET', region_code: siteCode.slice(0, 6) }
            })!;

        const mixedRoster = [
            // Bishoftu Lakefront Supermarket (should be excluded)
            makeStoreAccount('bishoftu-mgr', 'ET-ADA-STR-02', 'Bishoftu Lakefront Supermarket', 'store_manager'),
            makeStoreAccount('bishoftu-cashier', 'ET-ADA-STR-02', 'Bishoftu Lakefront Supermarket', 'cashier'),

            // Piassa Heritage Supermarket (should be included, deduplicating duplicate roles)
            makeStoreAccount('piassa-cashier-named', 'ET-ADD-STR-02', 'Piassa Heritage Supermarket', 'cashier', 'et.add.str02.cashier@staging.siifmart.com', 'Eden Haile'),
            makeStoreAccount('piassa-cashier-fixture', 'ET-ADD-STR-02', 'Piassa Heritage Supermarket', 'cashier', 'et-add-str-02.cashier@role-coverage.staging.siifmart.invalid', '[TEST] Cashier'),
            makeStoreAccount('piassa-mgr', 'ET-ADD-STR-02', 'Piassa Heritage Supermarket', 'store_manager', 'et.add.str02.storemanager@staging.siifmart.com', 'Tewodros Assefa'),

            // CMC Summit Supermarket (should be included)
            makeStoreAccount('cmc-cashier', 'ET-ADD-STR-03', 'CMC Summit Supermarket', 'cashier', 'et.add.str03.cashier@staging.siifmart.com', 'Betelhem Hailu'),
            makeStoreAccount('cmc-mgr', 'ET-ADD-STR-03', 'CMC Summit Supermarket', 'store_manager', 'et.add.str03.storemanager@staging.siifmart.com', 'Ermias Desta'),
        ];

        const selected = selectRepresentativeStagingAccounts(mixedRoster);
        const selectedIds = selected.map(a => a.id);

        // Bishoftu must be completely excluded
        expect(selectedIds).not.toContain('bishoftu-mgr');
        expect(selectedIds).not.toContain('bishoftu-cashier');

        // Piassa Heritage must be included and role-deduplicated
        expect(selectedIds).toContain('piassa-cashier-named');
        expect(selectedIds).not.toContain('piassa-cashier-fixture');
        expect(selectedIds).toContain('piassa-mgr');

        // CMC Summit must be included
        expect(selectedIds).toContain('cmc-cashier');
        expect(selectedIds).toContain('cmc-mgr');
    });
});
