import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RegionalOperatingSummaryRow {
  site_id: string;
  today_sales_total: number;
  today_sales_count: number;
  monthly_sales_total: number;
  monthly_po_spend: number;
  open_register_count: number;
  staff_count: number;
  pending_po_count: number;
  escalated_po_count: number;
  variance_shift_count: number;
  pending_picks: number;
  in_progress_packs: number;
  pending_receives: number;
  overrides_24h: number;
  sales_24h: number;
  inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  optimal_stock_count: number;
  total_skus: number;
}

export function useRegionalOperatingSummary(userId: string | undefined, regionCode: string, countryCode: string, enabled: boolean) {
  return useQuery({
    queryKey: ['regional-operating-summary', userId, regionCode, countryCode],
    queryFn: async (): Promise<RegionalOperatingSummaryRow[]> => {
      const { data, error } = await supabase.rpc('get_regional_operating_summary', {
        p_region_code: regionCode,
        p_country_code: countryCode
      });
      if (error) throw error;
      return (data || []).map((row: RegionalOperatingSummaryRow) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key === 'site_id' ? value : Number(value)])) as unknown as RegionalOperatingSummaryRow);
    },
    enabled: enabled && Boolean(userId && regionCode && countryCode),
    staleTime: 60_000
  });
}
