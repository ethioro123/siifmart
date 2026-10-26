// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickExecution, PickRecountRequiredError } from '../../hooks/usePickExecution';
import { discrepancyService } from '../../services/discrepancy.service';
import { pickingExecutionService } from '../../services/picking-execution.service';
vi.mock('../../services/discrepancy.service',()=>({discrepancyService:{getFloorHistory:vi.fn()}}));
vi.mock('../../services/picking-execution.service',()=>({pickingExecutionService:{recordLine:vi.fn()}}));
const input={jobId:'job',itemIndex:0,quantity:20,expectedQuantity:23,locationBarcode:'100101010100000',itemBarcode:'SKU',shortageReason:'Only 20 units'};
const setup=()=>renderHook(()=>usePickExecution(),{wrapper:({children}:{children:React.ReactNode})=><QueryClientProvider client={new QueryClient({defaultOptions:{mutations:{retry:false}}})}>{children}</QueryClientProvider>});
beforeEach(()=>vi.clearAllMocks());
describe('picking recount approval gate',()=>{
 it('opens the report path without saving an unapproved shortage',async()=>{
  vi.mocked(discrepancyService.getFloorHistory).mockResolvedValue([]);
  const {result}=setup();
  await act(async()=>{await expect(result.current.mutateAsync(input)).rejects.toBeInstanceOf(PickRecountRequiredError);});
  expect(pickingExecutionService.recordLine).not.toHaveBeenCalled();
 });
 it('passes only scan proof through after an exact quantity approval',async()=>{
  vi.mocked(discrepancyService.getFloorHistory).mockResolvedValue([{item_index:0,expected_qty:23,resolution:'short_pick',resolved_at:'2026-10-27',resolved_qty:20}] as Awaited<ReturnType<typeof discrepancyService.getFloorHistory>>);
  const {result}=setup();await act(async()=>{await result.current.mutateAsync(input);});
  const {expectedQuantity:_,...proof}=input;
  expect(pickingExecutionService.recordLine).toHaveBeenCalledWith(proof);
 });
});
