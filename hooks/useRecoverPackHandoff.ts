import {useMutation,useQueryClient} from '@tanstack/react-query';
import {packingExecutionService} from '../services/packing-execution.service';
export function useRecoverPackHandoff(){const client=useQueryClient();return useMutation({mutationFn:packingExecutionService.complete,onSuccess:async()=>{await client.invalidateQueries({queryKey:['jobs']});}});}

export function useRecoverPackByReference(){const client=useQueryClient();return useMutation({mutationFn:async({reference,siteId,country}:{reference:string;siteId:string;country:string})=>{
 const id=await packingExecutionService.findCompleted(reference,siteId,country);return packingExecutionService.complete(id);
},onSuccess:async()=>{await client.invalidateQueries({queryKey:['jobs']});}});}
