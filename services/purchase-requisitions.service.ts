import { supabase } from '../lib/supabase';
import type { PurchaseRequisition, PurchaseRequisitionItem } from '../types/purchaseRequisition';

const columns = 'id,request_number,requester_employee_id,requester_name,requester_site_id,destination_site_id,country_code,region_code,title,business_reason,items,estimated_total,currency,status,reviewed_by_employee_id,reviewed_at,decision_reason,purchase_order_id,created_at';

export const purchaseRequisitionsService = {
  async list(countryCode: string): Promise<PurchaseRequisition[]> {
    const { data, error } = await supabase.from('purchase_requisitions')
      .select(columns).eq('country_code', countryCode).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []) as unknown as PurchaseRequisition[];
  },

  async create(input: {
    requesterEmployeeId: string;
    requesterName: string;
    requesterSiteId: string;
    destinationSiteId: string;
    countryCode: string;
    title: string;
    businessReason: string;
    items: PurchaseRequisitionItem[];
  }): Promise<PurchaseRequisition> {
    const { data, error } = await supabase.from('purchase_requisitions').insert({
      requester_employee_id: input.requesterEmployeeId,
      requester_name: input.requesterName,
      requester_site_id: input.requesterSiteId,
      destination_site_id: input.destinationSiteId,
      country_code: input.countryCode,
      title: input.title.trim(),
      business_reason: input.businessReason.trim(),
      items: input.items,
      currency: input.countryCode === 'KE' ? 'KES' : 'ETB'
    }).select(columns).single();
    if (error) throw error;
    return data as unknown as PurchaseRequisition;
  },

  async review(id: string, decision: 'Approved' | 'Rejected', reason: string): Promise<PurchaseRequisition> {
    const { data, error } = await supabase.rpc('review_purchase_requisition', {
      p_request_id: id,
      p_decision: decision,
      p_reason: reason.trim() || null
    });
    if (error) throw error;
    return data as PurchaseRequisition;
  }
};
