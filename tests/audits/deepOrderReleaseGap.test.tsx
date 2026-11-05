// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {Site,SystemConfig} from '../../types';
const mock=vi.hoisted(()=>({update:vi.fn(),release:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({salesService:{update:mock.update,releaseOrder:mock.release},productsService:{}}));
vi.mock('../../services/db/pos.db',()=>({posDB:{}}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),debug:vi.fn(),warn:vi.fn()}}));
import {useSaleActions} from '../../contexts/hooks/useSaleActions';
afterEach(cleanup);beforeEach(()=>{vi.clearAllMocks();Object.defineProperty(navigator,'onLine',{configurable:true,value:true});});
function setup(){
 const setSales=vi.fn(),setAllSales=vi.fn();
 const hook=renderHook(()=>useSaleActions({activeSite:{id:'warehouse'} as Site,settings:{country:'ET'} as SystemConfig,products:[],sites:[],employees:[],customers:[],storePoints:[],setSales,setAllSales,setProducts:vi.fn(),setCustomers:vi.fn(),addNotification:vi.fn(),logSystemEvent:vi.fn(),triggerSync:vi.fn(),posCheckQueue:vi.fn(),awardStorePoints:vi.fn()}));
 return {...hook,setSales,setAllSales};
}
it('releases through the picking transaction and changes the cache only after confirmation',async()=>{
 mock.release.mockResolvedValue({saved:true});const {result,setSales}=setup();
 await act(async()=>{await result.current.releaseOrder('sale');});
 expect(mock.release).toHaveBeenCalledWith('sale','warehouse');expect(mock.update).not.toHaveBeenCalled();
 const apply=setSales.mock.calls[0][0];expect(apply([{id:'sale',fulfillmentStatus:'Pending',release_status:'PENDING'}])[0]).toMatchObject({fulfillmentStatus:'Picking',release_status:'RELEASED'});
});
it('propagates server rejection without success cache changes',async()=>{
 mock.release.mockRejectedValue(new Error('No stock'));const {result,setSales}=setup();
 await expect(result.current.releaseOrder('sale')).rejects.toThrow('No stock');expect(setSales).not.toHaveBeenCalled();
});
it('refuses offline release instead of pretending to complete the order',async()=>{
 Object.defineProperty(navigator,'onLine',{configurable:true,value:false});const {result,setSales}=setup();
 await expect(result.current.releaseOrder('sale')).rejects.toThrow('warehouse.releaseOnline');expect(mock.release).not.toHaveBeenCalled();expect(setSales).not.toHaveBeenCalled();
});
