// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditRegionModal } from '../../components/settings/regions/EditRegionModal';
import type { Region, Site } from '../../types';
import type { RegionalAdminEmployee } from '../../types/regionalAdministration';
const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock('../../hooks/useRegionMutations', () => ({ useUpdateRegionMutation: () => ({ mutateAsync }) }));
afterEach(cleanup);
it('preserves zero limits and offers only valid manager and hub assignments', async () => {
    mutateAsync.mockResolvedValue({ success: true });
    const region = { code: 'ADD', name: 'Addis', country: 'ET', status: 'active', admin_hub_site_id: 'own-hub', autonomous_expense_limit: 0, autonomous_po_limit: 0 } as Region;
    const regions = [region, { code: 'ADA', admin_hub_site_id: 'other-hub' } as Region];
    const sites = [
        { id: 'own-hub', code: 'ADD', name: 'Own hub', type: 'Administration', country: 'ET', region_code: 'ADD', status: 'Active' },
        { id: 'other-hub', code: 'ADA', name: 'Other hub', type: 'Administration', country: 'ET', region_code: 'ADA', status: 'Active' },
        { id: 'hq', code: 'ET-HQ', name: 'Country headquarters', type: 'Administration', country: 'ET', status: 'Active' }
    ] as Site[];
    const employees = ['ADD', 'ADA'].map(code => ({ id: code, name: `Manager ${code}`, role: 'regional_operations_manager', status: 'Active', country: 'ET', region_code: code })) as RegionalAdminEmployee[];
    render(<EditRegionModal isOpen onClose={vi.fn()} onUpdated={vi.fn()} region={region} regions={regions} sites={sites} employees={employees} addNotification={vi.fn()} />);
    const manager = screen.getByLabelText('Regional Operations Manager') as HTMLSelectElement;
    expect(Array.from(manager.options).map(option => option.value)).toEqual(['', 'ADD']);
    const hub = screen.getByLabelText('Administrative hub site') as HTMLSelectElement;
    expect(Array.from(hub.options).map(option => option.value)).toEqual(['', 'own-hub']);
    expect((screen.getByLabelText('Autonomous expense limit') as HTMLInputElement).value).toBe('0');
    expect(screen.getByRole('button', { name: /Other hub/ })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByPlaceholderText('Record why these settings are changing'), { target: { value: 'Keep zero approval authority' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ code: 'ADD', updates: expect.objectContaining({ autonomous_expense_limit: 0, autonomous_po_limit: 0 }) })));
});
