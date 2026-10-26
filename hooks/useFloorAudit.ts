import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {floorAuditService,type AuditScope} from '../services/floor-audit.service';
export function useFloorAudit(scope:AuditScope,userId:string|undefined,page:number,enabled:boolean){
 const client=useQueryClient();
 const query=useQuery({queryKey:['floor-audit',userId,scope.country,scope.siteId,scope.kind,scope.id,page],queryFn:()=>floorAuditService.load(scope,page),enabled:enabled&&!!userId&&!!scope.siteId&&!!scope.country,staleTime:0});
 const review=useMutation({mutationFn:floorAuditService.review,onSuccess:async()=>{await Promise.all([client.invalidateQueries({queryKey:['floor-audit']}),client.invalidateQueries({queryKey:['worker_points']})]);window.dispatchEvent(new CustomEvent('warehouse-points-review-saved',{detail:{siteId:scope.siteId,country:scope.country}}));}});
 return {query,review};
}
