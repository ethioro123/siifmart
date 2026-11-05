// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import type {SystemConfig} from '../../types';
const mock=vi.hoisted(()=>({update:vi.fn(),release:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({salesService:{update:mock.update,releaseOrder:mock.release},productsService:{}}));
vi.mock('../../services/db/pos.db',()=>({posDB:{}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),debug:vi.fn(),warn:vi.fn()}}));
import {useSaleActions} from '../../contexts/hooks/useSaleActions';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('documents that the WMS Order Release handler marks delivered rather than requesting pick creation',async()=>{
 Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
 mock.update.mockResolvedValue({id:'sale',fulfillmentStatus:'Delivered'});
 const notify=vi.fn();
 const {result}=renderHook(()=>useSaleActions({activeSite:undefined,settings:{country:'ET'} as SystemConfig,products:[],sites:[],employees:[],customers:[],storePoints:[],setSales:vi.fn(),setAllSales:vi.fn(),setProducts:vi.fn(),setCustomers:vi.fn(),addNotification:notify,logSystemEvent:vi.fn(),triggerSync:vi.fn(),posCheckQueue:vi.fn(),awardStorePoints:vi.fn()}));
 await act(async()=>{await result.current.releaseOrder('sale');});
 expect(mock.update).toHaveBeenCalledWith('sale',{fulfillmentStatus:'Delivered'});
 expect(mock.release).not.toHaveBeenCalled();
 expect(notify).toHaveBeenCalledWith('success','Order marked as delivered');
});
