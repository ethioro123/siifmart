import {useRef,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {fulfillmentReturnsService,ReturnInput,ReturnSale} from '../services/fulfillment-returns.service';
export function useFulfillmentReturns(site:string,country:string,worker:string,mode:'intake'|'pending'|'history',page:number){
 const cache=useQueryClient();
 const key=['fulfillment-returns',site,country,worker];
 const retry=useRef<{signature:string;id:string}|null>(null);
 const [sale,setSale]=useState<ReturnSale|null>(null);
 const lookup=useMutation({mutationFn:(ref:string)=>fulfillmentReturnsService.lookup(ref,site,country),onSuccess:setSale});
 const requests=useQuery({queryKey:[...key,mode,page],queryFn:()=>fulfillmentReturnsService.list(site,country,page,mode==='history'),enabled:!!site&&!!country&&!!worker&&mode!=='intake',staleTime:15000});
 const submit=useMutation({mutationFn:async(lines:ReturnInput[])=>{
  if(!sale||sale.siteId!==site||sale.countryCode!==country)throw new Error('Return scope changed');
  const signature=JSON.stringify([sale.id,site,country,worker,lines]);
  if(retry.current?.signature!==signature)retry.current={signature,id:crypto.randomUUID()};
  return fulfillmentReturnsService.submit(retry.current.id,sale,lines);
 },onSuccess:()=>{retry.current=null;setSale(null);cache.invalidateQueries({queryKey:key});}});
 const decide=useMutation({mutationFn:(input:{id:string;approve:boolean;reason:string})=>fulfillmentReturnsService.decide(input.id,input.approve,input.reason),onSuccess:()=>cache.invalidateQueries({queryKey:key})});
 return {sale,setSale,lookup,requests,submit,decide};
}
