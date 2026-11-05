import { useQuery } from '@tanstack/react-query';
import { disciplinaryService } from '../services/disciplinary.service';
export function useDisciplinaryRecords(userId:string|undefined,country:string,siteId:string|undefined,page:number,role?:string) {
 return useQuery({queryKey:['disciplinary',userId,role,country,siteId||null,page],enabled:!!userId&&!!country,
  queryFn:()=>disciplinaryService.fetchDisciplinaryRecords(country,undefined,siteId,page),staleTime:30000,gcTime:0,retry:false,meta:{persist:false}});
}
