import { supabase } from '../lib/supabase';

export interface CampaignProposal {
  id: string;
  country_code: string;
  region_code: string | null;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  expiry_date: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  requested_by_employee_id: string;
}

export const merchandisingCampaignsService = {
  async list(countryCode: string): Promise<CampaignProposal[]> {
    const { data, error } = await supabase.from('merchandising_campaign_proposals')
      .select('id,country_code,region_code,code,discount_type,discount_value,expiry_date,status,requested_at,requested_by_employee_id')
      .eq('country_code', countryCode.toUpperCase())
      .order('requested_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []) as CampaignProposal[];
  },

  async create(input: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; expiryDate: string }): Promise<void> {
    const { error } = await supabase.from('merchandising_campaign_proposals').insert({
      code: input.code.trim().toUpperCase(),
      discount_type: input.type,
      discount_value: input.value,
      expiry_date: input.expiryDate
    });
    if (error) throw error;
  },

  async approve(id: string): Promise<void> {
    const { error } = await supabase.rpc('approve_merchandising_campaign', { p_proposal_id: id });
    if (error) throw error;
  }
};
