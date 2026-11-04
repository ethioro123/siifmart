import { logger } from '../utils/logger';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { operationsReviewService as service } from '../services/operations-review.service';
import { discrepancyService } from '../services/discrepancy.service';
import { floorAuditService } from '../services/floor-audit.service';
import { fulfillmentReturnsService } from '../services/fulfillment-returns.service';
import type { Operation,OperationMode,ReviewScope,ReviewSelection } from '../types/operations-review';
export function useOperationsReview(scope:ReviewScope,actor:string,role:string,operation:Operation,mode:OperationMode,page:number,selected?:ReviewSelection,evidencePage=0){
 const client=useQueryClient();const key=['operations-review',scope.country,scope.site,actor,role];
 const evidenceScope={...scope,site:selected?.site_id||scope.site};
 const enabled=Boolean(scope.site&&scope.country&&actor);
 const queue=useQuery({queryKey:[...key,'queue',operation,mode,page],queryFn:()=>service.queue(scope,operation,mode,page),enabled,staleTime:0});
 const detail=useQuery({queryKey:[...key,'detail',selected?.source,selected?.id,evidenceScope.site,evidencePage],queryFn:()=>service.detail(evidenceScope,selected!,evidencePage),enabled:enabled&&!!selected&&selected.source!=='receipt',staleTime:0});
 const refresh=async()=>{await client.invalidateQueries({queryKey:key});};
 const refreshAfterSave=async()=>{try{await refresh();}catch(error){logger.warn('OperationsReview','Decision saved; refreshing review data failed');}};
 const note=useMutation({mutationFn:service.note,onSuccess:refreshAfterSave});
 const resolve=useMutation({mutationFn:discrepancyService.resolveFloor,onSuccess:refreshAfterSave});
 const audit=useMutation({mutationFn:floorAuditService.review,onSuccess:refreshAfterSave});
 const credit=useMutation({mutationFn:(v:{id:string;approve:boolean;reason:string})=>fulfillmentReturnsService.decide(v.id,v.approve,v.reason),onSuccess:refreshAfterSave});
 const openJob=useMutation({mutationFn:(id:string)=>service.openJob(evidenceScope,id)});
 return {queue,detail,note,resolve,audit,credit,refresh,openJob};
}
