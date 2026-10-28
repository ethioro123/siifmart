import { beforeEach, expect, it, vi } from 'vitest';
import { markdownPlanningService } from '../../services/markdown-planning.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
const rpc=vi.mocked(supabase.rpc);
beforeEach(()=>vi.clearAllMocks());
it('generates server evidence without passing cached sales or cost',async()=>{
 rpc.mockResolvedValue({data:{token:'token',stages:[{price:90}]},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 expect((await markdownPlanningService.generate('product','ET','2026-11-01')).token).toBe('token');
 expect(rpc).toHaveBeenCalledWith('generate_markdown_plan',{p_product:'product',p_country:'ET',p_deadline:'2026-11-01'});
});
it('submits only the server token and stage, not browser prices or identity',async()=>{
 rpc.mockResolvedValue({data:{saved:true,requestId:'request'},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 expect((await markdownPlanningService.submit('token',1)).saved).toBe(true);
 expect(rpc).toHaveBeenCalledWith('submit_markdown_plan',{p_token:'token',p_stage:1});
});
it('fails closed for invalid plans, unconfirmed writes and server errors',async()=>{
 rpc.mockResolvedValue({data:{stages:[]},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(markdownPlanningService.generate('p','ET','2026-11-01')).rejects.toThrow('valid clearance plan');
 await expect(markdownPlanningService.submit('token',0)).rejects.toThrow('could not be confirmed');
 rpc.mockResolvedValue({data:null,error:{message:'Product changed'}} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(markdownPlanningService.submit('token',0)).rejects.toMatchObject({message:'Product changed'});
});
