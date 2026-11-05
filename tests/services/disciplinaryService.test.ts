import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:mock}));
import {disciplinaryService,type NoticeInput} from '../../services/disciplinary.service';
const id='11111111-1111-4111-8111-111111111111';
const employee='22222222-2222-4222-8222-222222222222';
const input:NoticeInput={country_code:'ET',site_id:'warehouse',employee_id:employee,employee_name:'Worker',record_type:'Written Warning',severity:'Medium',title:'Attendance evidence',description:'Recorded shift absence evidence',action_taken:'Review with employee',issued_by:'Untrusted caller',issued_by_role:'group_ceo'};
const record={...input,id,site_id:'warehouse',issued_by:'Authenticated HR',issued_by_id:'33333333-3333-4333-8333-333333333333',appeal_status:'None',issued_at:'2026-11-06T06:00:00Z',created_at:'2026-11-06T06:00:00Z'};
beforeEach(()=>vi.clearAllMocks());
describe('trusted disciplinary persistence',()=>{
 it('confirms the saved UUID and lets the server derive country and issuer',async()=>{
  mock.rpc.mockResolvedValue({data:record,error:null});expect((await disciplinaryService.issueDisciplinaryNotice(input,id)).issued_by).toBe('Authenticated HR');
  expect(mock.rpc).toHaveBeenCalledWith('issue_disciplinary_notice',{p_id:id,p_employee:employee,p_input:expect.not.objectContaining({country_code:expect.anything(),issued_by:expect.anything()})});expect(mock.from).not.toHaveBeenCalled();
 });
 it('passes country, employee, site and bounded page to the authorized read command',async()=>{
  mock.rpc.mockResolvedValue({data:[{...record,country_code:'KE'}],error:null});expect((await disciplinaryService.fetchDisciplinaryRecords('KE',employee,'ke-store',2))[0].country_code).toBe('KE');
  expect(mock.rpc).toHaveBeenCalledWith('list_disciplinary_records',{p_country:'KE',p_employee:employee,p_site:'ke-store',p_page:2});
 });
 it('requires a confirmed pending appeal result',async()=>{mock.rpc.mockResolvedValue({data:{...record,appeal_status:'Pending Appeal'},error:null});expect(await disciplinaryService.fileAppeal(id,employee,'Employee appeal evidence')).toBe(true);expect(mock.rpc).toHaveBeenCalledWith('disciplinary_decision',{p_id:id,p_action:'appeal',p_notes:'Employee appeal evidence'});});
 it('propagates issuer self-review denial without a client-side fallback',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Independent authorized HR reviewer required')});await expect(disciplinaryService.resolveAppeal(id,'Upheld',{id:record.issued_by_id,name:'Issuer',role:'country_hr_director'},'Review of the evidence')).rejects.toThrow('Independent authorized HR reviewer required');expect(mock.from).not.toHaveBeenCalled();});
 it('does not treat a failed notice insert as a locally issued notice',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Save denied')});await expect(disciplinaryService.issueDisciplinaryNotice(input,id)).rejects.toThrow('Save denied');});
});
