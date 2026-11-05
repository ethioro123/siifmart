// @vitest-environment jsdom
import React from 'react';
import {act,cleanup,renderHook} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useGeneralSettingsMutation,GeneralSettingsPayload} from '../../hooks/useGeneralSettingsMutation';
import type {SystemConfig} from '../../types';
const state=vi.hoisted(()=>({role:'group_ceo',save:vi.fn(),apply:vi.fn(),toast:vi.fn()}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'ceo',role:state.role},showToast:state.toast})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({applyConfirmedSettings:state.apply})}));
vi.mock('../../services/general-settings.service',()=>({generalSettingsFields:{branding:['slogan']},generalSettingsService:{save:state.save}}));
let client: QueryClient;
function Wrapper({children}:{children:React.ReactNode}){return <QueryClientProvider client={client}>{children}</QueryClientProvider>;}
beforeEach(()=>{vi.clearAllMocks();state.role='group_ceo';client=new QueryClient({defaultOptions:{mutations:{retry:false,gcTime:0}}});});
afterEach(async()=>{await act(async()=>{cleanup();client.clear();await new Promise(resolve=>setTimeout(resolve,0));});});
const payload:GeneralSettingsPayload={section:'branding',targetCountry:'ET',data:{slogan:'New'}};
describe('confirmed general settings mutation',()=>{
 it('never replaces the cache on failure and reuses the retry key',async()=>{
  const confirmed={country:'ET',countryConfigs:{ET:{slogan:'New'}}} as unknown as SystemConfig;state.save.mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValueOnce(confirmed);
  const {result}=renderHook(()=>useGeneralSettingsMutation(),{wrapper:Wrapper});
  await act(async()=>{await expect(result.current.mutateAsync(payload)).rejects.toThrow('Connection lost');});expect(state.apply).not.toHaveBeenCalled();
  await act(async()=>{await result.current.mutateAsync(payload);});expect(state.save.mock.calls[0][0]).toBe(state.save.mock.calls[1][0]);expect(state.apply).toHaveBeenCalledWith(confirmed,'ET',['slogan']);
 });
 it('rejects a non-CEO before persistence',async()=>{state.role='warehouse_manager';const {result}=renderHook(()=>useGeneralSettingsMutation(),{wrapper:Wrapper});await act(async()=>{await expect(result.current.mutateAsync(payload)).rejects.toThrow('Only the Group');});expect(state.save).not.toHaveBeenCalled();});
});
