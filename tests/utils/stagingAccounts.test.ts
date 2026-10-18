import { describe, it, expect } from 'vitest';
import stagingAccountsData from '../../components/login/stagingAccounts.json';
import { type StagingQuickAccount } from '../../components/login/CountryQuickLoginPanel';

describe('Staging Accounts Dataset & Multi-Country Isolation', () => {
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
