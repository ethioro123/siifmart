import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { floorDiscrepancy } from '../types/floor-discrepancy';
export const auditRow = floorDiscrepancy.extend({ manifest:z.record(z.string(),z.unknown()),job_number:z.string().nullable(),finding:z.string().nullable(),responsible_name:z.string().nullable(),reviewer_name:z.string().nullable(),responsible_id:z.string().nullable(),review_notes:z.string().nullable(),reviewer_id:z.string().nullable(),reviewed_at:z.string().nullable(),awarded_points:z.number(),job_status:z.string() });
export type FloorAuditRow = z.infer<typeof auditRow>;
export type AuditScope = {siteId:string;country:string;kind:'job'|'product'|'employee';id:string};
const reviewInput=z.object({jobId:z.string().uuid(),discrepancyId:z.string().uuid(),finding:z.enum(['counting_correction','stock_issue','confirmed_handling_error','undetermined']),responsibleId:z.string().uuid().nullable(),notes:z.string().trim().min(3).max(500)}).strict();
export const floorAuditService={
 async load(scope:AuditScope,page:number){
  z.string().uuid().parse(scope.id);z.string().uuid().parse(scope.siteId);z.number().int().min(0).max(5000).parse(page);
  const {data,error}=await supabase.rpc('floor_audit_timeline',{p_site_id:scope.siteId,p_country:scope.country,p_kind:scope.kind,p_id:scope.id,p_offset:page*20});
  if(error)throw error;return z.array(auditRow).max(20).parse(data);
 },
 async review(input:z.infer<typeof reviewInput>){const v=reviewInput.parse(input);
  const {data,error}=await supabase.rpc('review_floor_discrepancy',{p_job_id:v.jobId,p_discrepancy_id:v.discrepancyId,p_finding:v.finding,p_responsible_id:v.responsibleId,p_notes:v.notes});
  if(error)throw error;if(data?.discrepancy_id!==v.discrepancyId||!data?.reviewed_at)throw new Error('Review was not confirmed.');return data;
 }
};
