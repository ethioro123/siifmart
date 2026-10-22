import { supabase } from '../lib/supabase';
import type { ProductSuggestion, ProductSuggestionStatus } from '../types/productSuggestion';

const columns = 'id,submitter_employee_id,site_id,country_code,region_code,product_name,category,brand_or_example,product_details,demand_signal,customer_request_count,status,review_note,reviewed_by_employee_id,reviewed_at,created_at,updated_at';

export const productSuggestionsService = {
  async list(countryCode: string): Promise<ProductSuggestion[]> {
    const { data, error } = await supabase.from('product_suggestions')
      .select(columns).eq('country_code', countryCode.toUpperCase())
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []) as unknown as ProductSuggestion[];
  },

  async create(input: {
    submitterEmployeeId: string;
    siteId: string;
    productName: string;
    category?: string;
    brandOrExample?: string;
    productDetails?: string;
    demandSignal: string;
    customerRequestCount?: number | null;
  }): Promise<ProductSuggestion> {
    const { data, error } = await supabase.from('product_suggestions').insert({
      submitter_employee_id: input.submitterEmployeeId,
      site_id: input.siteId,
      product_name: input.productName.trim(),
      category: input.category?.trim() || null,
      brand_or_example: input.brandOrExample?.trim() || null,
      product_details: input.productDetails?.trim() || null,
      demand_signal: input.demandSignal.trim(),
      customer_request_count: input.customerRequestCount ?? null
    }).select(columns).single();
    if (error) throw error;
    return data as unknown as ProductSuggestion;
  },

  async review(id: string, decision: ProductSuggestionStatus, note: string): Promise<ProductSuggestion> {
    const { data, error } = await supabase.rpc('review_product_suggestion', {
      p_suggestion_id: id,
      p_decision: decision,
      p_note: note.trim() || null
    });
    if (error) throw error;
    return data as ProductSuggestion;
  }
};
