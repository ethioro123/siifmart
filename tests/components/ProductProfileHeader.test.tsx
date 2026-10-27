// @vitest-environment jsdom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {ProductProfileHeader} from '../../components/inventory/components/ProductProfileHeader';
import type {Product} from '../../types';
afterEach(cleanup);
const product={id:'product',name:'MoliCare Diaper',sku:'ETBB002',category:'Nappies',price:0,stock:23,unit:'UNIT',approvalStatus:'pending',costPrice:1200} as Product;
describe('readable product overview',()=>{
 it('shows stock and price readiness separately without exposing cost',()=>{
  render(<ProductProfileHeader product={product} showCostPrice={false} currencySymbol="ETB"/>);
  expect(screen.getByRole('heading',{level:2})).toBeTruthy();expect(screen.getByText(/Awaiting catalog approval/)).toBeTruthy();
  expect(screen.getByText('Not set')).toBeTruthy();expect(screen.getByText('Location not assigned')).toBeTruthy();
  expect(screen.queryByText(/1200|1,200|Gross Margin|Total Stock Value/)).toBeNull();
 });
 it('uses explicit out-of-stock text rather than just color',()=>{
  render(<ProductProfileHeader product={{...product,stock:0,price:25,approvalStatus:'approved'}} showCostPrice/>);
  expect(screen.getByText(/Out of stock/)).toBeTruthy();expect(screen.queryByText(/Awaiting catalog approval/)).toBeNull();
 });
});
