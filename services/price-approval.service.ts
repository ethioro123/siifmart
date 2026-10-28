import { supabase } from '../lib/supabase';
import type { PriceApprovalRoute } from '../types/priceApproval';
export const priceApprovalService = {
  async routes(requestIds: string[]): Promise<Record<string,PriceApprovalRoute>> {
    if (!requestIds.length) return {};
    if (requestIds.length>100) throw new Error('Price review is limited to 100 proposals at a time.');
    const {data,error} = await supabase.rpc('get_price_approval_routes',{p_request_ids:requestIds});
    if(error) throw error;
    return data || {};
  }
};
