import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { inventoryRequestsService } from '../services/inventory-requests.service';
/** Fetch one explicitly linked stock request, even when it is outside the first list page. */
export function useInventoryReviewLink(){
 const {search}=useLocation();const {activeSite,effectiveCountry}=useData();const {user}=useStore();
 const id=new URLSearchParams(search).get('requestId')||'';
 const enabled=Boolean(z.string().uuid().safeParse(id).success&&activeSite?.id&&effectiveCountry&&user?.id);
 const query=useQuery({queryKey:['inventory_requests','review-link',user?.id,user?.role,effectiveCountry,activeSite?.id,id],enabled,staleTime:0,
 queryFn:async()=>{
  const rows=await inventoryRequestsService.getAll(activeSite!.id,effectiveCountry,1,undefined,1,false,id);
  const row=rows[0];
  if(!row||row.id!==id||row.siteId!==activeSite?.id||row.countryCode!==effectiveCountry)throw new Error('Stock review unavailable');
  return row;
 }});
 return {id,query};
}
