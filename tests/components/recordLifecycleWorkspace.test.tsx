// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { LifecycleRequest } from '../../types/recordLifecycle';
const mock = vi.hoisted(() => ({ actor: 'reviewer', role: 'regional_hr_manager', error: false, request: vi.fn(), decision: vi.fn(), workspace: vi.fn(), targets: vi.fn(), events: vi.fn(), rows: [] as LifecycleRequest[] }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: mock.actor, name: 'Signed-in employee', role: mock.role } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET' }) }));
vi.mock('../../hooks/useRecordLifecycle', () => ({
  useRecordLifecycle: (...args: unknown[]) => { mock.workspace(...args); return {
    list: { data: mock.error ? undefined : { rows: mock.rows, count: mock.rows.length }, isPending: false, isFetching: false, isError: mock.error, refetch: vi.fn() },
    request: { mutateAsync: mock.request, reset: vi.fn(), isPending: false, isError: false },
    decide: { mutateAsync: mock.decision, reset: vi.fn(), isPending: false, isError: false }
  }; },
  useLifecycleTargets: (...args: unknown[]) => { mock.targets(...args); return { data: [], isPending: false, isError: false, isFetching: false }; },
  useLifecycleEvents: (...args: unknown[]) => { mock.events(...args); return { data: [], isPending: false, isError: false }; }
}));
import { RecordLifecycleWorkspace } from '../../components/approvals/RecordLifecycleWorkspace';
const row: LifecycleRequest = {
  id: 'request-1', kind: 'employee', target_id: 'employee-1', target_label: 'Employee offboarding fixture', site_id: 'site-1', country_code: 'ET', region_code: 'ADD',
  reason: 'Employment contract completed', evidence: { assets_returned: true }, original_state: { role: 'cashier', status: 'Active' }, status: 'Pending',
  requested_by: 'requester', requester_name: 'Requesting manager', requester_role: 'store_manager', requested_at: '2026-11-03T10:00:00Z',
  operations_reviewer: null, finance_reviewer: null, reviewed_by: null, reviewed_at: null, decision_reason: null, applied_at: null
};
const open = () => { render(<MemoryRouter><RecordLifecycleWorkspace /></MemoryRouter>); fireEvent.click(screen.getByRole('button', { name: 'Open lifecycle workspace' })); };
beforeEach(() => { vi.clearAllMocks(); mock.actor = 'reviewer'; mock.role = 'regional_hr_manager'; mock.error = false; mock.rows = [{ ...row }]; mock.decision.mockResolvedValue({ request_id: row.id, status: 'Applied' }); });
afterEach(cleanup);
describe('record lifecycle workspace', () => {
  it('does not mount domain queries before the workspace is deliberately opened', () => {
    render(<MemoryRouter><RecordLifecycleWorkspace /></MemoryRouter>);
    expect(mock.workspace).not.toHaveBeenCalled();
    expect(mock.targets).not.toHaveBeenCalled();
    expect(mock.events).not.toHaveBeenCalled();
  });
  it('prevents requester approval and provides withdrawal with a mandatory reason', () => {
    mock.actor = 'requester'; open();
    fireEvent.click(screen.getByRole('button', { name: /Employee offboarding fixture/ }));
    expect(screen.queryByRole('button', { name: 'Approve and apply' })).toBeNull();
    const withdraw = screen.getByRole('button', { name: 'Withdraw request' }) as HTMLButtonElement;
    expect(withdraw.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Decision or withdrawal reason'), { target: { value: 'Correct the supporting evidence before review' } });
    expect(withdraw.disabled).toBe(false);
  });
  it('requires a reason and uses the selected record for an independent decision', async () => {
    open(); fireEvent.click(screen.getByRole('button', { name: /Employee offboarding fixture/ }));
    const approve = screen.getByRole('button', { name: 'Approve and apply' }) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Decision or withdrawal reason'), { target: { value: 'HR verified the independent handover evidence' } });
    fireEvent.click(approve);
    expect(mock.decision).toHaveBeenCalledWith({ id: row.id, decision: 'approve', reason: 'HR verified the independent handover evidence' });
    await screen.findByText('Request applied.');
  });
  it('does not represent a failed list as an empty queue', () => {
    mock.error = true; open();
    expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
    expect(screen.queryByText('No requests on this page.')).toBeNull();
  });
  it('loads audit events only after they are explicitly requested', () => {
    open(); fireEvent.click(screen.getByRole('button', { name: /Employee offboarding fixture/ }));
    expect(mock.events.mock.calls.at(-1)?.[3]).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Load audit history' }));
    expect(mock.events.mock.calls.at(-1)?.[3]).toBe(true);
  });
  it('does not expose review buttons to an unrelated department', () => {
    mock.role = 'regional_procurement_manager'; open(); fireEvent.click(screen.getByRole('button', { name: /Employee offboarding fixture/ }));
    expect(screen.queryByRole('button', { name: 'Approve and apply' })).toBeNull();
    expect(screen.getByText('Awaiting the designated independent department reviewer.')).toBeTruthy();
  });
});
