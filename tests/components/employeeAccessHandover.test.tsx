// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Employee } from '../../types';
const { prepare, complete, notify } = vi.hoisted(() => ({ prepare: vi.fn(), complete: vi.fn(), notify: vi.fn() }));
vi.mock('../../services/employee-access.service', () => ({ employeeAccessService: { prepare, complete } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'manager', role: 'store_manager' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'KE', activeSite: { id: 'store' }, sites: [], addNotification: notify }) }));
vi.mock('../../components/Modal', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import { CredentialHandoverModal } from '../../components/employees/CredentialHandoverModal';
const employee = { id: 'staff', code: 'KE-SIIF0099', name: 'Staff Member', role: 'cashier', status: 'Active', siteId: 'store', email: 'staff@example.invalid' } as Employee;
afterEach(cleanup); beforeEach(() => vi.clearAllMocks());
function mount() {
    const client = new QueryClient(); const done = vi.fn(), close = vi.fn();
    const result = render(<QueryClientProvider client={client}><CredentialHandoverModal employee={employee} isOpen onClose={close} onHandoverComplete={done} /></QueryClientProvider>);
    return { ...result, client, done, close };
}
describe('verified employee access handover', () => {
    it('requires verified access and preserves the dialog when completion fails', async () => {
        prepare.mockResolvedValue({ employeeId: 'staff', email: employee.email, accountStatus: 'existing' });
        complete.mockRejectedValue(new Error('Handover was not saved. Try again.'));
        const { done, close } = mount();
        expect((screen.getByRole('button', { name: 'Confirm access handover' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'Prepare login access' }));
        await screen.findByText(/Existing login account verified/);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm access handover' }));
        await screen.findByRole('alert');
        expect(done).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
        expect(notify).not.toHaveBeenCalledWith('success', expect.anything());
    });
    it('keeps generated credentials outside mutation caches and confirms only a saved handover', async () => {
        const temporaryPassword = `transient-${crypto.randomUUID()}`;
        prepare.mockResolvedValue({ employeeId: 'staff', email: employee.email, accountStatus: 'created', temporaryPassword });
        complete.mockResolvedValue('2026-10-30T10:00:00Z');
        const { client, done, close } = mount();
        fireEvent.click(screen.getByRole('button', { name: 'Prepare login access' }));
        await screen.findByText(/New account created/);
        expect(screen.queryByText(temporaryPassword)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Show temporary password' }));
        expect(screen.getByText(temporaryPassword)).toBeTruthy();
        expect(client.getMutationCache().getAll().every(mutation => mutation.state.data === undefined)).toBe(true);
        expect(localStorage.getItem('siifmart_temp_pwd_staff')).toBeNull();
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirm access handover' })); });
        expect(done).toHaveBeenCalledWith('staff'); expect(close).toHaveBeenCalledOnce();
        expect(notify).toHaveBeenCalledWith('success', 'Access handover saved for Staff Member.');
    });
});
