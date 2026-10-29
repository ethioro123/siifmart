// @vitest-environment jsdom
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const { state } = vi.hoisted(() => ({ state: { country: 'ET' } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', role: 'country_managing_director' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: state.country, activeSite: { id: 'site' } }) }));
vi.mock('../../components/employees/SalaryApprovalQueueModal', () => ({ default: ({ onClose, onRequestsUpdated }: { onClose: () => void; onRequestsUpdated: () => void }) => <div role="dialog" aria-label="Salary review"><button onClick={onRequestsUpdated}>Record salary decision</button><button onClick={onClose}>Close salary review</button></div> }));
vi.mock('../../components/employees/modals/HeadcountQuotaApprovalModal', () => ({ HeadcountQuotaApprovalModal: () => <div>Headcount review</div> }));
vi.mock('../../components/employees/modals/EmployeeChangeApprovalModal', () => ({ EmployeeChangeApprovalModal: () => <div>Profile review</div> }));
import { PeopleReviewWorkspace } from '../../components/approvals/PeopleReviewWorkspace';
afterEach(() => { cleanup(); state.country = 'ET'; });
describe('people reviews in Approvals', () => {
  it('opens only an available queue and refreshes the inbox after decisions', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(<QueryClientProvider client={client}><PeopleReviewWorkspace queues={[{ key: 'salary', status: 'ready', count: 2 }, { key: 'headcount', status: 'unavailable', count: null }]} /></QueryClientProvider>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Review headcount requests' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Review salary changes' }));
    await screen.findByRole('dialog', { name: 'Salary review' });
    fireEvent.click(screen.getByRole('button', { name: 'Record salary decision' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['unified-approval-inbox', 'reviewer'] });
    fireEvent.click(screen.getByRole('button', { name: 'Close salary review' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('clears the open review when country changes', async () => {
    const client = new QueryClient();
    const queues = [{ key: 'salary', status: 'ready' as const, count: 1 }];
    const view = render(<QueryClientProvider client={client}><PeopleReviewWorkspace queues={queues} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Review salary changes' }));
    await screen.findByRole('dialog', { name: 'Salary review' });
    state.country = 'KE';
    view.rerender(<QueryClientProvider client={client}><PeopleReviewWorkspace queues={queues} /></QueryClientProvider>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
