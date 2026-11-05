// @vitest-environment jsdom
// Regression: customer posting belongs to the idempotent server sale transaction.
import { act,cleanup,renderHook,waitFor } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({get:vi.fn(),remove:vi.fn(),sale:vi.fn(),customer:vi.fn(),update:vi.fn()}));
vi.mock('../../services/db/pos.db',()=>({posDB:{getPendingOperations:mock.get,removeOperation:mock.remove}}));
vi.mock('../../services/supabase.service',()=>({salesService:{create:mock.sale},customersService:{getById:mock.customer,update:mock.update}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { usePosSync } from '../../hooks/usePosSync';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('does not duplicate customer posting when queue removal fails after a committed sale',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true}));
 Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
 const op={id:1,type:'CREATE_SALE',payload:{id:'sale',customerId:'customer',items:[],subtotal:1000,total:1000,loyaltyRate:100,enableLoyalty:true}};
 let pending=[op];let points=0;let totalSpent=0;
 mock.get.mockImplementation(async()=>pending);
 const posted=new Set<string>();
 mock.sale.mockImplementation(async()=>{if(!posted.has('sale')){posted.add('sale');points+=10;totalSpent+=1000;}return {id:'sale'};});
 mock.customer.mockImplementation(async()=>({loyaltyPoints:points,totalSpent}));
 mock.update.mockImplementation(async(_id:string,v:{loyaltyPoints:number;totalSpent:number})=>{points=v.loyaltyPoints;totalSpent=v.totalSpent;});
 mock.remove.mockRejectedValueOnce(new Error('IndexedDB removal failed')).mockImplementation(async()=>{pending=[];});
 const {result}=renderHook(()=>usePosSync());
 await waitFor(()=>expect(result.current.syncStatus).toBe('error'));
 expect(points).toBe(10);
 await act(async()=>{await result.current.triggerSync();});
 expect(points).toBe(10);
 expect(mock.update).not.toHaveBeenCalled();
 expect(totalSpent).toBe(1000);
});
