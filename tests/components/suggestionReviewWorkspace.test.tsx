// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
const { save, row } = vi.hoisted(() => ({ save: vi.fn(), row: { id: 's', product_name: 'Coffee', submitter_employee_id: 'maker', created_at: '2026-10-30', status: 'Submitted', category: 'Grocery', demand_signal: 'Customer requests', customer_request_count: 3 } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', role: 'buyer' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site' } }) }));
vi.mock('../../hooks/useSuggestionReviewWorkspace', () => ({ useSuggestionReviewWorkspace: () => ({ list: { data: [row] }, decision: { mutateAsync: save, reset: vi.fn() } }) }));
import SuggestionReviewWorkspace from '../../components/approvals/SuggestionReviewWorkspace';
afterEach(() => { cleanup(); save.mockReset(); row.submitter_employee_id = 'maker'; });
describe('sourcing suggestion review', () => {
 it('requires a reason for decline and confirms server results', async () => {
  save.mockResolvedValue({ status: 'Declined' }); render(<SuggestionReviewWorkspace />);
  fireEvent.click(screen.getByRole('button', { name: /Coffee/ }));
  fireEvent.change(screen.getByLabelText('Decision'), { target: { value: 'Declined' } });
  expect((screen.getByRole('button', { name: 'Save sourcing decision' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Decision note'), { target: { value: 'Supplier unavailable' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save sourcing decision' }));
  expect(save).toHaveBeenCalledWith({ id: 's', status: 'Declined', note: 'Supplier unavailable' }); await screen.findByText('Suggestion: Declined.');
 });
 it('hides decisions on the reviewers own suggestion', () => {
  row.submitter_employee_id = 'reviewer'; render(<SuggestionReviewWorkspace />); fireEvent.click(screen.getByRole('button', { name: /Coffee/ }));
  expect(screen.getByText('An independent reviewer is required.')).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Save sourcing decision' })).toBeNull();
 });
});
