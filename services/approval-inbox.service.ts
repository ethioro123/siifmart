import { supabase } from '../lib/supabase';
import type { ProductApprovalInbox } from '../types/approvalInbox';
export const approvalInboxService = {
  async productReviews(countryCode: string): Promise<ProductApprovalInbox> {
    const { data, error } = await supabase.rpc('get_my_product_approval_inbox', {
      p_country_code: countryCode.toUpperCase(), p_limit: 5
    });
    if (error) throw error;
    return data as ProductApprovalInbox;
  }
};
