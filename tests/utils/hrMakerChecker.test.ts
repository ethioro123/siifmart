import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:mock}));
import {payrollRunsService} from '../../services/payroll-runs.service';
import {disciplinaryService} from '../../services/disciplinary.service';
import {recruitmentService} from '../../services/recruitment.service';
import {hasPermission} from '../../utils/permissions';
import {canEmployRole} from '../../utils/roles';
const id='11111111-1111-4111-8111-111111111111';
beforeEach(()=>vi.clearAllMocks());
describe('HR maker-checker trusted command contracts',()=>{
 it('uses confirmed HR checker identity rather than supplied names',async()=>{
  mock.rpc.mockResolvedValue({data:{id,status:'pending_finance',hr_approved_by_id:'authenticated-hr',hr_approved_by:'Verified HR'},error:null});
  const result=await payrollRunsService.signAsHR(id,'Spoofed name','group_ceo','Roster reviewed');expect(result.hrApprovedById).toBe('authenticated-hr');
  expect(mock.rpc).toHaveBeenCalledWith('payroll_command',expect.objectContaining({p_run:id,p_action:'hr'}));expect(mock.from).not.toHaveBeenCalled();
 });
 it('propagates the server refusal when one person tries both payroll signatures',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Independent Finance reviewer required')});await expect(payrollRunsService.signAsFinance(id,'Other name','country_finance_director','Review reason')).rejects.toThrow('Independent Finance reviewer required');});
 it('accepts separately confirmed Finance authorization',async()=>{mock.rpc.mockResolvedValue({data:{id,status:'approved',hr_approved_by_id:'hr',finance_approved_by_id:'finance'},error:null});const result=await payrollRunsService.signAsFinance(id,'Caller','country_finance_director','Budget reviewed');expect(result.financeApprovedById).toBe('finance');expect(result.hrApprovedById).toBe('hr');expect(result.status).toBe('approved');});
 it('propagates notice issuer self-adjudication denial',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Independent authorized HR reviewer required')});await expect(disciplinaryService.resolveAppeal(id,'Overturned',{id:'issuer',name:'Issuer',role:'country_hr_director'},'Evidence review reason')).rejects.toThrow('Independent authorized HR reviewer required');});
 it('accepts a confirmed independent appeal decision with a reason',async()=>{mock.rpc.mockResolvedValue({data:{id,employee_id:'22222222-2222-4222-8222-222222222222',country_code:'ET',site_id:'warehouse',employee_name:'Worker',record_type:'Written Warning',severity:'Medium',title:'Notice',description:'Recorded personnel evidence',action_taken:'Review',appeal_status:'Overturned',issued_by:'Issuer',issued_by_role:'regional_hr_manager',issued_at:'2026-11-06',created_at:'2026-11-06'},error:null});expect(await disciplinaryService.resolveAppeal(id,'Overturned',{id:'reviewer',name:'Reviewer',role:'country_hr_director'},'Independent evidence reviewed')).toBe(true);});
 it('rejects hiring when the trusted activation command refuses missing review evidence',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Saved independent HR and hiring-manager evidence required')});await expect(recruitmentService.finalizeAndActivateHire(id,{id:'caller',name:'Manager',role:'group_ceo'})).rejects.toThrow('Saved independent HR and hiring-manager evidence required');});
 it('restricts candidate hire approval permissions to authorized roles',()=>{expect(hasPermission('country_hr_director','APPROVE_EMPLOYEE')).toBe(true);for(const role of ['talent_recruiter','payroll_specialist','training_coordinator'] as const)expect(hasPermission(role,'APPROVE_EMPLOYEE')).toBe(false);});
 it('retains appointment rank restrictions',()=>{expect(canEmployRole('talent_recruiter','cashier')).toBe(false);expect(canEmployRole('country_hr_director','cashier')).toBe(true);});
});
