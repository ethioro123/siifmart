import { supabase } from '../lib/supabase';
export interface ReturnSaleLine {id:string;productId:string;name:string;quantity:number;price:number}
export interface ReturnSale {id:string;siteId:string;countryCode:string;currency:string;receiptNumber:string;items:ReturnSaleLine[];total:number}
export interface ReturnInput {saleItemId:string;quantity:number;reason:string;condition:string;action:string}
export interface ReturnRequest {id:string;sale_id:string;site_id:string;country_code:string;currency:string;lines:Array<ReturnInput & {name:string;refundAmount:number}>;refund_amount:number;status:'pending'|'approved'|'rejected';requested_by:string;requested_at:string}
export const fulfillmentReturnsService={
 async lookup(ref:string,site:string,country:string):Promise<ReturnSale>{
  if(!ref.trim()||!site||!country)throw new Error('Exact receipt and facility required');
  const {data,error}=await supabase.rpc('return_sale_lookup',{p_ref:ref.trim(),p_site:site,p_country:country});if(error)throw error;
  if(!data?.id||!Array.isArray(data.items))throw new Error('Receipt details were not confirmed');return data;
 },
 async submit(request:string,sale:ReturnSale,lines:ReturnInput[]):Promise<{id:string;status:string;refundAmount:number}>{
  const {data,error}=await supabase.rpc('submit_fulfillment_return',{p_request:request,p_sale:sale.id,p_site:sale.siteId,p_country:sale.countryCode,p_lines:lines});if(error)throw error;
  if(!data?.id||!data.status)throw new Error('Return request was not confirmed');return data;
 },
 async list(site:string,country:string,page=1,history=false):Promise<{data:ReturnRequest[];count:number}>{
  if(!site||!country)throw new Error('Facility and country required');
  let q=supabase.from('fulfillment_return_requests').select('id,sale_id,site_id,country_code,currency,lines,refund_amount,status,requested_by,requested_at',{count:'exact'}).eq('site_id',site).eq('country_code',country);
  q=history?q.in('status',['approved','rejected']):q.eq('status','pending');
  const {data,error,count}=await q.order('requested_at',{ascending:false}).order('id').range((page-1)*25,page*25-1);if(error)throw error;return {data:data||[],count:count||0};
 },
 async decide(id:string,approve:boolean,reason:string){
  const {data,error}=await supabase.rpc('decide_fulfillment_return',{p_request:id,p_approve:approve,p_reason:reason.trim()});if(error)throw error;
  if(!data?.id||!['approved','rejected'].includes(data.status))throw new Error('Return decision was not confirmed');return data;
 },
 /** Compatibility callers submit a pending intake; they cannot refund and increment stock independently. */
 async requestByProduct(saleId:string,items:Array<{product_id:string;quantity:number;reason?:string;condition?:string;action?:string}>,requestId:string=crypto.randomUUID()){
  const {data,error}=await supabase.from('sales').select('id,site_id,country_code,sale_items(id,product_id)').eq('id',saleId).single();if(error)throw error;
  const sale=await this.lookup(saleId,data.site_id,data.country_code);
  const lines=items.map(item=>{const matches=(data.sale_items||[]).filter(line=>line.product_id===item.product_id);if(matches.length!==1)throw new Error('Select the exact original sale line for this return');return {saleItemId:matches[0].id,quantity:item.quantity,reason:item.reason||'Return requires supervisor review',condition:item.condition||'Damaged',action:item.action||'Repair'};});
  return this.submit(requestId,sale,lines);
 }
};
