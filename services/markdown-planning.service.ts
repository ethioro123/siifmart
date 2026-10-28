import { supabase } from '../lib/supabase';
import type { MarkdownGlidePathSimulation, GlidePathStage } from '../utils/markdownGlidePath';
export interface SelectedPriceImpact { units:number; remaining:number; revenue:number; revenueAtCurrentPrice:number; marginPct:number|null }
export interface ServerMarkdownPlan extends Omit<MarkdownGlidePathSimulation,'projectedMarginPct'|'totalLandedCost'|'stages'> {
    token:string; deadline:string; asOf:string; windowStart:string; unitsSold30d:number; unitsSold7d:number;
    currentPrice:number; expiryDate:string|null; costProtected:boolean; projectedMarginPct:number|null; totalLandedCost:number|null;
    stages:Array<GlidePathStage & {selectedImpact:SelectedPriceImpact}>;
}
export const markdownPlanningService={
    async generate(productId:string,country:string,deadline:string):Promise<ServerMarkdownPlan> {
        const {data,error}=await supabase.rpc('generate_markdown_plan',{p_product:productId,p_country:country,p_deadline:deadline});
        if(error)throw error;
        if(!data || typeof data.token!=='string' || !Array.isArray(data.stages) || !data.stages.length) throw new Error('The server did not return a valid clearance plan.');
        return data as ServerMarkdownPlan;
    },
    async submit(token:string,stage:number):Promise<{requestId:string;saved:true}> {
        const {data,error}=await supabase.rpc('submit_markdown_plan',{p_token:token,p_stage:stage});
        if(error)throw error;
        if(!data?.saved || typeof data.requestId!=='string') throw new Error('The proposal save could not be confirmed.');
        return data;
    }
};
