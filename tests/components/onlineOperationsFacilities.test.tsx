// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OnlineStoreManagement from '../../pages/OnlineStoreManagement';

const mocks = vi.hoisted(() => ({ management: vi.fn() }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'manager-1', role: 'warehouse_manager' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({
  activeSite: { id: 'wh-et', country: 'ET', type: 'Warehouse' },
  sites: [
    { id: 'wh-et', name: 'ET Warehouse', type: 'Warehouse', status: 'Active', country: 'ET' },
    { id: 'dc-et', name: 'ET Distribution Center', type: 'Distribution Center', status: 'Active', country: 'ET' },
    { id: 'retail', name: 'Retail Store', type: 'Store', status: 'Active', country: 'ET' },
    { id: 'legacy', name: 'Legacy Online Site', type: 'Dark Store', status: 'Active', country: 'ET' },
    { id: 'wh-ke', name: 'KE Warehouse', type: 'Warehouse', status: 'Active', country: 'KE' },
    { id: 'closed', name: 'Closed Warehouse', type: 'Warehouse', status: 'Closed', country: 'ET' },
  ],
}) }));
vi.mock('../../hooks/useOnlineStoreManagement', () => ({ useOnlineStoreManagement: (...args: unknown[]) => {
  mocks.management(...args);
  return { data: { products: [], orders: [], items: [], jobs: [] }, isPending: false, isFetching: false,
    refetch: vi.fn(), intakeMutation: { isPending: false }, orderMutation: { isPending: false } };
} }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('online operations facilities', () => {
  it('offers active warehouses and DCs within the current country', () => {
    render(<OnlineStoreManagement />);
    const selector = screen.getByRole('combobox', { name: /Fulfillment facility/ });
    expect(Array.from(selector.querySelectorAll('option')).map(option => option.textContent))
      .toEqual(['ET Warehouse', 'ET Distribution Center']);
    fireEvent.change(selector, { target: { value: 'dc-et' } });
    expect(mocks.management).toHaveBeenLastCalledWith('dc-et', true, 'ET', 'manager-1');
  });

  it('clears the order draft when its fulfillment facility changes', () => {
    render(<OnlineStoreManagement />);
    const customer = screen.getByRole('textbox', { name: 'Customer name' }) as HTMLInputElement;
    fireEvent.change(customer, { target: { value: 'Draft customer' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Fulfillment facility/ }), { target: { value: 'dc-et' } });
    expect(customer.value).toBe('');
  });
});
