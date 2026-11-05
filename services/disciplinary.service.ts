import { z } from 'zod';
import { supabase } from '../lib/supabase';
import type { DisciplinaryRecord, DisciplinaryType, DisciplinarySeverity } from '../types/hr-advanced';
const legacyKey = 'siifmart_disciplinary_backup';
function clearLegacyCache() { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(legacyKey); } catch { /* No fallback for personnel data. */ } }
clearLegacyCache();
const recordSchema = z.object({ id: z.string().uuid(), employee_id: z.string().uuid(), country_code: z.string().length(2), site_id: z.string(), employee_name: z.string(), record_type: z.enum(['Verbal Warning','Written Warning','Final Warning','Suspension','Grievance','Formal Investigation']), severity: z.enum(['Low','Medium','High','Critical']), title: z.string(), description: z.string(), action_taken: z.string(), appeal_status: z.enum(['None','Pending Appeal','Upheld','Overturned']), issued_by: z.string(), issued_by_role: z.string(), issued_at: z.string(), created_at: z.string(), confidential_notes: z.string().nullish(), expires_at: z.string().nullish(), issued_by_id: z.string().uuid().nullish(), reviewed_by_id: z.string().uuid().nullish(), appeal_notes: z.string().nullish(), decision_reason: z.string().nullish() });
function mapRecord(value: unknown): DisciplinaryRecord {
 const r=recordSchema.parse(value); return { ...r, expires_at:r.expires_at||undefined,confidential_notes:r.confidential_notes||undefined,issued_by_id:r.issued_by_id||undefined,reviewed_by_id:r.reviewed_by_id||undefined,appeal_notes:r.appeal_notes||undefined,decision_reason:r.decision_reason||undefined };
}
export interface NoticeInput { country_code:string;site_id?:string;employee_id:string;employee_name:string;record_type:DisciplinaryType;severity:DisciplinarySeverity;title:string;description:string;action_taken:string;issued_by:string;issued_by_role:string;expires_at?:string;confidential_notes?:string }
export const disciplinaryService = {
 async fetchDisciplinaryRecords(countryCode:string, employeeId?:string,siteId?:string,page=1):Promise<DisciplinaryRecord[]> {
  clearLegacyCache(); const {data,error}=await supabase.rpc('list_disciplinary_records',{p_country:countryCode,p_site:siteId&&siteId!=='All'?siteId:null,p_employee:employeeId||null,p_page:page});
  if(error)throw error;return z.array(z.unknown()).parse(data).map(mapRecord);
 },
 async issueDisciplinaryNotice(input:NoticeInput,id:string=crypto.randomUUID()):Promise<DisciplinaryRecord>{
  const payload={record_type:input.record_type,severity:input.severity,title:input.title.trim(),description:input.description.trim(),action_taken:input.action_taken.trim(),expires_at:input.expires_at||null,confidential_notes:input.confidential_notes||null};
  z.object({title:z.string().min(3).max(200),description:z.string().min(10).max(5000),action_taken:z.string().min(3).max(2000)}).parse(payload);
  const {data,error}=await supabase.rpc('issue_disciplinary_notice',{p_id:id,p_employee:z.string().uuid().parse(input.employee_id),p_input:payload});if(error)throw error;
  const saved=mapRecord(data);if(saved.id!==id)throw new Error('Notice save was not confirmed');return saved;
 },
 async fileAppeal(recordId:string,_employeeId:string,notes:string):Promise<boolean>{
  return this.decide(recordId,'appeal',notes);
 },
 async resolveAppeal(recordId:string,resolution:'Upheld'|'Overturned',_reviewer:{id:string;name:string;role:string},notes?:string):Promise<boolean>{return this.decide(recordId,resolution,notes||'');},
 async decide(id:string,action:'appeal'|'Upheld'|'Overturned',notes:string):Promise<boolean>{
  const reason=z.string().trim().min(10).max(5000).parse(notes);
  const {data,error}=await supabase.rpc('disciplinary_decision',{p_id:id,p_action:action,p_notes:reason});if(error)throw error;
  const saved=mapRecord(data);if(saved.id!==id||saved.appeal_status!==(action==='appeal'?'Pending Appeal':action))throw new Error('Disciplinary decision was not confirmed');return true;
 }
};
