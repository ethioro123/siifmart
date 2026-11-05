import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),employee:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mock.rpc,from:mock.from}}));
vi.mock('../../services/employees.service',()=>({employeesService:{getById:mock.employee}}));
import {recruitmentService} from '../../services/recruitment.service';
const id='11111111-1111-4111-8111-111111111111';
const untrusted={id:'caller-supplied-id',name:'Caller supplied name',role:'group_ceo'};
beforeEach(()=>{vi.clearAllMocks();mock.rpc.mockResolvedValue({data:{id},error:null});});
describe('trusted delegated recruitment',()=>{
 it('keeps floor roles out of hiring management',()=>{expect(recruitmentService.canManageHiring('picker')).toBe(false);expect(recruitmentService.canManageHiring('warehouse_manager')).toBe(true);});
 it('reserves higher roles from lower-level hiring forms',()=>{expect(recruitmentService.getAllowedRolesForManager('warehouse_manager').map(role=>role.id)).not.toContain('group_ceo');});
 it('records HR through the server without submitting an invented approver',async()=>{await recruitmentService.approveCandidateHR(id,untrusted,'Credentials reviewed');expect(mock.rpc).toHaveBeenCalledWith('candidate_decision',{p_id:id,p_action:'hr',p_salary:null,p_notes:'Credentials reviewed'});expect(mock.from).not.toHaveBeenCalled();});
 it('records compensation through independent Finance command',async()=>{await recruitmentService.approveCandidateSalaryFinance(id,untrusted,100,'Budget reviewed');expect(mock.rpc).toHaveBeenCalledWith('candidate_decision',{p_id:id,p_action:'finance',p_salary:100,p_notes:'Budget reviewed'});});
 it('records a separate hiring-manager decision',async()=>{await recruitmentService.confirmCandidateHiringManager(id,untrusted,'Need confirmed');expect(mock.rpc).toHaveBeenCalledWith('candidate_decision',{p_id:id,p_action:'manager',p_salary:null,p_notes:'Need confirmed'});});
 it('propagates a denied decision even when the caller claims CEO authority',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Independent reviewer required')});await expect(recruitmentService.approveCandidateHR(id,untrusted,'Review reason')).rejects.toThrow('Independent reviewer required');});
 it('activates atomically through the saved candidate identity and reads the confirmed employee',async()=>{mock.rpc.mockResolvedValue({data:id,error:null});mock.employee.mockResolvedValue({id,status:'Active'});expect(await recruitmentService.finalizeAndActivateHire(id,untrusted,'untrusted-site','untrusted-role','Operations')).toEqual({id,status:'Active'});expect(mock.rpc).toHaveBeenCalledWith('activate_candidate',{p_candidate:id,p_department:'Operations'});expect(mock.from).not.toHaveBeenCalled();});
 it('does not provision an employee after activation rejection',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Finance and executive clearance required')});await expect(recruitmentService.finalizeAndActivateHire(id,untrusted)).rejects.toThrow('Finance and executive clearance required');expect(mock.employee).not.toHaveBeenCalled();});
});
