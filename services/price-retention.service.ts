import { supabase } from '../lib/supabase';
export interface PriceRetentionHold {
  id:string;reason:string;placed_at:string;placed_by:string;released_at:string|null;
}
export interface PriceHoldStatus { canManage:boolean;hold:PriceRetentionHold|null }
export const priceRetentionService={
  async status(productId:string,country:string):Promise<PriceHoldStatus>{
    const {data,error}=await supabase.rpc('get_product_price_hold',{p_product_id:productId,p_country_code:country.toUpperCase()});
    if(error)throw error;return data as PriceHoldStatus;
  },
  async manage(productId:string,country:string,reason:string,release:boolean):Promise<void>{
    if(reason.trim().length<3 || reason.trim().length>1200)throw new Error('Provide a reason between 3 and 1200 characters.');
    const {error}=await supabase.rpc('manage_product_price_hold',{p_product_id:productId,p_country_code:country.toUpperCase(),p_reason:reason.trim(),p_release:release});if(error)throw error;
  }
};
