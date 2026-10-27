// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MarkdownTab } from '../../components/merchandising/MarkdownTab';
import { MarkdownPlanResults } from '../../components/merchandising/MarkdownPlanResults';
import { calculateMarkdownGlidePath } from '../../utils/markdownGlidePath';
import type { Product } from '../../types';
const mocks=vi.hoisted(()=>({country:'ET',site:'site',siteType:'Store',send:vi.fn(),pending:false,catalog:vi.fn()}));
const product={id:'p',name:'Coffee',sku:'ET-COF',siteId:'site',price:100,costPrice:70,stock:100,status:'active'} as Product;
vi.mock('../../components/merchandising/MerchandisingContext',()=>({useMerchandising:()=>({activeCountry:mocks.country,currencySymbol:'ETB'})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({activeSite:{id:mocks.site,type:mocks.siteType},sales:[]})}));
vi.mock('../../hooks/usePriceManagerCatalog',()=>({usePriceManagerCatalog:(input:unknown)=>{mocks.catalog(input);return {data:{data:[product],count:1},isFetching:false,isError:false};}}));
vi.mock('../../hooks/useMarkdownProposal',()=>({useMarkdownProposal:()=>({send:mocks.send,busy:false,feedback:null,pending:{isSuccess:true,isFetching:false,data:{data:mocks.pending?[{id:'pending'}]:[]}}})}));
vi.mock('recharts',()=>({ResponsiveContainer:()=>null,Area:()=>null,AreaChart:()=>null,CartesianGrid:()=>null,Tooltip:()=>null,XAxis:()=>null,YAxis:()=>null}));
afterEach(cleanup);beforeEach(()=>{vi.clearAllMocks();mocks.country='ET';mocks.site='site';mocks.siteType='Store';mocks.pending=false;});
const generate=()=>{
 fireEvent.change(screen.getByLabelText('Product'),{target:{value:'p'}});
 const target=new Date();target.setDate(target.getDate()+21);
 fireEvent.change(screen.getByLabelText('Target exit date'),{target:{value:`${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`}});
 fireEvent.click(screen.getByRole('button',{name:'Generate plan'}));
};
it('shows a stage table, zero-history warning and submits one selected price',()=>{
 render(<MarkdownTab/>);generate();
 expect(screen.getByRole('table')).toBeTruthy();expect(screen.getByText(/Insufficient positive sales history/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Submit selected price/}));expect(mocks.send).toHaveBeenCalledWith(90,expect.any(String));
 expect(screen.queryByText('100% Exit')).toBeNull();
});
it('resets the selection, date and results on country or site changes',()=>{
 const {rerender}=render(<MarkdownTab/>);generate();mocks.country='KE';mocks.site='new-site';rerender(<MarkdownTab/>);
 expect((screen.getByLabelText('Product') as HTMLSelectElement).value).toBe('');expect(screen.queryByRole('table')).toBeNull();
 expect((screen.getByLabelText('Target exit date') as HTMLInputElement).value).toBe('');
});
it('blocks submission for pending edits and invalidates the plan when its date changes',()=>{
 mocks.pending=true;render(<MarkdownTab/>);generate();expect((screen.getByRole('button',{name:/Submit selected price/}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Target exit date'),{target:{value:'2020-01-01'}});expect(screen.queryByRole('table')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Generate plan'}));expect(screen.getByRole('alert').textContent).toContain('future');
});
it('searches a bounded country and site catalog',()=>{
 render(<MarkdownTab/>);fireEvent.change(screen.getByLabelText('Find a product'),{target:{value:'Coffee'}});fireEvent.click(screen.getByRole('button',{name:'Search products'}));
 expect(mocks.catalog).toHaveBeenLastCalledWith(expect.objectContaining({country:'ET',pageSize:25,search:'Coffee',filters:{sites:['site']}}));
});
it('makes exact stage values available as a table and keeps the chart secondary',()=>{
 const now=new Date(2026,9,28,12);const plan=calculateMarkdownGlidePath({product,targetExitDate:'2026-11-18',now})!;
 render(<MarkdownPlanResults plan={plan} currency="ETB" selectedStage={1} currentPrice={100} onSelectStage={vi.fn()}/>);
 expect(screen.getAllByRole('row')).toHaveLength(plan.stages.length+1);expect(screen.getByText('View estimated stock trend').closest('details')?.open).toBe(false);
 expect(screen.getByText(/Estimates are not a sell-through guarantee/)).toBeTruthy();
});

it('keeps HQ catalog access while branch searches remain facility-scoped',()=>{
 mocks.siteType='HQ';render(<MarkdownTab/>);
 expect(mocks.catalog).toHaveBeenLastCalledWith(expect.objectContaining({country:'ET',pageSize:25,filters:{}}));
});
