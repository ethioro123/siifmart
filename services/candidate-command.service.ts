import { z } from 'zod';
import { supabase } from '../lib/supabase';
export type CandidateDecision = 'hr' | 'manager' | 'finance' | 'executive';
export const candidateCommandService = {
 async decide(id:string,action:CandidateDecision,salary?:number,notes='Candidate evidence reviewed') {
  const {data,error}=await supabase.rpc('candidate_decision',{p_id:z.string().uuid().parse(id),p_action:action,p_salary:salary===undefined?null:z.number().finite().positive().max(100000000).parse(salary),p_notes:z.string().trim().min(3).max(2000).parse(notes)});
  if(error)throw error;
  const saved=z.object({id:z.string().uuid()}).passthrough().parse(data);
  if(saved.id!==id)throw new Error('Candidate clearance was not confirmed');return saved;
 },
 async activate(id:string,department:string) {
  const {data,error}=await supabase.rpc('activate_candidate',{p_candidate:z.string().uuid().parse(id),p_department:department});
  if(error)throw error;return z.string().uuid().parse(data);
 }
};
