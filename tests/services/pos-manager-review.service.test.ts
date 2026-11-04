import { afterEach,expect,it,vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { posManagerReviewService as service } from '../../services/pos-manager-review.service';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
afterEach(()=>vi.clearAllMocks());
const scope={site:'11111111-1111-4111-8111-111111111111',country:'ET'};
const row={source:'sale' as const,id:'22222222-2222-4222-8222-222222222222',reference:'POS001',status:'Pending',actor_id:null,actor_name:null,occurred_at:'2026-11-05T00:00:00Z',exception:true};
it('loads a bounded scoped queue without mutating records',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:[row],error:null} as never);
 expect(await service.queue(scope,'receiving',false,2)).toEqual([row]);
 expect(supabase.rpc).toHaveBeenCalledWith('pos_manager_review_queue',{p_site:scope.site,p_country:'ET',p_source:'receiving',p_history:false,p_offset:50});
});
it('validates scope and pagination before calling the server',async()=>{
 await expect(service.queue({...scope,country:''},'sale',false,0)).rejects.toThrow();
 await expect(service.queue(scope,'sale',false,-1)).rejects.toThrow();
 expect(supabase.rpc).not.toHaveBeenCalled();
});
it('requires confirmed saved notes and preserves backend rejections',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValueOnce({data:{saved:false},error:null} as never);
 const input={...scope,source:'sale' as const,id:row.id,fingerprint:'evidence',reason:'Verified evidence'};
 await expect(service.note(input)).rejects.toThrow();
 vi.mocked(supabase.rpc).mockResolvedValueOnce({data:null,error:{message:'Independent manager required'}} as never);
 await expect(service.note(input)).rejects.toMatchObject({message:'Independent manager required'});
});
it('rejects evidence for another selected record',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:{summary:{...row,id:scope.site},fields:{},fingerprint:'evidence',can_note:true,can_controls:false,notes:[]},error:null} as never);
 await expect(service.detail(scope,row,0)).rejects.toThrow('identity mismatch');
});
