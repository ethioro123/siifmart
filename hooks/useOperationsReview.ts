import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { operationsReviewService as service } from '../services/operations-review.service';
import { discrepancyService } from '../services/discrepancy.service';
import { floorAuditService } from '../services/floor-audit.service';
import { fulfillmentReturnsService } from '../services/fulfillment-returns.service';
import type { Operation,OperationMode,ReviewScope,ReviewSelection } from '../types/operations-review';
export function useOperationsReview(scope:ReviewScope,actor:string,role:string,operation:Operation,mode:OperationMode,page:number,selected?:ReviewSelection,evidencePage=0){
 const client=useQueryClient();const key=['operations-review',scope.country,scope.site,actor,role];
 const enabled=Boolean(scope.site&&scope.country&&actor);
 const queue=useQuery({queryKey:[...key,'queue',operation,mode,page],queryFn:()=>service.queue(scope,operation,mode,page),enabled,staleTime:15000});
 const detail=useQuery({queryKey:[...key,'detail',selected?.source,selected?.id,evidencePage],queryFn:()=>service.detail(scope,selected!,evidencePage),enabled:enabled&&!!selected&&selected.source!=='receipt',staleTime:0});
 const refresh=async()=>{await client.invalidateQueries({queryKey:key});};
 const note=useMutation({mutationFn:service.note,onSuccess:refresh});
 const resolve=useMutation({mutationFn:discrepancyService.resolveFloor,onSuccess:refresh});
 const audit=useMutation({mutationFn:floorAuditService.review,onSuccess:refresh});
 const credit=useMutation({mutationFn:(v:{id:string;approve:boolean;reason:string})=>fulfillmentReturnsService.decide(v.id,v.approve,v.reason),onSuccess:refresh});
 const openJob=useMutation({mutationFn:(id:string)=>service.openJob(scope,id)});
 return {queue,detail,note,resolve,audit,credit,refresh,openJob};
}
