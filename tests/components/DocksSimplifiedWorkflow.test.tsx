// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { PurchaseOrder, WMSJob } from '../../types';
import { DocksInboundView } from '../../components/fulfillment/docks/DocksInboundView';
import { OutboundDockCard } from '../../components/fulfillment/docks/components/OutboundDockCard';
import { isInboundPurchaseOrder } from '../../utils/shipmentWorkflow';
vi.mock('../../components/fulfillment/docks/DocksHistory', () => ({ DocksHistory: () => <div>History</div> }));
afterEach(cleanup);
const po = { id: 'po-1', poNumber: 'PO-1', siteId: 'wh', status: 'Approved', supplierName: 'Supplier', itemsCount: 1 } as PurchaseOrder;
const shipment: WMSJob = { id: 'shipment-1', type: 'DISPATCH', priority: 'Normal', status: 'Pending', transferStatus: 'Packed', siteId: 'wh', location: 'Dispatch Bay', orderRef: 'transfer-1', items: 20, lineItems: [], assignedTo: '', deliveryMethod: 'Internal' };
describe('simplified dock workflows', () => {
 it('opens blind receiving without assigning a bay and never displays expected quantities', () => {
  const open = vi.fn(); const assign = vi.fn();
  render(<DocksInboundView orders={[po]} arrivals={[{ ...po, lineItems: [{ productName: 'Juice', quantity: 98765 }] } as PurchaseOrder]} assignDock={assign} openReceiving={open} busy={false} viewMode="Process" t={key => key} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open blind receiving' }));
  expect(open).toHaveBeenCalledTimes(1);
  expect(assign).not.toHaveBeenCalled();
  expect(screen.queryByText(/98765/)).toBeNull();
  expect(screen.queryByText('Expected Goods')).toBeNull();
  fireEvent.change(screen.getByRole('combobox', { name: 'Bay for PO-1' }), { target: { value: 'D2' } });
  expect(assign).toHaveBeenCalledWith('D2', expect.objectContaining({ id: 'po-1' }));
 });
 it('recognizes summary-only approved orders without reopening completed or foreign orders', () => {
  expect(isInboundPurchaseOrder(po, 'wh')).toBe(true);
  expect(isInboundPurchaseOrder({ ...po, status: 'Received' }, 'wh')).toBe(false);
  expect(isInboundPurchaseOrder(po, 'other')).toBe(false);
  expect(isInboundPurchaseOrder({ ...po, lineItems: [{ quantity: 10, receivedQty: 10 }] } as PurchaseOrder, 'wh')).toBe(false);
 });
 it('keeps dispatch release locked until the shipment is loaded and transport is assigned', () => {
  const action = vi.fn(); const props = { drivers: [], canManage: true, busy: false, onOpen: vi.fn(), onAction: action };
  const { rerender } = render(<OutboundDockCard {...props} dock="Staging" job={shipment} occupiedDocks={['Dock D2']} />);
  expect((screen.getByRole('button', { name: 'Release shipment' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('option', { name: 'D2' }) as HTMLOptionElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText(/Loading bay for/), { target: { value: 'D1' } });
  expect(action).toHaveBeenCalledWith(shipment, { type: 'load', dock: 'D1' });
  rerender(<OutboundDockCard {...props} dock="D1" job={{ ...shipment, location: 'Dock D1' }} />);
  expect((screen.getByRole('button', { name: 'Release shipment' }) as HTMLButtonElement).disabled).toBe(true);
  rerender(<OutboundDockCard {...props} dock="D1" job={{ ...shipment, location: 'Dock D1', assignedTo: 'driver-1' }} />);
  expect((screen.getByRole('button', { name: 'Release shipment' }) as HTMLButtonElement).disabled).toBe(false);
 });
});
