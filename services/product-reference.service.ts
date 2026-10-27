import { supabase } from '../lib/supabase';
export interface ProductReference { id: string; country_code: string; sku: string; name: string; category: string | null; brand: string | null; unit: string | null; size: string | null; pack_quantity: number | null; status: string }
export const productReferenceService = {
    async get(country: string, sku: string): Promise<ProductReference | null> {
        const { data, error } = await supabase.from('product_master')
            .select('id,country_code,sku,name,category,brand,unit,size,pack_quantity,status')
            .eq('country_code', country.toUpperCase()).eq('sku', sku).maybeSingle();
        if (error) throw error;
        return data as ProductReference | null;
    },
};
