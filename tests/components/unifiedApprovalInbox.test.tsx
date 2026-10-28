// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UnifiedApprovalInbox } from '../../types/unifiedApprovalInbox';

const { query } = vi.hoisted(() => ({
  query: {
    enabled: true,
    isLoading: false,
    isError: false,
    isFetching: false,
    data: undefined as UnifiedApprovalInbox | undefined,
    refetch: vi.fn()
  }
}));

vi.mock('../../hooks/useApprovalInbox', () => ({ useApprovalInbox: () => query }));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: { count: number }) => {
      const labels: Record<string, string> = {
        pending: `${params?.count} approval tasks awaiting your review`,
        unavailable: 'Approval inbox unavailable. Open it to retry.',
        checking: 'Checking requests that need your approval…',
        title: 'Approvals',
        yourApprovals: 'Your approvals',
        partial: 'Some queues could not be checked.',
        open: 'Open approval inbox'
      };
      return labels[key.split('.').pop() || ''] || key;
    }
  })
}));

import Approvals from '../../pages/Approvals';
import { ApprovalInboxButton } from '../../components/approvals/ApprovalInboxButton';
import { ApprovalInboxNotice } from '../../components/approvals/ApprovalInboxNotice';

const inbox = (): UnifiedApprovalInbox => ({
  total: 7,
  unavailable: 1,
  checkedAt: '2026-10-28T10:00:00Z',
  queues: [
    { key: 'purchase_orders', count: 2, status: 'ready' },
    { key: 'po_finance', count: 1, status: 'ready' },
    { key: 'headcount', count: 1, status: 'ready' },
    { key: 'transfers', count: 2, status: 'ready' },
    { key: 'expenses', count: 1, status: 'ready' },
    { key: 'leave', count: null, status: 'unavailable' }
  ]
});

beforeEach(() => {
  Object.assign(query, {
    enabled: true,
    isLoading: false,
    isError: false,
    isFetching: false,
    data: inbox()
  });
  query.refetch.mockReset();
});

afterEach(cleanup);

const show = (element: React.ReactNode) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('cross-department approval inbox', () => {
  it('shows all four requested areas with working destinations', () => {
    show(<Approvals />);
    for (const [name, href] of [
      ['Purchase orders', '/procurement?tab=orders'],
      ['Headcount requests', '/employees?approval=headcount'],
      ['Transfer picking release', '/wms-ops?tab=TRANSFER'],
      ['Expense approvals', '/finance?tab=expenses']
    ]) {
      expect(screen.getByRole('link', { name: 'Review ' + name }).getAttribute('href')).toBe(href);
    }
    expect(screen.getByText(/7\+ approval tasks/)).toBeTruthy();
  });

  it('flags unavailable workflows without claiming they have zero pending items', () => {
    show(<Approvals />);
    expect(screen.getByRole('alert').textContent).toContain('available queues only');
    expect(screen.queryByRole('link', { name: 'Review Leave requests' })).toBeNull();
    expect(screen.getByText(/Pending count could not be verified/)).toBeTruthy();
  });

  it('hides cached totals and offers retry after a refresh failure', () => {
    query.isError = true;
    show(<Approvals />);
    expect(screen.queryByText(/7\+ approval tasks/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Review Purchase orders' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(query.refetch).toHaveBeenCalledOnce();
  });

  it('never renders a stale cached number in the global header on errors', () => {
    query.isError = true;
    show(<ApprovalInboxButton />);
    expect(screen.getByText('!')).toBeTruthy();
    expect(screen.queryByText('7+')).toBeNull();
  });

  it('shows a partial-count badge linking to the shared inbox', () => {
    show(<ApprovalInboxButton />);
    expect(screen.getByText('7+')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/approvals');
  });

  it('shows checking instead of zero before loading finishes', () => {
    query.data = undefined;
    query.isLoading = true;
    show(<ApprovalInboxNotice />);
    expect(screen.getByRole('status').textContent).toContain('Checking');
  });

  it('makes pending work visible on page entry', () => {
    show(<ApprovalInboxNotice />);
    expect(screen.getByRole('status').textContent).toContain('7 approval tasks');
    expect(screen.getByRole('link', { name: 'Open approval inbox' }).getAttribute('href')).toBe('/approvals');
  });

  it('hides controls for non-reviewers', () => {
    query.enabled = false;
    show(
      <>
        <ApprovalInboxButton />
        <ApprovalInboxNotice />
      </>
    );
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders visual badges distinguishing specialist clearances from final line approvals', () => {
    show(<Approvals />);
    const specialistBadge = screen.getByTestId('badge-po_finance');
    expect(specialistBadge.textContent).toContain('Finance Clearance Required');

    const lineApprovalBadge = screen.getByTestId('badge-purchase_orders');
    expect(lineApprovalBadge.textContent).toContain('Final Line Approval');
  });

  it('filters queue items by Specialist Clearance and Final Line Approval tabs', () => {
    show(<Approvals />);
    expect(screen.getByRole('link', { name: 'Review Purchase orders' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Review PO finance clearance' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Specialist Clearances/ }));
    expect(screen.getByRole('link', { name: 'Review PO finance clearance' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Review Purchase orders' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Final Line Approvals/ }));
    expect(screen.getByRole('link', { name: 'Review Purchase orders' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Review PO finance clearance' })).toBeNull();
  });
});
