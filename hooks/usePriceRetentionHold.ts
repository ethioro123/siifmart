import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { priceRetentionService } from '../services/price-retention.service';
import { useStore } from '../contexts/CentralStore';
export function usePriceRetentionHold(productId:string,country:string){
  const {user}=useStore();const client=useQueryClient();const key=['product-price-retention-hold',country,productId,user?.id,user?.role];
  const status=useQuery({queryKey:key,queryFn:()=>priceRetentionService.status(productId,country),enabled:Boolean(productId&&country&&user?.id),refetchOnWindowFocus:true});
  const manage=useMutation({mutationFn:({reason,release}:{reason:string;release:boolean})=>priceRetentionService.manage(productId,country,reason,release),onSuccess:()=>client.invalidateQueries({queryKey:key})});
  return {status,manage};
}
