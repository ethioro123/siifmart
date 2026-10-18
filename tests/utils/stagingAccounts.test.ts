import { describe, it, expect } from 'vitest';
import stagingAccountsData from '../../components/login/stagingAccounts.json';
import { type StagingQuickAccount } from '../../components/login/CountryQuickLoginPanel';
import { SYSTEM_ROLES } from '../../utils/roles';
import {
  isHqFacilitySite,
  isRegionalAdminFacilitySite,
  isOperationFacilitySite,
  matchesFacilityFilter,
} from '../../utils/roleSegregation';

describe('Staging Accounts Dataset & Three-Level Facility Hierarchy', () => {
  const accounts = stagingAccountsData as StagingQuickAccount[];

  it('contains exactly 111 accounts (55 Ethiopia, 55 Kenya, 1 Global CEO)', () => {
    expect(accounts).toHaveLength(111);

    const etAccounts = accounts.filter(a => a.country === 'ET');
    const keAccounts = accounts.filter(a => a.country === 'KE');
    const globalAccounts = accounts.filter(a => a.country === 'GLOBAL');

    expect(etAccounts).toHaveLength(55);
    expect(keAccounts).toHaveLength(55);
    expect(globalAccounts).toHaveLength(1);
  });

  it('enforces exact canonical role naming and role IDs from SYSTEM_ROLES', () => {
    accounts.forEach(account => {
      const sysRole = SYSTEM_ROLES.find(r => r.id === account.roleId);
      expect(sysRole, `Role ID ${account.roleId} must exist in SYSTEM_ROLES`).toBeDefined();
      expect(account.role).toBe(sysRole?.label);
      expect(account.level).toBe(sysRole?.level);
    });
  });

  it('enforces the 3-Level Facility Hierarchy per country (23 HQ, 6 Regional Admin, 26 Operation Sites)', () => {
    (['ET', 'KE'] as const).forEach(country => {
      const countryAccounts = accounts.filter(a => a.country === country);
      expect(countryAccounts).toHaveLength(55);

      // Level 1: HQ
      const hqAccounts = countryAccounts.filter(a => a.facilityTier === 'HQ');
      expect(hqAccounts).toHaveLength(23);
      hqAccounts.forEach(a => expect(a.siteType).toBe('HQ'));

      // Level 2: Regional Administration
      const regAccounts = countryAccounts.filter(a => a.facilityTier === 'Regional Administration');
      expect(regAccounts).toHaveLength(6);
      regAccounts.forEach(a => expect(a.siteType).toBe('Regional Administration'));

      // Level 3: Operation Sites (Store, Warehouse, Distribution Center, Online Store)
      const opsAccounts = countryAccounts.filter(a => a.facilityTier === 'Operation Sites');
      expect(opsAccounts).toHaveLength(26);

      const storeAccounts = opsAccounts.filter(a => a.siteType === 'Store');
      const whAccounts = opsAccounts.filter(a => a.siteType === 'Warehouse');
      const dcAccounts = opsAccounts.filter(a => a.siteType === 'Distribution Center');
      const onlineAccounts = opsAccounts.filter(a => a.siteType === 'Online Store');

      expect(storeAccounts).toHaveLength(7);
      expect(whAccounts).toHaveLength(7);
      expect(dcAccounts).toHaveLength(7);
      expect(onlineAccounts).toHaveLength(5);
    });

    const globalCEO = accounts.find(a => a.country === 'GLOBAL');
    expect(globalCEO?.level).toBe(1);
    expect(globalCEO?.levelTag).toBe('L1 Executive');
    expect(globalCEO?.role).toBe('Chief Executive Officer');
    expect(globalCEO?.roleId).toBe('super_admin');
    expect(globalCEO?.facilityTier).toBe('HQ');
  });

  it('verifies strict country prefix isolation for employee and site codes', () => {
    accounts.forEach(account => {
      if (account.country === 'ET') {
        expect(account.code).toMatch(/^ET-STG-\d{3}$/);
        expect(account.siteCode).toMatch(/^ET-(HQ|ADD|ADD-STR-01|ADD-WH-01|ADD-DC-01|ADD-ONL-01)$/);
        expect(account.email).toContain('@staging.siifmart.com');
      } else if (account.country === 'KE') {
        expect(account.code).toMatch(/^KE-STG-\d{3}$/);
        expect(account.siteCode).toMatch(/^KE-(HQ|NRB|NRB-STR-01|NRB-WH-01|NRB-DC-01|NRB-ONL-01)$/);
        expect(account.email).toContain('@staging.siifmart.com');
      } else if (account.country === 'GLOBAL') {
        expect(account.code).toBe('EMP-STG-001');
        expect(account.siteCode).toBe('HQ-GLOBAL');
        expect(account.email).toBe('admin@staging.siifmart.com');
      }
    });
  });

  it('correctly classifies all 3 facility tiers in roleSegregation helper functions', () => {
    const mockSites = [
      { id: 's-et-hq', code: 'ET-HQ', name: 'Central Operations', type: 'Administration' as const },
      { id: 's-et-add', code: 'ET-ADD', name: 'Addis Ababa Regional Administration', type: 'Administration' as const },
      { id: 's-et-str', code: 'ET-ADD-STR-01', name: 'Bole Supermarket', type: 'Store' as const },
      { id: 's-et-wh', code: 'ET-ADD-WH-01', name: 'Kality Storage Warehouse', type: 'Warehouse' as const },
      { id: 's-et-dc', code: 'ET-ADD-DC-01', name: 'Addis Ababa Distribution Center', type: 'Distribution Center' as const },
      { id: 's-et-onl', code: 'ET-ADD-ONL-01', name: 'Addis Ababa Online Store', type: 'Dark Store' as const },
    ];

    expect(isHqFacilitySite(mockSites[0])).toBe(true);
    expect(isRegionalAdminFacilitySite(mockSites[0])).toBe(false);

    expect(isRegionalAdminFacilitySite(mockSites[1])).toBe(true);
    expect(isHqFacilitySite(mockSites[1])).toBe(false);

    expect(isOperationFacilitySite(mockSites[2])).toBe(true);
    expect(isOperationFacilitySite(mockSites[3])).toBe(true);
    expect(isOperationFacilitySite(mockSites[4])).toBe(true);
    expect(isOperationFacilitySite(mockSites[5])).toBe(true);

    expect(matchesFacilityFilter(mockSites[0], 'TIER:HQ')).toBe(true);
    expect(matchesFacilityFilter(mockSites[1], 'TIER:REGIONAL')).toBe(true);
    expect(matchesFacilityFilter(mockSites[2], 'TIER:OPERATIONS')).toBe(true);
    expect(matchesFacilityFilter(mockSites[2], 'TYPE:Store')).toBe(true);
    expect(matchesFacilityFilter(mockSites[3], 'TYPE:Warehouse')).toBe(true);
    expect(matchesFacilityFilter(mockSites[4], 'TYPE:Distribution Center')).toBe(true);
    expect(matchesFacilityFilter(mockSites[5], 'TYPE:Online Store')).toBe(true);
  });

  it('verifies all passwords and required properties are valid', () => {
    accounts.forEach(acc => {
      expect(acc.name.trim().length).toBeGreaterThan(0);
      expect(acc.role.trim().length).toBeGreaterThan(0);
      expect(acc.password).toBe('StagingPassword123!');
      expect([
        'HQ',
        'Regional Administration',
        'Store',
        'Warehouse',
        'Distribution Center',
        'Online Store',
      ]).toContain(acc.siteType);
    });
  });
});
