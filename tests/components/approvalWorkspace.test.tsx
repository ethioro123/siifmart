// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const { mutate } = vi.hoisted(() => ({ mutate: vi.fn().mockResolvedValue({ applied: true }) }));
vi.mock('../../hooks/useApprovalWorkspace', () => ({ useApprovalWorkspace: () => ({
  site: 'site', user: { id: 'manager', role: 'store_manager' },
  records: { data: { kind: 'barcode', data: [{ id: 'request', barcode: '123456789', createdBy: 'cashier', createdAt: '2026-10-30', product: { name: 'Coffee', sku: 'ET-COF' } }] }, refetch: vi.fn() },
  decision: { mutateAsync: mutate, reset: vi.fn(), isPending: false, isError: false }
}) }));
import { ApprovalWorkspace } from '../../components/approvals/ApprovalWorkspace';
afterEach(() => { cleanup(); mutate.mockClear(); });
describe('approval workspace', () => {
  it('loads evidence deliberately and requires a rejection reason', async () => {
    render(<MemoryRouter><ApprovalWorkspace /></MemoryRouter>);
    expect(screen.queryByLabelText('Request type')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open request workspace' }));
    fireEvent.change(screen.getByLabelText('Request type'), { target: { value: 'barcode' } });
    fireEvent.click(screen.getByRole('button', { name: /123456789/ }));
    expect(screen.getByText('Product: Coffee')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Reject' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'Wrong pack size' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(mutate).toHaveBeenCalledWith({ id: 'request', action: 'reject', reason: 'Wrong pack size' });
    await screen.findByText('Rejection saved.');
  });
});
