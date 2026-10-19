// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CountryQuickLoginPanel } from '../../components/login/CountryQuickLoginPanel';
import { mapStagingEmployee } from '../../utils/stagingQuickLogin';

vi.mock('../../hooks/useStagingQuickLogin', () => ({ useStagingAccounts: () => ({ data: accounts, isLoading: false }) }));
vi.mock('../../utils/stagingQuickLogin', async importOriginal => ({
    ...await importOriginal<typeof import('../../utils/stagingQuickLogin')>(), isStagingQuickLoginAvailable: () => true
}));
const accounts = ['ET-ADD-DC-01', 'ET-ADA-DC-01', 'KE-NRB-DC-01'].map((code, index) => mapStagingEmployee({
    id: `test-${index}`, code: `${code.slice(0, 2)}-SIIF0200`, name: `[TEST] ${code} Picker`, role: 'picker',
    job_title: 'Warehouse Order Picker', email: `${code.toLowerCase()}.picker@role-coverage.staging.siifmart.invalid`,
    site: { code, name: `Center ${index}`, type: 'Distribution Center', country: code.slice(0, 2), region_code: code.slice(0, 6) }
})!);
afterEach(cleanup);

describe('live country quick-login panel', () => {
    it('shows newly added test employees, live counts and their exact site, without other-country staff', () => {
        const select = vi.fn();
        render(<CountryQuickLoginPanel country="ET" title="Ethiopia" onSelectAccount={select} />);
        expect(screen.getByText('2 Employees')).toBeTruthy();
        expect(screen.queryByText('[TEST] KE-NRB-DC-01 Picker')).toBeNull();
        fireEvent.change(screen.getByPlaceholderText(/Search Ethiopia/), { target: { value: 'ET-ADA-DC-01' } });
        const account = screen.getByText('[TEST] ET-ADA-DC-01 Picker');
        expect(screen.queryByText('[TEST] ET-ADD-DC-01 Picker')).toBeNull();
        fireEvent.click(account.closest('button')!);
        expect(select).toHaveBeenCalledWith('et-ada-dc-01.picker@role-coverage.staging.siifmart.invalid');
    });
});
