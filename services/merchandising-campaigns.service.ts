import { supabase } from '../lib/supabase';

export interface CampaignProposal {
  id: string;
  scope_site_id: string;
  country_code: string;
  region_code: string | null;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  expiry_date: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_employee_id: string;
  requested_at: string;
  approved_by_employee_id?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  rejected_by_employee_id?: string | null;
  rejected_at?: string | null;
  requester?: { name: string; role: string } | null;
  approver?: { name: string; role: string } | null;
  rejector?: { name: string; role: string } | null;
}

export interface CampaignListParams {
  countryCode: string;
  regionCode?: string | null;
  siteId?: string | null;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  page?: number;
  pageSize?: number;
}

export interface CampaignListResult {
  proposals: CampaignProposal[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const merchandisingCampaignsService = {
  async list(params: CampaignListParams | string): Promise<CampaignListResult> {
    const options: CampaignListParams = typeof params === 'string'
      ? { countryCode: params, page: 1, pageSize: 25, status: 'all' }
      : {
          countryCode: params.countryCode,
          regionCode: params.regionCode,
          siteId: params.siteId,
          status: params.status || 'all',
          page: Math.max(1, params.page || 1),
          pageSize: Math.min(100, Math.max(5, params.pageSize || 25))
        };

    const page = options.page || 1;
    const pageSize = options.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('merchandising_campaign_proposals')
      .select(`
        id,
        scope_site_id,
        country_code,
        region_code,
        code,
        discount_type,
        discount_value,
        expiry_date,
        status,
        requested_by_employee_id,
        requested_at,
        approved_by_employee_id,
        approved_at,
        rejection_reason,
        rejected_by_employee_id,
        rejected_at,
        requester:employees!merchandising_campaign_proposals_requested_by_employee_id_fkey(name, role),
        approver:employees!merchandising_campaign_proposals_approved_by_employee_id_fkey(name, role),
        rejector:employees!merchandising_campaign_proposals_rejected_by_employee_id_fkey(name, role)
      `, { count: 'exact' })
      .eq('country_code', options.countryCode.toUpperCase());

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options.regionCode) {
      query = query.eq('region_code', options.regionCode);
    }
    if (options.siteId) {
      query = query.eq('scope_site_id', options.siteId);
    }

    const { data, error, count } = await query
      .order('requested_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const proposals = ((data || []) as any[]).map(row => ({
      ...row,
      discount_value: Math.round(Number(row.discount_value) || 0),
      requester: Array.isArray(row.requester) ? row.requester[0] : row.requester,
      approver: Array.isArray(row.approver) ? row.approver[0] : row.approver,
      rejector: Array.isArray(row.rejector) ? row.rejector[0] : row.rejector
    })) as CampaignProposal[];

    return {
      proposals,
      totalCount: count ?? proposals.length,
      page,
      pageSize
    };
  },

  async create(input: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    expiryDate: string;
  }): Promise<void> {
    const cleanCode = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) {
      throw new Error('Campaign code must be 3-32 characters of uppercase letters, numbers, hyphens, or underscores');
    }

    const wholeDiscount = Math.round(Number(input.value) || 0);
    if (wholeDiscount <= 0) {
      throw new Error('Discount value must be a positive whole number');
    }
    if (input.type === 'PERCENTAGE' && wholeDiscount > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    const expiry = new Date(input.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(expiry.getTime()) || expiry <= today) {
      throw new Error('Expiry date must be in the future');
    }

    const { error } = await supabase.from('merchandising_campaign_proposals').insert({
      code: cleanCode,
      discount_type: input.type,
      discount_value: wholeDiscount,
      expiry_date: input.expiryDate
    });
    if (error) throw error;
  },

  async approve(id: string): Promise<void> {
    const { error } = await supabase.rpc('approve_merchandising_campaign', { p_proposal_id: id });
    if (error) throw error;
  },

  async reject(id: string, reason: string): Promise<void> {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      throw new Error('Rejection reason must be at least 3 characters long');
    }
    const { error } = await supabase.rpc('reject_merchandising_campaign', {
      p_proposal_id: id,
      p_reason: trimmed
    });
    if (error) throw error;
  }
};
