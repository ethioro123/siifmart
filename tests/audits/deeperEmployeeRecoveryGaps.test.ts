// @vitest-environment jsdom
import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),employee:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mock.rpc,from:mock.from}}));
vi.mock('../../services/employees.service',()=>({employeesService:{getById:mock.employee}}));
const id='11111111-1111-4111-8111-111111111111';
beforeEach(()=>{vi.resetModules();vi.clearAllMocks();localStorage.clear();mock.rpc.mockResolvedValue({data:null,error:new Error('Permission denied')});});
it('propagates denied notice persistence without fabricating success',async()=>{
 const {disciplinaryService}=await import('../../services/disciplinary.service');
 await expect(disciplinaryService.issueDisciplinaryNotice({country_code:'ET',employee_id:id,employee_name:'Audit employee',record_type:'Written Warning',severity:'High',title:'Audit notice',description:'Recorded personnel evidence',action_taken:'Review',issued_by:'Untrusted name',issued_by_role:'group_ceo'},id)).rejects.toThrow('Permission denied');
 expect(mock.from).not.toHaveBeenCalled();expect(localStorage.getItem('siifmart_disciplinary_backup')).toBeNull();
});
it('clears old personnel backup and fails closed on a denied read',async()=>{
 localStorage.setItem('siifmart_disciplinary_backup','[{"confidential_notes":"Private"}]');const {disciplinaryService}=await import('../../services/disciplinary.service');
 await expect(disciplinaryService.fetchDisciplinaryRecords('ET')).rejects.toThrow('Permission denied');expect(localStorage.getItem('siifmart_disciplinary_backup')).toBeNull();
});
it('propagates a refused appeal',async()=>{const {disciplinaryService}=await import('../../services/disciplinary.service');await expect(disciplinaryService.fileAppeal(id,id,'Review this evidence')).rejects.toThrow('Permission denied');});
it('propagates a refused adjudication and requires a reason',async()=>{const {disciplinaryService}=await import('../../services/disciplinary.service');await expect(disciplinaryService.resolveAppeal(id,'Upheld',{id,name:'HR',role:'regional_hr_manager'},'Evidence examined')).rejects.toThrow('Permission denied');});
it('recruitment uses one trusted activation and never inserts Active employees from the client',async()=>{
 mock.rpc.mockResolvedValue({data:id,error:null});mock.employee.mockResolvedValue({id,status:'Active'});const {recruitmentService}=await import('../../services/recruitment.service');
 expect(await recruitmentService.finalizeAndActivateHire(id,{id:'actor',name:'HR',role:'country_hr_director'},'site','picker','Operations')).toEqual({id,status:'Active'});
 expect(mock.rpc).toHaveBeenCalledWith('activate_candidate',{p_candidate:id,p_department:'Operations'});expect(mock.from).not.toHaveBeenCalled();
});
