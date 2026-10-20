// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { KenyanQuickLogin } from '../../components/login/KenyanQuickLogin';
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
    code: 'KE-SIIF0201',
    name: 'John Picker',
    role: 'picker',
    job_title: 'Warehouse Order Picker',
    email: 'john.picker@role-coverage.staging.siifmart.invalid',
    site: { code: 'KE-NRB-WH-01', name: 'Nairobi Central Warehouse', type: 'Warehouse', country: 'KE', region_code: 'KE-NRB' }
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

describe('KenyanQuickLogin component', () => {
  it('toggles open and displays color-coded roles and filter chips', () => {
    const select = vi.fn();
    render(<KenyanQuickLogin onSelectAccount={select} />);

    // Initially collapsed
    expect(screen.queryByText('Jane Cashier')).toBeNull();

    // Click accordion header to open
    fireEvent.click(screen.getByRole('button', { name: /Staging Quick Login/i }));

    // Now open
    expect(screen.getByText('Jane Cashier')).toBeTruthy();
    expect(screen.getByText('John Picker')).toBeTruthy();

    // Filter by Cashier
    const cashierChip = screen.getByRole('button', { name: /Filter by Cashier/i });
    fireEvent.click(cashierChip);

    expect(screen.getByText('Jane Cashier')).toBeTruthy();
    expect(screen.queryByText('John Picker')).toBeNull();

    // Click employee card to select account
    fireEvent.click(screen.getByText('Jane Cashier').closest('button')!);
    expect(select).toHaveBeenCalledWith('jane.cashier@role-coverage.staging.siifmart.invalid');
  });
});
