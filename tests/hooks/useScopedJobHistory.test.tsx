// @vitest-environment jsdom
import {act,renderHook} from '@testing-library/react';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {useScopedJobHistory} from '../../hooks/useScopedJobHistory';
import {wmsJobsService} from '../../services/wms-jobs.service';
import type {User,WMSJob} from '../../types';
vi.mock('../../services/wms-jobs.service',()=>({wmsJobsService:{getHistory:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
describe('personal completed-job history',()=>{
 it('asks for the floor worker actual completion identity',async()=>{vi.mocked(wmsJobsService.getHistory).mockResolvedValue([]);const user={id:'worker',role:'packer'} as User;const {result}=renderHook(()=>useScopedJobHistory('site','ET',user,[]));await act(async()=>{await result.current.loadHistoricalJobs();});expect(wmsJobsService.getHistory).toHaveBeenCalledWith('site',25,'worker','ET',undefined,0);});
 it('lets managers query scoped team history',async()=>{vi.mocked(wmsJobsService.getHistory).mockResolvedValue([]);const user={id:'manager',role:'warehouse_manager'} as User;const {result}=renderHook(()=>useScopedJobHistory('site','ET',user,[]));await act(async()=>{await result.current.loadHistoricalJobs();});expect(wmsJobsService.getHistory).toHaveBeenCalledWith('site',25,undefined,'ET',undefined,0);});
 it('discards old-country responses after a scope switch',async()=>{let finish:(jobs:WMSJob[])=>void=()=>{};vi.mocked(wmsJobsService.getHistory).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const user={id:'worker',role:'packer'} as User;const {result,rerender}=renderHook(({country})=>useScopedJobHistory('site',country,user,[]),{initialProps:{country:'ET'}});let request:Promise<void>;act(()=>{request=result.current.loadHistoricalJobs();});rerender({country:'KE'});await act(async()=>{finish([{id:'old'} as WMSJob]);await request!;});expect(result.current.historicalJobs).toEqual([]);});
 it('reports unavailable history instead of silently treating it as empty',async()=>{vi.mocked(wmsJobsService.getHistory).mockRejectedValue(new Error('offline'));const user={id:'worker',role:'packer'} as User;const {result}=renderHook(()=>useScopedJobHistory('site','ET',user,[]));await act(async()=>{await result.current.loadHistoricalJobs();});expect(result.current.historyError).toBe(true);expect(result.current.historyLoading).toBe(false);});
});
