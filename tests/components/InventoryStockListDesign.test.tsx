// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InventoryMobileList } from '../../components/inventory/components/InventoryMobileList';
import type { Product } from '../../types';
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: 'warehouse_manager' } }) }));
vi.mock('../../components/Protected', () => ({ Protected: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
afterEach(cleanup);
const product = { id:'p', siteId:'dc', name:'MoliCare Diaper', sku:'ETBB002', category:'Baby', stock:60, price:0, location:'A-01-02', minStock:10, unit:'UNIT', size:'16pcs' } as Product;
function setup(readOnly = false, row = product) {
 const view=vi.fn(), adjust=vi.fn(), select=vi.fn();
 render(<InventoryMobileList products={[row]} selectedIds={new Set()} setSelectedIds={vi.fn()} sites={[]} activeSite={null} isReadOnly={readOnly} totalInventoryValue={1} toggleSelection={select} handleOpenAdjust={adjust} handleOpenEditProduct={vi.fn()} handleDeleteProduct={vi.fn()} setSelectedViewProduct={view} />);
 return {view,adjust,select};
}
describe('modern mobile inventory list',()=>{
 it('shows the physical bin, stock health and missing price with explicit actions',()=>{
  const {view,adjust,select}=setup();
  expect(screen.getByText('A-01-02')).toBeTruthy();
  expect(screen.getByText('In stock')).toBeTruthy();
  expect(screen.getByText('Selling price not set')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'View details'}));expect(view).toHaveBeenCalledWith(product);
  fireEvent.click(screen.getByRole('button',{name:'Adjust stock'}));expect(adjust).toHaveBeenCalledWith(product);
  fireEvent.click(screen.getByRole('checkbox',{name:'Select MoliCare Diaper'}));expect(select).toHaveBeenCalledWith('p');
 });
 it('retains viewing and hides mutation actions in read-only mode',()=>{
  setup(true);expect(screen.getByRole('button',{name:'View details'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Adjust stock'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Delete'})).toBeNull();
 });
 it('shows the product total while keeping adjustment identity and location stock intact',()=>{
  const grouped={...product,stock:10,inventorySummary:{stock:60,locationCount:2}};
  const {adjust}=setup(false,grouped);
  expect(screen.getByText('2 locations')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Adjust stock'}));
  expect(adjust).toHaveBeenCalledWith(grouped);
  expect(adjust.mock.calls[0][0].stock).toBe(10);
 });

});
