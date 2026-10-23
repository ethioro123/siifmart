import { supabase } from '../lib/supabase';

export interface POFinanceReviewRow {
    id: string; po_number: string; supplier_name: string; total_amount: number;
    currency: string; status: string; region_code: string; regional_limit: number;
    created_by?: string; requested_by?: string;
}
export const poFinanceReviewService = {
    async getQueue(country: string, page: number): Promise<{ data: POFinanceReviewRow[]; count: number }> {
        if (!/^[A-Z]{2}$/.test(country) || !Number.isSafeInteger(page) || page < 1) throw new Error('Valid country and page required.');
        const { data, error } = await supabase.rpc('get_po_finance_review_queue', {
            p_country: country, p_limit: 20, p_offset: (page - 1) * 20
        });
        if (error) throw error;
        return data;
    }
};
