import {supabase} from '../lib/supabase';
export interface QueueCursor{createdAt:string;id:string}
const JOB_COLUMNS='id,site_id,type,priority,status,items_count,assigned_to,location,order_ref,created_at,updated_at,line_items,job_number,source_site_id,dest_site_id,transfer_status,requested_by,approved_by,shipped_at,received_at,delivery_method,notes,has_discrepancy,discrepancy_details,tracking_number,received_by,delivered_at,completed_at,completed_by,external_carrier_name,assigned_by,country_code,pack_security_seal_serial';
export const TRANSFER_COLUMNS='id,source_site_id,dest_site_id,status,transfer_date,items,created_at,updated_at,notes,has_discrepancy,discrepancy_details,transfer_status,source_region_code,dest_region_code,country_code,is_inter_region,order_ref,requested_by,shipped_at,delivered_at,received_at,received_by,discrepancy_resolution_type,discrepancy_reason_code,discrepancy_resolved_by,discrepancy_resolved_at,driver_type,driver_id,driver_name,dispatched_at,dispatched_by,approved_by,approved_at,approved_by_role,approval_notes';
export const blindReceivingService={
 async jobs(siteId:string,country?:string,cursor?:QueueCursor){
  if(!siteId||!country)return [];
  let query=supabase.from('blind_receiving_wms').select(JOB_COLUMNS).eq('dest_site_id',siteId).eq('country_code',country).not('status','in','("Completed","Cancelled","Deleted")').order('created_at').order('id').limit(25);
  if(cursor)query=query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const {data,error}=await query;
  if(error)throw error;return data||[];
 },
 async transfers(siteId:string,country?:string,cursor?:QueueCursor){
  if(!siteId||!country)return [];
  let query=supabase.from('blind_receiving_transfers').select(TRANSFER_COLUMNS).eq('dest_site_id',siteId).eq('country_code',country).not('status','in','("Received","Cancelled","Completed","Rejected")').order('created_at').order('id').limit(25);
  if(cursor)query=query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const {data,error}=await query;
  if(error)throw error;return data||[];
 }
};
