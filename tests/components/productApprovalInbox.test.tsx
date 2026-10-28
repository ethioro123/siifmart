// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ProductApprovalInbox } from '../../types/approvalInbox';
const { query } = vi.hoisted(() => ({ query: {
  enabled: true, isLoading: false, isError: false, isFetching: false, live: true,
  data: undefined as ProductApprovalInbox | undefined, dataUpdatedAt: 1, refetch: vi.fn()
} }));
vi.mock('../../hooks/useProductApprovalInbox', () => ({ useProductApprovalInbox: () => query }));
import { ProductApprovalInboxCard } from '../../components/approvals/ProductApprovalInboxCard';
import { ProductApprovalInboxButton } from '../../components/approvals/ProductApprovalInboxButton';
const inbox = (): ProductApprovalInbox => ({ total: 1, planogramCount: 1, priceCount: 0, productCount: 0,
  items: [{ id: 'layout-1', revisionId: 'layout-1', requestId: 'request-1', siteId: 'store-1', siteName: 'Store One',
    submittedAt: '2026-10-28T10:00:00Z', requester: 'Merchandising team', productCount: 2, kind: 'planogram', title: '2 shelf moves' }] });
beforeEach(() => { Object.assign(query, { enabled: true, isLoading: false, isError: false, isFetching: false, data: inbox() }); query.refetch.mockReset(); });
afterEach(cleanup);
const show = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);
describe('regional product approval alerts', () => {
  it('shows the grouped count immediately and links to the complete revision', () => {
    show(<ProductApprovalInboxCard />);
    expect(screen.getByText('1 request awaiting your review')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Review 2 shelf moves' }).getAttribute('href')).toBe('/pricing?tab=reviews&revisionId=layout-1');
  });
  it('does not present a cached count as current when the refresh fails', () => {
    query.isError = true; show(<ProductApprovalInboxCard />);
    expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
    expect(screen.queryByText('1 request awaiting your review')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh product approval inbox' }));
    expect(query.refetch).toHaveBeenCalledOnce();
  });
  it('shows a checking state before the first successful response', () => {
    query.data = undefined; query.isLoading = true; show(<ProductApprovalInboxCard />);
    expect(screen.getByRole('status').textContent).toContain('Checking');
    expect(screen.queryByText('0 requests awaiting your review')).toBeNull();
  });
  it('shows a genuine empty state after a successful zero count', () => {
    query.data = { total: 0, planogramCount: 0, priceCount: 0, productCount: 0, items: [] };
    show(<ProductApprovalInboxCard />);
    expect(screen.getByText('No product, price or shelf-layout requests are awaiting your vote.')).toBeTruthy();
  });
  it('keeps the header alert available outside the dashboard', () => {
    show(<ProductApprovalInboxButton />);
    expect(screen.getByRole('button', { name: '1 product approval request awaiting your review' })).toBeTruthy();
  });
  it('does not render approval controls for other roles', () => {
    query.enabled = false; show(<><ProductApprovalInboxCard /><ProductApprovalInboxButton /></>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });
});
