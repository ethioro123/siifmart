import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { posManagerReviewService as service } from '../services/pos-manager-review.service';
import { posReviewRoles,type PosReviewScope,type PosReviewSource,type PosReviewRow } from '../types/pos-manager-review';
import { logger } from '../utils/logger';
export function usePosManagerReview(scope:PosReviewScope,user:string,role:string,source:PosReviewSource,history:boolean,page:number,row?:PosReviewRow,notesPage=0){
 const client=useQueryClient();const key=['pos-manager-review',scope.country,scope.site,user,role];
 const enabled=!!scope.site&&!!scope.country&&!!user&&posReviewRoles.includes(role);
 const queue=useQuery({queryKey:[...key,'queue',source,history,page],queryFn:()=>service.queue(scope,source,history,page),enabled,staleTime:0});
 const detail=useQuery({queryKey:[...key,'detail',row?.source,row?.id,notesPage],queryFn:()=>service.detail(scope,row!,notesPage),enabled:enabled&&!!row,staleTime:0});
 const note=useMutation({mutationFn:service.note,onSuccess:async()=>{try{await client.invalidateQueries({queryKey:key});}catch{logger.warn('POSReview','Note saved; refresh unavailable');}}});
 return {queue,detail,note};
}
