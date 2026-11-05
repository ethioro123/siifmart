import { supabase } from '../lib/supabase';
export const siteLocationLabelsService = {
    async load(siteId: string, country: string): Promise<string[]> {
        const labels = new Set<string>();
        const pageSize = 500;
        for (let offset = 0; offset < 100_000; offset += pageSize) {
            const { data, error } = await supabase.from('inventory_stock_locations').select('location')
                .eq('site_id', siteId).eq('country_code', country).eq('is_archived', false)
                .order('id').range(offset, offset + pageSize - 1);
            if (error) throw error;
            for (const row of data ?? []) if (row.location) labels.add(row.location);
            if (!data || data.length < pageSize) return [...labels];
        }
        throw new Error('Location export exceeds 100,000 stock records. Narrow the export before printing.');
    }
};
