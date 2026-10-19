import { supabase } from '../lib/supabase';

export interface WMSCountItem {
    productId: string;
    name: string;
    sku: string;
    location: string | null;
    countedQty: number | null;
    status: 'Pending' | 'Recount Required' | 'Counted';
    hasVariance: boolean;
    recountsDone: number;
    canCount: boolean;
}

export interface WMSCountSession {
    id: string;
    siteId: string;
    countryCode: string;
    countType: 'Cycle' | 'Spot';
    status: 'Active' | 'Completed' | 'Cancelled';
    items: WMSCountItem[];
}

const unwrap = <T>(data: unknown): T => {
    if (!data) throw new Error('Count service returned no result');
    return data as T;
};

export const wmsCountsService = {
    async getActiveSession(): Promise<WMSCountSession | null> {
        const { data, error } = await supabase.rpc('get_wms_count_session', { p_session_id: null });
        if (error) throw error;
        return data ? data as WMSCountSession : null;
    },

    async getSession(id: string): Promise<WMSCountSession> {
        const { data, error } = await supabase.rpc('get_wms_count_session', { p_session_id: id });
        if (error) throw error;
        return unwrap<WMSCountSession>(data);
    },

    async startSession(siteId: string, countType: WMSCountSession['countType']): Promise<WMSCountSession> {
        const { data, error } = await supabase.rpc('start_wms_count_session', {
            p_site_id: siteId,
            p_count_type: countType,
        });
        if (error) throw error;
        return this.getSession(unwrap<string>(data));
    },

    async recordCount(sessionId: string, productId: string, quantity: number) {
        const { data, error } = await supabase.rpc('record_wms_count', {
            p_session_id: sessionId,
            p_product_id: productId,
            p_count_qty: quantity,
        });
        if (error) throw error;
        return unwrap<{ productId: string; hasVariance: boolean; status: WMSCountItem['status']; countedQty: number; recountsDone: number; canCount: boolean }>(data);
    },

    async finishSession(sessionId: string): Promise<{ status: string; varianceCount: number }> {
        const { data, error } = await supabase.rpc('finish_wms_count_session', { p_session_id: sessionId });
        if (error) throw error;
        return unwrap(data);
    },

    async cancelSession(sessionId: string): Promise<void> {
        const { error } = await supabase.rpc('cancel_wms_count_session', { p_session_id: sessionId });
        if (error) throw error;
    },
};
