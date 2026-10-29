// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CountryQuickLoginPanel } from '../../components/login/CountryQuickLoginPanel';
import { getSiteTheme } from '../../components/login/quickLoginTheme';
import { mapStagingEmployee } from '../../utils/stagingQuickLogin';

const mockRoster = [
  mapStagingEmployee({
    id: 'emp-1',
    code: 'KE-SIIF0101',
    name: 'Jane Cashier',
    role: 'cashier',
    job_title: 'Cashier',
    email: 'jane.cashier@role-coverage.staging.siifmart.invalid',
    site: { code: 'KE-NRB-STR-01', name: 'Nairobi Flagship Store', type: 'Store', country: 'KE', region_code: 'KE-NRB' }
  })!,
  mapStagingEmployee({
    id: 'emp-2',
    code: 'KE-SIIF0102',
    name: 'Bob Manager',
    role: 'store_manager',
    job_title: 'Store Manager',
    email: 'bob.manager@role-coverage.staging.siifmart.invalid',
    site: { code: 'KE-NRB-STR-01', name: 'Nairobi Flagship Store', type: 'Store', country: 'KE', region_code: 'KE-NRB' }
  })!,
  mapStagingEmployee({
    id: 'emp-3',
    code: 'KE-SIIF0201',
    name: 'John Picker',
    role: 'picker',
    job_title: 'Warehouse Order Picker',
    email: 'john.picker@role-coverage.staging.siifmart.invalid',
    site: { code: 'KE-NRB-WH-01', name: 'Nairobi Central Warehouse', type: 'Warehouse', country: 'KE', region_code: 'KE-NRB' }
  })!,
  mapStagingEmployee({
    id: 'emp-4',
    code: 'KE-SIIF0301',
    name: 'David Driver',
    role: 'driver',
    job_title: 'Delivery Driver',
    email: 'david.driver@role-coverage.staging.siifmart.invalid',
    site: { code: 'KE-NRB-DC-01', name: 'Nairobi Distribution Center', type: 'Distribution Center', country: 'KE', region_code: 'KE-NRB' }
  })!,
];

vi.mock('../../hooks/useStagingQuickLogin', () => ({
  useStagingAccounts: () => ({ data: mockRoster, isLoading: false, error: null, refetch: vi.fn() })
}));

vi.mock('../../utils/stagingQuickLogin', async importOriginal => ({
  ...await importOriginal<typeof import('../../utils/stagingQuickLogin')>(),
  isStagingQuickLoginAvailable: () => true
}));

afterEach(cleanup);

describe('quick login theming and filtering', () => {
  describe('theme mapping helpers', () => {
    it('assigns distinctive colors for different facility site types', () => {
      const store = getSiteTheme('Store');
      const warehouse = getSiteTheme('Warehouse');
      const dc = getSiteTheme('Distribution Center');

      expect(store.badge).toMatch(/emerald|theme-status-success/);
      expect(warehouse.badge).toMatch(/amber|theme-status-warning/);
      expect(dc.badge).toMatch(/cyan|theme-status-info/);

      // Site themes have unique border and icon colors
      expect(store.iconColor).not.toEqual(warehouse.iconColor);
      expect(warehouse.iconColor).not.toEqual(dc.iconColor);
      expect(store.countBadge).toMatch(/emerald|theme-status-success/);
      expect(warehouse.countBadge).toMatch(/amber|theme-status-warning/);
    });
  });

  describe('CountryQuickLoginPanel interactive role filtering and badges', () => {
    it('renders color-coded site badges, site names, and exact worker counts per site', () => {
      const select = vi.fn();
      render(<CountryQuickLoginPanel country="KE" title="Kenya Staging Roles" onSelectAccount={select} />);

      // Site badges
      expect(screen.getByText('Store')).toBeTruthy();
      expect(screen.getByText('WH')).toBeTruthy();
      expect(screen.getByText('DC')).toBeTruthy();

      // Worker counts per site
      expect(screen.getByText('2 Workers')).toBeTruthy(); // Nairobi Flagship Store has 2 workers
      expect(screen.getAllByText('1 Worker').length).toBe(2); // WH and DC each have 1 worker

      // Employee names & roles
      expect(screen.getByText('Jane Cashier')).toBeTruthy();
      expect(screen.getByText('Bob Manager')).toBeTruthy();
      expect(screen.getByText('John Picker')).toBeTruthy();
      expect(screen.getByText('David Driver')).toBeTruthy();
    });

    it('filters employees when a role chip is clicked', () => {
      const select = vi.fn();
      render(<CountryQuickLoginPanel country="KE" title="Kenya Staging Roles" onSelectAccount={select} />);

      // Find the "Cashier" chip and click it
      const cashierChip = screen.getByRole('button', { name: /Filter by Cashier/i });
      fireEvent.click(cashierChip);

      // Now only Jane Cashier should be visible, others filtered out
      expect(screen.getByText('Jane Cashier')).toBeTruthy();
      expect(screen.queryByText('John Picker')).toBeNull();
      expect(screen.queryByText('David Driver')).toBeNull();

      // Click "All Roles" to reset
      fireEvent.click(screen.getByRole('button', { name: /All Roles/i }));
      expect(screen.getByText('John Picker')).toBeTruthy();
      expect(screen.getByText('David Driver')).toBeTruthy();
    });
  });
});
