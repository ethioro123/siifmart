// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDriverIncident } from '../../hooks/useDriverIncident';
import { tasksService } from '../../services/tasks.service';
import type { EmployeeTask } from '../../types';
vi.mock('../../services/tasks.service',()=>({tasksService:{create:vi.fn()}}));
const task={title:'Incident',description:'Vehicle stopped',assignedTo:'manager',priority:'High',status:'Pending'} as Omit<EmployeeTask,'id'>;
const setup=()=>renderHook(()=>useDriverIncident(),{wrapper:({children}:{children:React.ReactNode})=><QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>});
beforeEach(()=>vi.clearAllMocks());
afterEach(cleanup);
describe('driver incident save confirmation',()=>{
 it('rejects a null service result rather than claiming report success',async()=>{
  vi.mocked(tasksService.create).mockResolvedValue(null);const {result}=setup();
  await act(async()=>{await expect(result.current.mutateAsync(task)).rejects.toThrow('not confirmed');});
 });
 it('requires a recipient and returns the confirmed record',async()=>{
  const saved={...task,id:'report'} as EmployeeTask;vi.mocked(tasksService.create).mockResolvedValue(saved);const {result}=setup();
  await act(async()=>{await expect(result.current.mutateAsync({...task,assignedTo:''})).rejects.toThrow('facility manager');});
  expect(tasksService.create).not.toHaveBeenCalled();
  await act(async()=>{await expect(result.current.mutateAsync(task)).resolves.toEqual(saved);});
 });
});
