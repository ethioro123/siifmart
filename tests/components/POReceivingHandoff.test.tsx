// @vitest-environment jsdom
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ role: 'warehouse_manager', siteId: 'dc-1' }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: state }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ sites: [{ id: 'dc-1', name: 'Addis DC', code: 'ET-ADD-DC-01' }], activeSite: { id: 'dc-1' } }) }));
import { POReceivingHandoff } from '../../components/procurement/POReceivingHandoff';
import type { PurchaseOrder } from '../../types';
afterEach(() => { cleanup(); state.role = 'warehouse_manager'; state.siteId = 'dc-1'; });
const po = { siteId: 'dc-1', status: 'Approved' } as PurchaseOrder;
describe('PO receiving handoff', () => {
 it('names the destination and links authorized destination staff to receiving', () => {
  render(<MemoryRouter><POReceivingHandoff po={po} /></MemoryRouter>);
  expect(screen.getByText(/Receive at Addis DC/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Open Receiving' }).getAttribute('href')).toBe('/wms-ops?tab=RECEIVE');
 });
 it('does not direct unapproved orders or staff at another site into receiving', () => {
  const { rerender } = render(<MemoryRouter><POReceivingHandoff po={{ ...po, status: 'Pending' }} /></MemoryRouter>);
  expect(screen.queryByRole('region')).toBeNull();
  state.siteId = 'other-site';
  rerender(<MemoryRouter><POReceivingHandoff po={po} /></MemoryRouter>);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByText(/destination facility’s warehouse manager/)).toBeTruthy();
 });
});
