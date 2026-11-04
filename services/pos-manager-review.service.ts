import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { posReviewScope,posReviewRow,posReviewDetail,posReviewNote,posReviewSources,type PosReviewScope,type PosReviewSource,type PosReviewRow } from '../types/pos-manager-review';
export const posManagerReviewService={
 async queue(scope:PosReviewScope,source:PosReviewSource,history:boolean,page:number){
  posReviewScope.parse(scope);z.enum(posReviewSources).parse(source);z.number().int().min(0).max(4000).parse(page);
  const {data,error}=await supabase.rpc('pos_manager_review_queue',{p_site:scope.site,p_country:scope.country,p_source:source,p_history:history,p_offset:page*25});
  if(error)throw error;return z.array(posReviewRow).max(25).parse(data);
 },
 async detail(scope:PosReviewScope,row:PosReviewRow,page:number){
  posReviewScope.parse(scope);posReviewRow.parse(row);z.number().int().min(0).max(4000).parse(page);
  const {data,error}=await supabase.rpc('pos_manager_review_detail',{p_site:scope.site,p_country:scope.country,p_source:row.source,p_id:row.id,p_page:page});
  if(error)throw error;const result=posReviewDetail.parse(data);
  if(result.summary.id!==row.id||result.summary.source!==row.source)throw new Error('Review evidence identity mismatch');return result;
 },
 async note(input:z.infer<typeof posReviewNote>){
  const value=posReviewNote.parse(input);
  const {data,error}=await supabase.rpc('record_pos_manager_review',{p_site:value.site,p_country:value.country,p_source:value.source,p_id:value.id,p_fingerprint:value.fingerprint,p_reason:value.reason});
  if(error)throw error;return z.object({id:z.string().uuid(),saved:z.literal(true)}).parse(data);
 }
};
