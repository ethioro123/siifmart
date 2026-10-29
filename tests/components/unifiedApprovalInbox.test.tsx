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

vi.mock('../../components/approvals/RequisitionReviewWorkspace', () => ({ RequisitionReviewWorkspace: () => null }));
vi.mock('../../components/approvals/ApprovalWorkspace', () => ({ ApprovalWorkspace: () => null }));
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
    expect(screen.getByRole('alert').textContent).toContain('verified queues');
    expect(screen.getByRole('link', { name: 'Review Leave requests' })).toBeTruthy();
    expect(screen.getByText('Count unavailable')).toBeTruthy();
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

  it('never renders notice when there are 0 approval tasks', () => {
    query.data = { total: 0, unavailable: 1, checkedAt: 'now', queues: [] };
    show(<ApprovalInboxNotice />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open approval inbox' })).toBeNull();
  });

  it('does not render notice on functional or operational pages', () => {
    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <ApprovalInboxNotice />
      </MemoryRouter>
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('allows reviewer to dismiss notice on dashboard', () => {
    show(<ApprovalInboxNotice />);
    expect(screen.getByRole('status')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('labels decision stages and filters their review destinations', () => {
    show(<Approvals />);
    expect(screen.getByRole('link', { name: 'Review Purchase orders' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Decision stage' }), { target: { value: 'specialist_clearance' } });
    expect(screen.getByRole('link', { name: 'Review PO finance clearance' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Review Purchase orders' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Decision stage' }), { target: { value: 'final_line_approval' } });
    expect(screen.getByRole('link', { name: 'Review Purchase orders' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Review PO finance clearance' })).toBeNull();
  });
  it('searches requests and hides empty queues until requested', () => {
    query.data!.queues.push({ key: 'salary', count: 0, status: 'ready' });
    show(<Approvals />);
    expect(screen.queryByRole('link', { name: 'Review Salary changes' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include empty queues' }));
    expect(screen.getByRole('link', { name: 'Review Salary changes' })).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search approval types' }), { target: { value: 'salary' } });
    expect(screen.queryByRole('link', { name: 'Review Purchase orders' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Review Salary changes' })).toBeTruthy();
  });
});
