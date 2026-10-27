// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CountryQuickLoginPanel } from '../../components/login/CountryQuickLoginPanel';
import { mapStagingEmployee } from '../../utils/stagingQuickLogin';

const mockRoster = [
    // Store in Ethiopia: 3 employees with different ranks
    mapStagingEmployee({
        id: 'emp-cashier',
        code: 'ET-SIIF009',
        name: 'Eden Haile',
        role: 'cashier', // Level 9
        job_title: 'Cashier',
        email: 'eden.haile@staging.siifmart.com',
        site: { code: 'ET-ADD-STR-01', name: 'Bole Flagship Store', type: 'Store', country: 'ET', region_code: 'ET-ADD' }
    })!,
    mapStagingEmployee({
        id: 'emp-store-mgr',
        code: 'ET-SIIF006',
        name: 'Tewodros Assefa',
        role: 'store_manager', // Level 6
        job_title: 'Store Manager',
        email: 'tewodros.assefa@staging.siifmart.com',
        site: { code: 'ET-ADD-STR-01', name: 'Bole Flagship Store', type: 'Store', country: 'ET', region_code: 'ET-ADD' }
    })!,
    mapStagingEmployee({
        id: 'emp-supervisor',
        code: 'ET-SIIF007',
        name: 'Girma Bekele',
        role: 'shift_supervisor', // Level 7
        job_title: 'Store Supervisor',
        email: 'girma.bekele@staging.siifmart.com',
        site: { code: 'ET-ADD-STR-01', name: 'Bole Flagship Store', type: 'Store', country: 'ET', region_code: 'ET-ADD' }
    })!,
    // Regional Administration in Ethiopia: Regional Ops Manager
    mapStagingEmployee({
        id: 'emp-reg-mgr',
        code: 'ET-SIIF004',
        name: 'Henok Tadesse',
        role: 'regional_operations_manager', // Level 4
        job_title: 'Regional Operations Manager',
        email: 'henok.tadesse@staging.siifmart.com',
        site: { code: 'ET-ADD-REG-01', name: 'Addis Ababa Regional HQ', type: 'Regional Administration', country: 'ET', region_code: 'ET-ADD' }
    })!,
    // Distribution Center in Ethiopia
    mapStagingEmployee({
        id: 'emp-dc-picker',
        code: 'ET-SIIF008',
        name: 'Kenenisa Girma',
        role: 'picker', // Level 10
        job_title: 'Warehouse Order Picker',
        email: 'kenenisa.girma@role-coverage.staging.siifmart.invalid',
        site: { code: 'ET-ADD-DC-01', name: 'Addis Ababa DC', type: 'Distribution Center', country: 'ET', region_code: 'ET-ADD' }
    })!,
    // Kenya Staff (should be excluded when country="ET")
    mapStagingEmployee({
        id: 'emp-ke-cashier',
        code: 'KE-SIIF009',
        name: 'Faith Kipyegon',
        role: 'cashier',
        job_title: 'Cashier',
        email: 'faith.kipyegon@staging.siifmart.com',
        site: { code: 'KE-NRB-STR-01', name: 'Nairobi Flagship Store', type: 'Store', country: 'KE', region_code: 'KE-NRB' }
    })!
];

vi.mock('../../hooks/useStagingQuickLogin', () => ({
    useStagingAccounts: () => ({ data: mockRoster, isLoading: false, error: null, refetch: vi.fn() })
}));

vi.mock('../../utils/stagingQuickLogin', async importOriginal => ({
    ...await importOriginal<typeof import('../../utils/stagingQuickLogin')>(),
    isStagingQuickLoginAvailable: () => true
}));

afterEach(cleanup);

describe('CountryQuickLoginPanel reorganization by location of work & ranking', () => {
    it('isolates country accounts and shows real employee names with Rank badges', () => {
        const select = vi.fn();
        render(<CountryQuickLoginPanel country="ET" title="Ethiopia Staging Roles" onSelectAccount={select} />);

        expect(screen.getByText('5 Employees')).toBeTruthy();
        expect(screen.queryByText('Faith Kipyegon')).toBeNull(); // Kenya staff excluded

        // Real names are visible
        expect(screen.getByText('Henok Tadesse')).toBeTruthy();
        expect(screen.getByText('Tewodros Assefa')).toBeTruthy();
        expect(screen.getByText('Girma Bekele')).toBeTruthy();
        expect(screen.getByText('Eden Haile')).toBeTruthy();
        expect(screen.getByText('Kenenisa Girma')).toBeTruthy();

        // Rank badges are displayed
        expect(screen.getByText('Rank L4')).toBeTruthy();
        expect(screen.getByText('Rank L6')).toBeTruthy();
        expect(screen.getByText('Rank L8')).toBeTruthy();
        expect(screen.getAllByText('Rank L10').length).toBe(2); // Cashier and Picker are Level 10
    });

    it('organizes work locations hierarchically (Regional HQ before DC before Retail Store)', () => {
        render(<CountryQuickLoginPanel country="ET" title="Ethiopia Staging Roles" onSelectAccount={vi.fn()} />);

        // Query site headings in rendered order
        const siteNames = screen.getAllByText(/Addis Ababa Regional HQ|Addis Ababa DC|Bole Flagship Store/).map(el => el.textContent);

        expect(siteNames[0]).toBe('Addis Ababa Regional HQ');
        expect(siteNames[1]).toBe('Addis Ababa DC');
        expect(siteNames[2]).toBe('Bole Flagship Store');
    });

    it('organizes employees inside each work location by ranking (L6 Store Manager before L7 Supervisor before L9 Cashier)', () => {
        render(<CountryQuickLoginPanel country="ET" title="Ethiopia Staging Roles" onSelectAccount={vi.fn()} />);

        // Look at the cards inside Bole Flagship Store
        const storeEmployees = screen.getAllByText(/Tewodros Assefa|Girma Bekele|Eden Haile/).map(el => el.textContent);

        expect(storeEmployees).toEqual([
            'Tewodros Assefa', // Level 6
            'Girma Bekele',    // Level 7
            'Eden Haile'       // Level 9
        ]);
    });

    it('selects account correctly when clicked', () => {
        const select = vi.fn();
        render(<CountryQuickLoginPanel country="ET" title="Ethiopia Staging Roles" onSelectAccount={select} />);

        const accountButton = screen.getByText('Tewodros Assefa').closest('button')!;
        fireEvent.click(accountButton);

        expect(select).toHaveBeenCalledWith('tewodros.assefa@staging.siifmart.com');
    });
});
