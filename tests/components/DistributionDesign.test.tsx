// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistributionSummary } from '../../components/fulfillment/transfer/components/DistributionSummary';
import { WaveDistributionAllocations } from '../../components/fulfillment/transfer/components/WaveDistributionAllocations';
import { SingleProductAllocation } from '../../components/fulfillment/transfer/components/SingleProductAllocation';
import type { Product, Site } from '../../types';
vi.mock('../../components/fulfillment/transfer/ProductSelector', () => ({ ProductSelector: ({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) => <div>{products.map(p => <button key={p.id} onClick={() => onSelect(p)}>{p.name}</button>)}</div> }));
afterEach(cleanup);
const product={id:'local',siteId:'dc',name:'MoliCare',sku:'ET001',stock:60,unit:'UNIT'} as Product;
const sites=[{id:'dc',name:'Addis DC',type:'Distribution Center',country:'ET'},{id:'store',name:'Local Store',type:'Store',country:'ET'},{id:'foreign',name:'Kenya Store',type:'Store',country:'KE'}] as Site[];
describe('bulk distribution design',()=>{
 it('summarizes positive allocations and shows stock shortages without implying dispatch',()=>{
  render(<DistributionSummary rows={[{productId:'local',allocations:[{storeId:'store',quantity:70},{storeId:'foreign',quantity:0}]}]} products={[product]} sites={sites}/>);
  expect(screen.getByText(/1 products · 1 stores · 1 transfer requests/)).toBeTruthy();
  expect(screen.getByText(/Exceeds source stock/)).toBeTruthy();
  expect(screen.getByText(/Submission creates transfer requests for approval/)).toBeTruthy();
 });
 it('renders a selected product allocation with a named quantity control',()=>{
  render(<SingleProductAllocation isSearchingProduct={false} setIsSearchingProduct={vi.fn()} allProducts={[product]} products={[]} bulkDistributionProductId="local" setBulkDistributionProductId={vi.fn()} bulkDistributionSourceSite="dc" activeSite={sites[0]} sites={sites} settings={{}} user={null} sourceSiteObj={sites[0]} bulkDistributionAllocations={[{storeId:'store',quantity:10}]} setBulkDistributionAllocations={vi.fn()}/>);
  expect(screen.getByRole('spinbutton',{name:/Quantity.*Local Store/})).toBeTruthy();
 });
 it('adds a shared destination column with independent product quantities',()=>{
  const save=vi.fn(); const second={...product,id:'second',name:'Rice',sku:'ET002'};
  render(<WaveDistributionAllocations isSearchingProduct={false} setIsSearchingProduct={vi.fn()} allProducts={[product,second]} products={[]} bulkDistributionSourceSite="dc" activeSite={sites[0]} sites={sites} settings={{}} user={null} sourceSiteObj={sites[0]} waveProducts={[{productId:'local',allocations:[]},{productId:'second',allocations:[]}]} setWaveProducts={save}/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Local Store'}));
  expect(save).toHaveBeenCalledWith([{productId:'local',allocations:[{storeId:'store',quantity:0}]},{productId:'second',allocations:[{storeId:'store',quantity:0}]}]);
 });
 it('offers only stocked products at the selected source and same-country destination stores',()=>{
  const allocations=vi.fn();
  render(<SingleProductAllocation isSearchingProduct setIsSearchingProduct={vi.fn()} allProducts={[product,{...product,id:'other',siteId:'other',name:'Foreign product'}]} products={[]} bulkDistributionProductId="" setBulkDistributionProductId={vi.fn()} bulkDistributionSourceSite="dc" activeSite={sites[0]} sites={sites} settings={{}} user={null} sourceSiteObj={sites[0]} bulkDistributionAllocations={[]} setBulkDistributionAllocations={allocations}/>);
  expect(screen.queryByRole('button',{name:'Foreign product'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'MoliCare'}));
  expect(allocations).toHaveBeenCalledWith([]);
 });
});
