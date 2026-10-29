// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const { observed } = vi.hoisted(() => ({ observed: vi.fn() }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer', role: 'regional_procurement_manager' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site', name: 'Store' }, sites: [], regions: [] }) }));
vi.mock('../../hooks/usePurchaseOrderReviewWorkspace', () => ({ usePurchaseOrderReviewWorkspace: (...args: unknown[]) => { observed(...args); return {
 list: { data: { data: [{ id: 'po1', poNumber: 'PO-1', supplierName: 'Coffee supplier', totalAmount: 1000, currency: 'ETB' }], count: 1 } }, detail: { data: { id: 'po1' } }, refresh: vi.fn()
}; } }));
vi.mock('../../utils/poApprovalPolicy', () => ({ getPoApprovalPolicy: () => ({ statusMessage: 'Awaiting review' }) }));
vi.mock('../../utils/jobIdFormatter', () => ({ formatPONumber: () => 'PO-1' }));
vi.mock('../../components/procurement/ViewPOModal', () => ({ ViewPOModal: ({ reviewOnly }: { reviewOnly: boolean }) => <div>{reviewOnly ? 'Review inspector' : 'Editable inspector'}</div> }));
vi.mock('../../components/financials/POFinanceApprovalsTab', () => ({ default: () => <div>Finance queue</div> }));
import { PurchaseOrderReviewWorkspace } from '../../components/approvals/PurchaseOrderReviewWorkspace';
afterEach(() => { cleanup(); observed.mockClear(); });
describe('purchase order review workspace', () => {
 it('loads the queue only after opening and selects order evidence on demand', () => {
  render(<MemoryRouter><PurchaseOrderReviewWorkspace /></MemoryRouter>);
  expect(observed.mock.lastCall?.[3]).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Open purchase orders' }));
  expect(observed.mock.lastCall?.[3]).toBe(true);
  expect(observed.mock.lastCall?.[2]).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Review purchase order PO-1' }));
  expect(observed.mock.lastCall?.[2]).toBe('po1');
  expect(screen.getByText('Review inspector')).toBeTruthy();
  expect(screen.queryByText('Finance queue')).toBeNull();
 });
});
