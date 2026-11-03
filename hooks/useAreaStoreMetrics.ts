import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AreaStoreMetric {
  site_id: string;
  today_sales_total: number;
  today_sales_count: number;
  monthly_sales_total: number;
  monthly_po_spend: number;
  open_register_count: number;
  staff_count: number;
  pending_po_count: number;
  escalated_po_count: number;
  overrides_24h: number;
  sales_24h: number;
}

export function useAreaStoreMetrics(userId: string | undefined, country: string, enabled: boolean) {
  return useQuery({
    queryKey: ['area-store-metrics', userId, country],
    queryFn: async (): Promise<AreaStoreMetric[]> => {
      const { data, error } = await supabase.rpc('get_area_store_metrics');
      if (error) throw error;
      return (data || []).map((row: AreaStoreMetric) => ({
        ...row,
        today_sales_total: Number(row.today_sales_total),
        today_sales_count: Number(row.today_sales_count),
        monthly_sales_total: Number(row.monthly_sales_total),
        monthly_po_spend: Number(row.monthly_po_spend),
        open_register_count: Number(row.open_register_count),
        staff_count: Number(row.staff_count),
        pending_po_count: Number(row.pending_po_count),
        escalated_po_count: Number(row.escalated_po_count),
        overrides_24h: Number(row.overrides_24h),
        sales_24h: Number(row.sales_24h)
      }));
    },
    enabled: enabled && Boolean(userId),
    staleTime: 60_000
  });
}
