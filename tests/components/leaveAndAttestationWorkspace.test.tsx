// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const { decision, row } = vi.hoisted(() => ({ decision: vi.fn().mockResolvedValue(undefined), row: { id: 'l', employee_id: 'maker', employee_name: 'Employee', requested_by: 'maker', leave_type: 'Annual Leave', start_date: '2026-11-01', end_date: '2026-11-02', days: 2, reason: 'Annual leave' } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', name: 'Reviewer', role: 'store_manager' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site' } }) }));
vi.mock('../../hooks/useLeaveAndAttestationReview', () => ({ useLeaveAndAttestationReview: () => ({ list: { data: { kind: 'leave', rows: [row] } }, decision: { mutateAsync: decision, reset: vi.fn() } }) }));
import { LeaveAndAttestationWorkspace } from '../../components/approvals/LeaveAndAttestationWorkspace';
afterEach(() => { cleanup(); decision.mockClear(); row.employee_id = 'maker'; });
describe('leave reviews', () => {
 it('requires a rejection reason and confirms a saved decision', async () => {
  render(<LeaveAndAttestationWorkspace queues={[{ key: 'leave', status: 'ready', count: 1 }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open leave requests' })); fireEvent.click(screen.getByRole('button', { name: 'Employee' }));
  expect((screen.getByRole('button', { name: 'Reject leave' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Review notes'), { target: { value: 'Coverage unavailable' } }); fireEvent.click(screen.getByRole('button', { name: 'Reject leave' }));
  expect(decision).toHaveBeenCalledWith({ id: 'l', reject: true, reason: 'Coverage unavailable' }); await screen.findByText('Decision saved.');
 });
 it('blocks review of the reviewers own leave', () => {
  row.employee_id = 'reviewer'; render(<LeaveAndAttestationWorkspace queues={[{ key: 'leave', status: 'ready', count: 1 }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open leave requests' })); fireEvent.click(screen.getByRole('button', { name: 'Employee' }));
  expect(screen.getByText('An independent reviewer is required.')).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Approve leave' })).toBeNull();
 });
});
