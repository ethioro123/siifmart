import { z } from 'zod';
import { wmsJobsService } from './wms-jobs.service';
import { supabase } from '../lib/supabase';
import { operationRow,operationDetail,reviewScope,reviewSelection,reviewNoteInput,type ReviewScope,type ReviewSelection,type ReviewNoteInput,type Operation,type OperationMode } from '../types/operations-review';
export const operationsReviewService = {
 async queue(scope:ReviewScope,operation:Operation,mode:OperationMode,page:number){
  reviewScope.parse(scope);z.number().int().min(0).max(4000).parse(page);
  const {data,error}=await supabase.rpc('operations_review_queue',{p_site:scope.site,p_country:scope.country,p_operation:operation,p_mode:mode,p_offset:page*25});
  if(error)throw error;return z.array(operationRow).max(25).parse(data);
 },
 async detail(scope:ReviewScope,selection:ReviewSelection,page:number){
  reviewScope.parse(scope);reviewSelection.parse(selection);z.number().int().min(0).max(5000).parse(page);
  const {data,error}=await supabase.rpc('operations_review_detail',{p_site:scope.site,p_country:scope.country,p_source:selection.source,p_id:selection.id,p_page:page});
  if(error)throw error;return operationDetail.parse(data);
 },
 async openJob(scope:ReviewScope,id:string){
  reviewScope.parse(scope);z.string().uuid().parse(id);
  const job=await wmsJobsService.getById(id);
  if(!job||(job.countryCode||job.country_code)!==scope.country||![job.siteId,job.sourceSiteId,job.destSiteId].includes(scope.site))throw new Error('Job unavailable in this scope');
  return job;
 },
 async note(input:ReviewNoteInput){
  const v=reviewNoteInput.parse(input);
  const {data,error}=await supabase.rpc('record_operations_review',{p_site:v.site,p_country:v.country,p_source:v.source,p_id:v.id,p_fingerprint:v.fingerprint,p_reason:v.reason});
  if(error)throw error;return z.object({id:z.string().uuid(),saved:z.literal(true)}).parse(data);
 }
};
