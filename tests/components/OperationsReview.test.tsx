// @vitest-environment jsdom
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { OperationsReview } from '../../components/fulfillment/review/OperationsReview';
import { operationsReview } from '../../utils/translations/warehouse/operationsReview';
import { operations } from '../../types/operations-review';
const state=vi.hoisted(()=>({role:'warehouse_manager',calls:vi.fn(),error:false,fetching:false,source:'job',rowOperation:'PICK',rowReference:'PICK-001',detailError:false,detail:undefined as unknown}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',refreshData:vi.fn()})}));
vi.mock('../../components/fulfillment/FulfillmentContext',()=>({useFulfillment:()=>({user:{id:'manager',role:state.role},activeSite:{id:'site'},t:(key:string)=>key,setActiveTab:vi.fn(),setSelectedJob:vi.fn(),setIsDetailsOpen:vi.fn(),refreshJobs:vi.fn()})}));
vi.mock('../../components/Modal',()=>({default:({children}:{children:React.ReactNode})=><div role="dialog">{children}</div>}));
vi.mock('../../components/fulfillment/receive/BlindReceiptReview',()=>({ReviewWorkspace:({initialReceipt,embedded,site}:{initialReceipt:string;embedded:boolean;site:string})=><div data-testid="receipt-adapter">{initialReceipt} · {String(embedded)} · {site}</div>}));
vi.mock('../../hooks/useOperationsReview',()=>({useOperationsReview:(...args:unknown[])=>{state.calls(...args);return {
 queue:{data:[{source:state.source,id:'record',site_id:'warehouse-site',site_name:'Adama warehouse',operation:state.rowOperation,reference:state.rowReference,status:'Pending',handler:'Worker',occurred_at:'2026-11-04T00:00:00Z',exception:true}],isError:state.error,isFetching:state.fetching,refetch:vi.fn()},
 detail:{data:state.detail,isError:state.detailError,isFetching:false},note:{isPending:false},resolve:{isPending:false},audit:{isPending:false},credit:{isPending:false},openJob:{isPending:false},refresh:vi.fn()
};}}));
afterEach(()=>{cleanup();state.calls.mockClear();state.role='warehouse_manager';state.error=false;state.fetching=false;state.source='job';state.rowOperation='PICK';state.rowReference='PICK-001';state.detailError=false;state.detail=undefined;});
const setup=()=>render(<MemoryRouter><OperationsReview/></MemoryRouter>);
describe('shared operations review',()=>{
 it('does not query any operational review data before the manager opens it',()=>{setup();expect(state.calls).not.toHaveBeenCalled();expect(screen.queryByRole('dialog')).toBeNull();});
 it('keeps the manager entry unavailable to floor workers',()=>{state.role='receiver';setup();expect(screen.queryByRole('button')).toBeNull();expect(state.calls).not.toHaveBeenCalled();});
 it('opens active work first and offers every operation with exception and history views',()=>{
  setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));
  expect(state.calls.mock.calls.at(-1)?.slice(3,6)).toEqual(['ALL','active',0]);
  expect(screen.getByText(/Adama warehouse/)).toBeTruthy();
  expect(screen.getByRole('option',{name:'warehouse.opMode_partial'})).toBeTruthy();
  const select=screen.getByRole('combobox',{name:'warehouse.opOperation'});
  for(const operation of operations)expect(screen.getByRole('option',{name:`warehouse.opOperation_${operation}`})).toBeTruthy();
  fireEvent.change(select,{target:{value:'PUTAWAY'}});
  fireEvent.change(screen.getByRole('combobox',{name:'warehouse.opView'}),{target:{value:'history'}});
  expect(state.calls.mock.calls.at(-1)?.slice(3,6)).toEqual(['PUTAWAY','history',0]);
 });
 it('hides cached queue rows when refresh fails',()=>{state.error=true;setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByText(/PICK-001/)).toBeNull();});
 it('embeds the existing receiving review for the exact selected count',()=>{state.source='receipt';setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));fireEvent.click(screen.getByRole('button',{name:/PICK-001/}));expect(screen.getByTestId('receipt-adapter').textContent).toContain('record · true · warehouse-site');});
 it('opens recorded receiving quantities through an explicit View details action',()=>{
  state.rowOperation='RECEIVE';state.rowReference='AAAA0033';
  state.detail={summary:{source:'job',id:'record',operation:'RECEIVE',reference:'AAAA0033',status:'Partially Received',handler:'Counter',occurred_at:'2026-11-04T00:00:00Z',exception:false},
   receiving:{po_number:'AAAA0033',supplier_name:'Supplier',partial:true,items:[{id:'item',product_name:'Dishes',sku:'ETDI001',ordered:960,received:240,outstanding:720}],submissions:[],putaway:[]},
   fields:{},lines:[],reports:[],notes:[],fingerprint:'evidence',can_note:false,can_credit:false};
  setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));
  const action=screen.getByRole('button',{name:'warehouse.opViewDetails: AAAA0033 · warehouse.opOperation_RECEIVE'});
  expect(action.textContent).toContain('warehouse.opViewDetails');fireEvent.click(action);
  for(const quantity of ['960','240','720'])expect(screen.getByText(quantity)).toBeTruthy();
  expect(screen.getByRole('button',{name:'warehouse.back'})).toBeTruthy();
  expect(state.calls.mock.calls.at(-1)?.[6]).toEqual(expect.objectContaining({source:'job',id:'record',site_id:'warehouse-site'}));
 });
 it('shows an evidence error after clicking details instead of a blank panel',()=>{
  state.detailError=true;setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));
  fireEvent.click(screen.getByRole('button',{name:/PICK-001/}));
  expect(screen.getByRole('alert').textContent).toContain('warehouse.opLoadFailed');
 });
 it('uses the existing short job display instead of a full raw UUID',()=>{
  state.rowReference='62b3caff-b285-4e9b-a431-17e1df9165fb';
  setup();fireEvent.click(screen.getByRole('button',{name:'warehouse.opTitle'}));
  expect(screen.queryByText(/62b3caff/)).toBeNull();
  expect(screen.getByRole('button',{name:/9165FB/})).toBeTruthy();
 });
 it('has synchronized English, Amharic and Oromo labels',()=>{for(const entry of Object.values(operationsReview))for(const locale of ['en','am','or'])expect((entry as Record<string,string>)[locale]?.trim()).toBeTruthy();});
});
