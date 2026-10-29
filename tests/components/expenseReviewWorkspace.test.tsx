// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
const { mutate, expense } = vi.hoisted(() => ({ mutate: vi.fn(), expense: { id: 'e1', description: 'Coffee delivery', amount: 500, date: '2026-10-30', status: 'Pending', category: 'Logistics', createdById: 'maker', createdByName: 'Maker' } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', name: 'Reviewer', role: 'country_finance_director' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site', name: 'Store' } }) }));
vi.mock('../../hooks/useExpenseReviewWorkspace', () => ({ useExpenseReviewWorkspace: () => ({ list: { data: { data: [expense], count: 1 }, refetch: vi.fn() }, decision: { reset: vi.fn(), mutateAsync: mutate } }) }));
import { ExpenseReviewWorkspace } from '../../components/approvals/ExpenseReviewWorkspace';
afterEach(() => { cleanup(); expense.createdById = 'maker'; mutate.mockReset(); });
describe('expense review workspace', () => {
 it('requires a decision reason and waits for confirmation', async () => {
  mutate.mockResolvedValue({ status: 'Approved' }); render(<ExpenseReviewWorkspace />);
  fireEvent.click(screen.getByRole('button', { name: 'Open expense reviews' }));
  fireEvent.click(screen.getByRole('button', { name: /Coffee delivery/ }));
  expect((screen.getByRole('button', { name: 'Approve expense' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Expense decision reason'), { target: { value: 'Invoice checked' } });
  fireEvent.click(screen.getByRole('button', { name: 'Approve expense' }));
  expect(mutate).toHaveBeenCalledWith({ id: 'e1', action: 'approve', reason: 'Invoice checked' });
  await screen.findByText('Expense approved.');
 });
 it('does not offer self-approval', () => {
  expense.createdById = 'reviewer'; render(<ExpenseReviewWorkspace />);
  fireEvent.click(screen.getByRole('button', { name: 'Open expense reviews' })); fireEvent.click(screen.getByRole('button', { name: /Coffee delivery/ }));
  expect(screen.getByText('You cannot review your own expense.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Approve expense' })).toBeNull();
 });
});
