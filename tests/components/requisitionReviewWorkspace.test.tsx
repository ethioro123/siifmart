// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const { review, row } = vi.hoisted(() => ({ review: vi.fn(), row: { id: 'r1', title: 'Coffee replenishment', request_number: 'PR-1', requester_name: 'Cashier', requester_employee_id: 'cashier', created_at: '2026-10-30', status: 'Submitted', business_reason: 'Shelf replenishment', items: [{ product_name: 'Coffee', sku: 'ET-C', quantity: 5 }], estimated_total: 500, currency: 'ETB' } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', role: 'buyer' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site', name: 'Store' } }) }));
vi.mock('../../hooks/useRequisitionReviewWorkspace', () => ({ useRequisitionReviewWorkspace: () => ({ list: { data: [row] }, detail: { data: row }, decision: { reset: vi.fn(), mutateAsync: review } }) }));
import { RequisitionReviewWorkspace } from '../../components/approvals/RequisitionReviewWorkspace';
afterEach(() => { cleanup(); row.requester_employee_id = 'cashier'; review.mockReset(); });
describe('purchase request review workspace', () => {
  it('requires a reason to reject and shows item evidence', async () => {
    review.mockResolvedValue({ request_number: 'PR-1', status: 'Rejected' });
    render(<RequisitionReviewWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Open purchase requests' }));
    fireEvent.click(screen.getByRole('button', { name: /Coffee replenishment/ }));
    expect(screen.getByText('Coffee')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Reject purchase request' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Decision reason'), { target: { value: 'Duplicate request' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject purchase request' }));
    expect(review).toHaveBeenCalledWith({ decision: 'Rejected', reason: 'Duplicate request' });
    await screen.findByText('PR-1: rejected.');
  });
  it('does not offer a decision on the reviewers own request', () => {
    row.requester_employee_id = 'reviewer';
    render(<RequisitionReviewWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Open purchase requests' }));
    fireEvent.click(screen.getByRole('button', { name: /Coffee replenishment/ }));
    expect(screen.getByText('You cannot review your own request.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Approve purchase request' })).toBeNull();
  });
});
