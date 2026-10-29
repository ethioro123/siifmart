// @vitest-environment jsdom
import { renderHook,waitFor,act,cleanup } from '@testing-library/react';
import { vi,it,expect,afterEach } from 'vitest';
const mock=vi.hoisted(()=>({create:vi.fn(),get:vi.fn(),remove:vi.fn()}));
vi.mock('../../services/db/pos.db',()=>({posDB:{getPendingOperations:mock.get,removeOperation:mock.remove}}));
vi.mock('../../services/supabase.service',()=>({salesService:{create:mock.create},customersService:{}}));
import {usePosSync} from '../../hooks/usePosSync';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it.each(['42501','23502','23505'])('retains rejected sale %s and removes it only after a confirmed retry',async code=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true}));
 Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
 const op={id:1,type:'CREATE_SALE',payload:{id:'sale-id',items:[]}};
 let pending=[op];mock.get.mockImplementation(async()=>pending);mock.remove.mockImplementation(async()=>{pending=[];});
 mock.remove.mockClear();mock.create.mockRejectedValue({code,message:'Rejected'});
 const done=vi.fn();const {result}=renderHook(()=>usePosSync(done));
 await waitFor(()=>expect(result.current.syncStatus).toBe('error'));
 expect(mock.remove).not.toHaveBeenCalled();expect(result.current.pendingCount).toBe(1);expect(done).not.toHaveBeenCalled();
 mock.create.mockResolvedValue({id:'sale-id'});await act(()=>result.current.triggerSync());
 expect(mock.remove).toHaveBeenCalledWith(1);expect(result.current.pendingCount).toBe(0);expect(result.current.syncStatus).toBe('synced');
});
