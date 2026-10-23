// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
const state = vi.hoisted(() => ({ role: 'country_finance_director', detail: { data: null, isPending: false, isError: false }, queue: { data: { data: [{ id: 'po-1', po_number: 'PO-1', supplier_name: 'Supplier', total_amount: 200, regional_limit: 100, currency: 'ETB', status: 'Pending', region_code: 'ET-ADD' }], count: 1 }, isPending: false, isError: false, isFetching: false, refetch: vi.fn() } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: state.role, name: 'Finance Officer' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET' }) }));
const review = vi.fn((..._args: unknown[]) => ({ queue: state.queue, detail: state.detail }));
vi.mock('../../hooks/usePOFinanceReview', () => ({ usePOFinanceReview: (...args: unknown[]) => { review(...args); return { queue: state.queue, detail: state.detail }; } }));
vi.mock('../../components/procurement/ViewPOModal', () => ({ ViewPOModal: () => <div>PO inspector</div> }));
import POFinanceApprovalsTab from '../../components/financials/POFinanceApprovalsTab';
afterEach(() => { cleanup(); state.role = 'country_finance_director'; vi.clearAllMocks(); });
describe('HQ finance PO queue', () => {
 it('shows over-limit orders and loads details only when selected', () => {
  render(<POFinanceApprovalsTab />);
  expect(screen.getByText('1 awaiting finance clearance')).toBeTruthy();
  expect(screen.getByText(/Regional limit: ETB 100/)).toBeTruthy();
  expect(review).toHaveBeenLastCalledWith(1, null);
  fireEvent.click(screen.getByRole('button', { name: 'Review PO' }));
  expect(review).toHaveBeenLastCalledWith(1, 'po-1');
 });
 it('does not expose the approval workbench to regional finance staff', () => {
  state.role = 'regional_finance_manager';
  const { container } = render(<POFinanceApprovalsTab />);
  expect(container.textContent).toBe('');
 });
});
