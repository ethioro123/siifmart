import {useMutation,useQueryClient} from '@tanstack/react-query';
import {packingExecutionService} from '../services/packing-execution.service';
export function useRecoverPackHandoff(){const client=useQueryClient();return useMutation({mutationFn:packingExecutionService.complete,onSuccess:async()=>{await client.invalidateQueries({queryKey:['jobs']});}});}
