// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WaveDistributionAllocations } from '../../components/fulfillment/transfer/components/WaveDistributionAllocations';
import type { Product, Site } from '../../types';
afterEach(cleanup);
const products=[{id:'one',name:'Diaper',sku:'ET001',siteId:'dc',stock:60},{id:'two',name:'Rice',sku:'ET002',siteId:'dc',stock:100}] as Product[];
const source={id:'dc',name:'DC',type:'Distribution Center',country:'ET'} as Site;
const stores=[source,{id:'a',name:'Addis',country:'ET',type:'Store'},{id:'b',name:'Bole',country:'ET',type:'Store'}] as Site[];
function Demo(){
 const[rows,save]=useState<{productId:string;allocations:{storeId:string;quantity:number}[]}[]>([]);
 return <><WaveDistributionAllocations isSearchingProduct={false} setIsSearchingProduct={()=>{}} allProducts={products} bulkDistributionSourceSite="dc" activeSite={source} sites={stores} settings={{}} user={null} sourceSiteObj={source} waveProducts={rows} setWaveProducts={save}/><output>{JSON.stringify(rows)}</output></>;
}
describe('compact multi-product distribution grid',()=>{
 it('batch adds products, chooses stores once, and keeps cell quantities independent',()=>{
  render(<Demo/>);
  fireEvent.click(screen.getByRole('checkbox',{name:/Diaper ET001/}));
  fireEvent.click(screen.getByRole('checkbox',{name:/Rice ET002/}));
  fireEvent.click(screen.getByRole('button',{name:'Add selected products'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Bole'}));
  expect(screen.getAllByRole('spinbutton')).toHaveLength(4);
  fireEvent.change(screen.getByRole('spinbutton',{name:'Quantity for Diaper to Addis'}),{target:{value:'20'}});
  expect((screen.getByRole('spinbutton',{name:'Quantity for Rice to Addis'}) as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('spinbutton',{name:'Quantity for Diaper to Bole'}) as HTMLInputElement).value).toBe('');
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis'}));
  expect(screen.queryByRole('spinbutton',{name:'Quantity for Diaper to Addis'})).toBeNull();
  expect(screen.getByRole('status').textContent).not.toContain('20');
 });
 it('allows store selection before products and removes a product without changing other rows',()=>{
  render(<Demo/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Bole'}));
  fireEvent.click(screen.getByRole('checkbox',{name:/Diaper ET001/}));
  fireEvent.click(screen.getByRole('button',{name:'Add selected products'}));
  expect(screen.getByRole('spinbutton',{name:'Quantity for Diaper to Bole'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Remove Diaper from wave'}));
  expect(screen.getByRole('status').textContent).toBe('[]');
 });
});
