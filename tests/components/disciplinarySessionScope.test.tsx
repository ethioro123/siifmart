// @vitest-environment jsdom
import React from 'react';
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('../../services/disciplinary.service',()=>({disciplinaryService:{fetchDisciplinaryRecords:mock.read}}));
import {useDisciplinaryRecords} from '../../hooks/useDisciplinaryRecords';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('does not show a previous session response after the current session is denied',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});let resolvePrevious:(value:unknown[])=>void=()=>{};
 mock.read.mockImplementationOnce(()=>new Promise(resolve=>{resolvePrevious=resolve;})).mockRejectedValueOnce(new Error('Current employee denied'));
 const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 const {result,rerender}=renderHook(({user})=>useDisciplinaryRecords(user,'ET','warehouse',1),{initialProps:{user:'previous-user'},wrapper});
 rerender({user:'current-user'});await waitFor(()=>expect(result.current.isError).toBe(true));
 await act(async()=>{resolvePrevious([{id:'previous-private-record',confidential_notes:'Private'}]);});
 expect(result.current.data).toBeUndefined();expect(result.current.error?.message).toBe('Current employee denied');client.clear();
});
