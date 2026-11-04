// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { useOperationsReview } from '../../hooks/useOperationsReview';
import { operationsReviewService } from '../../services/operations-review.service';
vi.mock('../../services/operations-review.service',()=>({operationsReviewService:{queue:vi.fn(async()=>[]),note:vi.fn(async()=>({id:'saved',saved:true})),detail:vi.fn(),openJob:vi.fn()}}));
vi.mock('../../services/discrepancy.service',()=>({discrepancyService:{resolveFloor:vi.fn()}}));
vi.mock('../../services/floor-audit.service',()=>({floorAuditService:{review:vi.fn()}}));
vi.mock('../../services/fulfillment-returns.service',()=>({fulfillmentReturnsService:{decide:vi.fn()}}));
afterEach(()=>vi.restoreAllMocks());
it('does not turn a confirmed mutation into failure if review invalidation fails',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 vi.spyOn(client,'invalidateQueries').mockRejectedValue(new Error('Refresh failed'));
 const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 const {result,unmount}=renderHook(()=>useOperationsReview({site:'site',country:'ET'},'actor','warehouse_manager','ALL','active',0),{wrapper});
 await act(async()=>{await expect(result.current.note.mutateAsync({site:'site',country:'ET',source:'job',id:'job',fingerprint:'current',reason:'Reviewed evidence'})).resolves.toEqual({id:'saved',saved:true});});
 expect(operationsReviewService.note).toHaveBeenCalledTimes(1);
 await waitFor(()=>expect(result.current.note.isSuccess).toBe(true));
 unmount();client.clear();
});
