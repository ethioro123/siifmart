// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CountryQuickLoginPanel } from '../../components/login/CountryQuickLoginPanel';
import { getSiteTheme, getRoleTheme } from '../../components/login/quickLoginTheme';
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
  useStagingAccounts: () => ({ data: mockRoster, isLoading: false, error: null })
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
      const online = getSiteTheme('Online Store');

      expect(store.badge).toContain('emerald');
      expect(warehouse.badge).toContain('amber');
      expect(dc.badge).toContain('cyan');
      expect(online.badge).toContain('rose');

      // Site themes have unique border and icon colors
      expect(store.iconColor).not.toEqual(warehouse.iconColor);
      expect(warehouse.iconColor).not.toEqual(dc.iconColor);
    });

    it('assigns identical color theme to same roles across sites', () => {
      const cashier1 = getRoleTheme('cashier');
      const cashier2 = getRoleTheme('cashier');
      const pos = getRoleTheme('pos');
      const picker = getRoleTheme('picker');
      const driver = getRoleTheme('driver');

      // Same roles have exact same badges and dot colors
      expect(cashier1.badge).toEqual(cashier2.badge);
      expect(cashier1.dot).toEqual(cashier2.dot);
      expect(cashier1.badge).toEqual(pos.badge); // POS and cashier share the cashier theme

      // Different roles have different themes
      expect(cashier1.badge).toContain('emerald');
      expect(picker.badge).toContain('orange');
      expect(driver.badge).toContain('blue');
    });
  });

  describe('CountryQuickLoginPanel interactive role filtering and badges', () => {
    it('renders color-coded site badges and role badges', () => {
      const select = vi.fn();
      render(<CountryQuickLoginPanel country="KE" title="Kenya Staging Roles" onSelectAccount={select} />);

      // Site badges
      expect(screen.getByText('Store')).toBeTruthy();
      expect(screen.getByText('WH')).toBeTruthy();
      expect(screen.getByText('DC')).toBeTruthy();

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
