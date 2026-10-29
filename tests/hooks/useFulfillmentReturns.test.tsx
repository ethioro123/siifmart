// @vitest-environment jsdom
import React from 'react';
import {act,renderHook} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {useFulfillmentReturns} from '../../hooks/useFulfillmentReturns';
import {fulfillmentReturnsService,ReturnSale} from '../../services/fulfillment-returns.service';
vi.mock('../../services/fulfillment-returns.service',()=>({fulfillmentReturnsService:{lookup:vi.fn(),submit:vi.fn(),list:vi.fn(),decide:vi.fn()}}));
const sale={id:'sale',siteId:'site',countryCode:'ET',items:[]} as unknown as ReturnSale;
const lines=[{saleItemId:'line',quantity:1,reason:'inspection',condition:'Damaged',action:'Repair'}];
beforeEach(()=>vi.clearAllMocks());
function wrapper({children}:{children:React.ReactNode}){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>;}
describe('return intake retry',()=>{
 it('reuses its request ID after an uncertain save and does not clear the receipt',async()=>{
  vi.mocked(fulfillmentReturnsService.lookup).mockResolvedValue(sale);vi.mocked(fulfillmentReturnsService.submit).mockRejectedValueOnce(new Error('connection lost')).mockResolvedValueOnce({id:'saved',status:'pending',refundAmount:10});
  const {result}=renderHook(()=>useFulfillmentReturns('site','ET','worker','intake',1),{wrapper});
  await act(async()=>{await result.current.lookup.mutateAsync('receipt');});
  await act(async()=>{await expect(result.current.submit.mutateAsync(lines)).rejects.toThrow();});expect(result.current.sale?.id).toBe('sale');
  await act(async()=>{await result.current.submit.mutateAsync(lines);});
  expect(vi.mocked(fulfillmentReturnsService.submit).mock.calls[0][0]).toBe(vi.mocked(fulfillmentReturnsService.submit).mock.calls[1][0]);expect(result.current.sale).toBeNull();
 });
 it('does not load history while working on intake',()=>{renderHook(()=>useFulfillmentReturns('site','ET','worker','intake',1),{wrapper});expect(fulfillmentReturnsService.list).not.toHaveBeenCalled();});
});
