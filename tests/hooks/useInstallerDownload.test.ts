// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useInstallerDownload} from '../../hooks/useInstallerDownload';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('does not download a missing installer or an HTML fallback masquerading as a successful response',async()=>{
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 const fetch=vi.fn().mockResolvedValueOnce({ok:false,headers:new Headers({'content-type':'application/octet-stream'})}).mockResolvedValueOnce({ok:true,headers:new Headers({'content-type':'text/html'})});vi.stubGlobal('fetch',fetch);
 const {result}=renderHook(()=>useInstallerDownload('/release/missing.exe','installer.exe'));
 await act(async()=>{await result.current.download();});expect(result.current.error).toBe('The selected installer is unavailable.');
 await act(async()=>{await result.current.download();});expect(click).not.toHaveBeenCalled();
});
it('starts the download only after the server confirms an available binary',async()=>{
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,headers:new Headers({'content-type':'application/octet-stream'})}));
 const {result}=renderHook(()=>useInstallerDownload('/release/installer.exe','installer.exe'));await act(async()=>{await result.current.download();});expect(click).toHaveBeenCalledOnce();expect(result.current.error).toBeNull();expect(result.current.isChecking).toBe(false);
});
