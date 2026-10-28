import { supabase } from '../lib/supabase';
import { _mapProduct } from './products/products-helpers';
import type { Product } from '../types';

export interface ForecastDemandBucket { sku: string; age_days: number; units: number; refund_uncertain: boolean }
export interface ForecastIncomingBucket {
    sku: string; expected_delivery: string | null; pack_quantity: number; case_size: number;
    unit: string; size: string; custom_attributes: Product['customAttributes']; order_quantity: number; received_units: number;
}
export interface ForecastSnapshot {
    products: Product[]; demand: ForecastDemandBucket[]; incoming: ForecastIncomingBucket[];
    awaitingSkus: string[]; asOf: string; start: string;
}
export const merchandisingForecastService = {
    async get(siteId: string, country: string): Promise<ForecastSnapshot> {
        if (!siteId || siteId === 'All' || !country) throw new Error('Select a location to evaluate demand.');
        const { data, error } = await supabase.rpc('merchandising_forecast_snapshot', { p_site: siteId, p_country: country });
        if (error) throw error;
        if (!data || !Array.isArray(data.products) || !Array.isArray(data.demand) || !Array.isArray(data.incoming) || !Array.isArray(data.awaitingSkus) || !Number.isFinite(Date.parse(data.asOf)) || !Number.isFinite(Date.parse(data.start))) throw new Error('Forecast snapshot is incomplete.');
        return { ...data, products: data.products.map(_mapProduct) };
    },
    async request(productId: string, quantity: number): Promise<{ id: string; existing: boolean }> {
        if (!productId || !Number.isSafeInteger(quantity) || quantity < 1) throw new Error('A product and positive whole quantity are required.');
        const { data, error } = await supabase.rpc('request_forecast_replenishment', { p_product: productId, p_quantity: quantity });
        if (error) throw error;
        if (!data?.id) throw new Error('The server did not confirm a replenishment request.');
        return data;
    },
};
