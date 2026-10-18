import { describe, it, expect } from 'vitest';
import stagingAccountsData from '../../components/login/stagingAccounts.json';
import { type StagingQuickAccount } from '../../components/login/CountryQuickLoginPanel';
import { SYSTEM_ROLES } from '../../utils/roles';

describe('Staging Accounts Dataset & Canonical Role Hierarchy', () => {
  const accounts = stagingAccountsData as StagingQuickAccount[];

  it('contains exactly 85 accounts (42 Ethiopia, 42 Kenya, 1 Global CEO)', () => {
    expect(accounts).toHaveLength(85);

    const etAccounts = accounts.filter(a => a.country === 'ET');
    const keAccounts = accounts.filter(a => a.country === 'KE');
    const globalAccounts = accounts.filter(a => a.country === 'GLOBAL');

    expect(etAccounts).toHaveLength(42);
    expect(keAccounts).toHaveLength(42);
    expect(globalAccounts).toHaveLength(1);
  });

  it('enforces exact canonical role naming and role IDs from SYSTEM_ROLES', () => {
    accounts.forEach(account => {
      // Find matching system role definition
      const sysRole = SYSTEM_ROLES.find(r => r.id === account.roleId || (account.roleId === 'super_admin' && r.id === 'super_admin'));
      expect(sysRole, `Role ID ${account.roleId} must exist in SYSTEM_ROLES`).toBeDefined();
      expect(account.role).toBe(sysRole?.label);
      expect(account.level).toBe(sysRole?.level);
    });
  });

  it('enforces canonical hierarchy distribution (7 L2 Directors, 11 L3 Leads, 24 L4 Staff per country)', () => {
    ['KE', 'ET'].forEach(country => {
      const countryAccounts = accounts.filter(a => a.country === country);
      expect(countryAccounts).toHaveLength(42);

      const l2 = countryAccounts.filter(a => a.level === 2);
      const l3 = countryAccounts.filter(a => a.level === 3);
      const l4 = countryAccounts.filter(a => a.level === 4);

      expect(l2).toHaveLength(7);
      expect(l3).toHaveLength(11);
      expect(l4).toHaveLength(24);

      l2.forEach(a => expect(a.levelTag).toBe('L2 Director'));
      l3.forEach(a => expect(a.levelTag).toBe('L3 Supervisor'));
      l4.forEach(a => expect(a.levelTag).toBe('L4 Specialist'));
    });

    const globalCEO = accounts.find(a => a.country === 'GLOBAL');
    expect(globalCEO?.level).toBe(1);
    expect(globalCEO?.levelTag).toBe('L1 Executive');
    expect(globalCEO?.role).toBe('Chief Executive Officer');
    expect(globalCEO?.roleId).toBe('super_admin');
  });

  it('verifies strict country prefix isolation for employee codes', () => {
    accounts.forEach(account => {
      if (account.country === 'ET') {
        expect(account.code).toMatch(/^ET-STG-/);
        expect(account.siteCode).toMatch(/^(ET-|ADD-)/);
        expect(account.email).toContain('@staging.siifmart.com');
      } else if (account.country === 'KE') {
        expect(account.code).toMatch(/^KE-STG-/);
        expect(account.siteCode).toMatch(/^(KE-|NBO-)/);
        expect(account.email).toContain('@staging.siifmart.com');
      } else if (account.country === 'GLOBAL') {
        expect(account.code).toBe('EMP-STG-001');
        expect(account.siteCode).toBe('HQ-GLOBAL');
        expect(account.email).toBe('admin@staging.siifmart.com');
      }
    });
  });

  it('verifies all operational site types are present for both countries', () => {
    const etSites = new Set(accounts.filter(a => a.country === 'ET').map(a => a.siteCode));
    const keSites = new Set(accounts.filter(a => a.country === 'KE').map(a => a.siteCode));

    // Ethiopia facilities
    expect(etSites).toContain('ET-ADD'); // Addis Ababa HQ
    expect(etSites).toContain('ADD-DC01'); // Kality Central DC (Warehouse)
    expect(etSites).toContain('ADD-RET01'); // Bole Flagship (Store)

    // Kenya facilities
    expect(keSites).toContain('KE-NRB'); // Kenya Regional HQ (Administration)
    expect(keSites).toContain('NBO-DC01'); // Embakasi Central DC (Warehouse)
    expect(keSites).toContain('NBO-RET01'); // Westlands Flagship (Store)
  });

  it('verifies all passwords and required properties are valid', () => {
    accounts.forEach(acc => {
      expect(acc.name.trim().length).toBeGreaterThan(0);
      expect(acc.role.trim().length).toBeGreaterThan(0);
      expect(acc.password).toBe('StagingPassword123!');
      expect(['HQ', 'Administration', 'Warehouse', 'Store']).toContain(acc.siteType);
    });
  });
});
