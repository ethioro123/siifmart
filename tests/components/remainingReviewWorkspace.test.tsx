// @vitest-environment jsdom
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'r', role: 'country_managing_director' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 's' } }) }));
vi.mock('../../components/approvals/FinanceReviewAdapter', () => ({ default: ({ mode }: { mode: string }) => <div>Finance workspace {mode}</div> }));
vi.mock('../../components/employees/recruitment/RecruitmentPipelineTab', () => ({ default: ({ reviewOnly }: { reviewOnly: boolean }) => <div>{reviewOnly ? 'Recruitment review' : 'Recruitment creation'}</div> }));
import { RemainingReviewWorkspace } from '../../components/approvals/RemainingReviewWorkspace';
afterEach(cleanup);
describe('specialist approval adapters', () => {
 it('loads one available review at a time without mounting it on entry', async () => {
  render(<QueryClientProvider client={new QueryClient()}><RemainingReviewWorkspace queues={[{ key: 'candidate_hr', status: 'ready', count: 1 }, { key: 'payroll_hr', status: 'ready', count: 1 }]} /></QueryClientProvider>);
  expect(screen.queryByText('Recruitment review')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Margin exceptions' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Recruitment and candidate clearances' }));
  await screen.findByText('Recruitment review');
  fireEvent.click(screen.getByRole('button', { name: 'Payroll certification and finance sign-off' }));
  await screen.findByText('Finance workspace payroll');
  expect(screen.queryByText('Recruitment review')).toBeNull();
 });
});
