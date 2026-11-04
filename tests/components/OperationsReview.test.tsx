// @vitest-environment jsdom
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { OperationsReview } from '../../components/fulfillment/review/OperationsReview';
import { operationsReview } from '../../utils/translations/warehouse/operationsReview';
import { operations } from '../../types/operations-review';
const state=vi.hoisted(()=>({role:'warehouse_manager',calls:vi.fn(),error:false,fetching:false,source:'job',detail:undefined as unknown}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',refreshData:vi.fn()})}));
vi.mock('../../components/fulfillment/FulfillmentContext',()=>({useFulfillment:()=>({user:{id:'manager',role:state.role},activeSite:{id:'site'},t:(key:string)=>key,setActiveTab:vi.fn(),setSelectedJob:vi.fn(),setIsDetailsOpen:vi.fn(),refreshJobs:vi.fn()})}));
vi.mock('../../components/Modal',()=>({default:({children}:{children:React.ReactNode})=><div role="dialog">{children}</div>}));
vi.mock('../../components/fulfillment/receive/BlindReceiptReview',()=>({ReviewWorkspace:({initialReceipt,embedded,site}:{initialReceipt:string;embedded:boolean;site:string})=><div data-testid="receipt-adapter">{initialReceipt} · {String(embedded)} · {site}</div>}));
vi.mock('../../hooks/useOperationsReview',()=>({useOperationsReview:(...args:unknown[])=>{state.calls(...args);return {
 queue:{data:[{source:state.source,id:'record',site_id:'warehouse-site',site_name:'Adama warehouse',operation:'PICK',reference:'PICK-001',status:'Pending',handler:'Worker',occurred_at:'2026-11-04T00:00:00Z',exception:true}],isError:state.error,isFetching:state.fetching,refetch:vi.fn()},
 detail:{data:state.detail,isError:false,isFetching:false},note:{isPending:false},resolve:{isPending:false},audit:{isPending:false},credit:{isPending:false},openJob:{isPending:false},refresh:vi.fn()
};}}));
afterEach(()=>{cleanup();state.calls.mockClear();state.role='warehouse_manager';state.error=false;state.fetching=false;state.source='job';state.detail=undefined;});
const setup=()=>render(<MemoryRouter><OperationsReview/></MemoryRouter>);
describe('shared operations review',()=>{
 it('does not query any operational review data before the manager opens it',()=>{setup();expect(state.calls).not.toHaveBeenCalled();expect(screen.queryByRole('dialog')).toBeNull();});
 it('keeps the manager entry unavailable to floor workers',()=>{state.role='receiver';setup();expect(screen.queryByRole('button')).toBeNull();expect(state.calls).not.toHaveBeenCalled();});
 it('opens active work first and offers every operation with exception and history views',()=>{
  setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));
  expect(state.calls.mock.calls.at(-1)?.slice(3,6)).toEqual(['ALL','active',0]);
  expect(screen.getByText(/Adama warehouse/)).toBeTruthy();
  const select=screen.getByRole('combobox',{name:'warehouse.opOperation'});
  for(const operation of operations)expect(screen.getByRole('option',{name:`warehouse.opOperation_${operation}`})).toBeTruthy();
  fireEvent.change(select,{target:{value:'PUTAWAY'}});
  fireEvent.change(screen.getByRole('combobox',{name:'warehouse.opView'}),{target:{value:'history'}});
  expect(state.calls.mock.calls.at(-1)?.slice(3,6)).toEqual(['PUTAWAY','history',0]);
 });
 it('hides cached queue rows when refresh fails',()=>{state.error=true;setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByText(/PICK-001/)).toBeNull();});
 it('embeds the existing receiving review for the exact selected count',()=>{state.source='receipt';setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));fireEvent.click(screen.getByRole('button',{name:/PICK-001/}));expect(screen.getByTestId('receipt-adapter').textContent).toContain('record · true · warehouse-site');});
 it('has synchronized English, Amharic and Oromo labels',()=>{for(const entry of Object.values(operationsReview))for(const locale of ['en','am','or'])expect((entry as Record<string,string>)[locale]?.trim()).toBeTruthy();});
});
