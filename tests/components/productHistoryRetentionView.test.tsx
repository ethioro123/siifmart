// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import type {Product} from '../../types';
import type {useProductChanges} from '../../hooks/useProductChanges';
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'director',role:'country_commercial_director'}})}));
vi.mock('../../components/products/PriceRetentionHold',()=>({PriceRetentionHold:()=>null}));
vi.mock('../../components/fulfillment/discrepancies/FloorAuditTimeline',()=>({FloorAuditTimeline:()=>null}));
import {ProductChangesTab} from '../../components/products/ProductChangesTab';
afterEach(cleanup);
function show(){
 const setWindow=vi.fn(),setSearch=vi.fn();
 const changes={historyWindow:'12months',historySearch:'',setHistoryWindow:setWindow,setHistorySearch:setSearch,
  history:{isPending:false,isError:false,data:{data:[]}},prices:{isPending:false,isError:false,data:[]},decision:{isPending:false}} as unknown as ReturnType<typeof useProductChanges>;
 render(<ProductChangesTab product={{id:'coffee',siteId:'store'} as Product} country="ET" currency="ETB" changes={changes}/>);
 return {setWindow,setSearch};
}
describe('product retained history view',()=>{
 it('shows twelve months initially and offers all retained history',()=>{
  const {setWindow}=show();const select=screen.getByRole('combobox',{name:'Price history period'});
  expect((select as HTMLSelectElement).value).toBe('12months');
  fireEvent.change(select,{target:{value:'all'}});expect(setWindow).toHaveBeenCalledWith('all');
  expect(screen.getByText(/Applied price changes are retained for 10 years/)).toBeTruthy();
 });
 it('submits search explicitly rather than querying on every keystroke',()=>{
  const {setSearch}=show();fireEvent.change(screen.getByRole('textbox',{name:'Search price history'}),{target:{value:'Director clearance'}});
  expect(setSearch).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Search'}));expect(setSearch).toHaveBeenCalledWith('Director clearance');
  expect(screen.getByText('No applied price changes match this period and search.')).toBeTruthy();
 });
});
