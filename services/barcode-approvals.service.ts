import { supabase } from '../lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string): boolean => !!val && UUID_REGEX.test(val);

export const barcodeApprovalsService = {
    async create(approval: {
        product_id: string;
        barcode: string;
        image_url?: string;
        site_id?: string;
        country_code?: string;
        created_by?: string;
        resolution_time?: number;
    }) {
        if (!approval.country_code || !isUuid(approval.site_id) || !isUuid(approval.created_by)) throw new Error('Barcode request requires country, site and creator');
        const insertPayload: Record<string, unknown> = {
            product_id: approval.product_id,
            barcode: approval.barcode,
            image_url: approval.image_url || null,
            status: 'pending',
            country_code: approval.country_code!.toUpperCase()
        };

        // Only pass site_id if it is a valid UUID format
        if (isUuid(approval.site_id)) {
            insertPayload.site_id = approval.site_id;
        }

        // Only pass created_by if it is a valid UUID format
        if (isUuid(approval.created_by)) {
            insertPayload.created_by = approval.created_by;
        }

        const { data, error } = await supabase.from('barcode_approvals')
            .insert(insertPayload)
            .select('id, product_id, barcode, image_url, status, site_id, country_code, created_at')
            .single();
        if (error) throw error;
        return data;
    },

    async getAuditLog(siteId?: string, countryCode?: string, limit = 25) {
        if (!countryCode) throw new Error('Country scope is required');
        let query = supabase.from('barcode_approvals')
            .select('id, product_id, barcode, image_url, status, site_id, country_code, created_by, created_at, reviewed_by, reviewed_at, rejection_reason, product:products(id, name, sku, category)')
            .eq('country_code', countryCode.toUpperCase())
            .order('created_at', { ascending: false }).limit(limit);
        if (siteId) query = query.eq('site_id', siteId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(row => ({ ...row, product: Array.isArray(row.product) ? row.product[0] : row.product, productId: row.product_id, siteId: row.site_id || '', createdBy: row.created_by || '', createdAt: row.created_at, status: row.status as 'pending' | 'approved' | 'rejected' }));
    },

    async approve(id: string, userId: string) {
        const { data, error } = await supabase
            .from('barcode_approvals')
            .update({
                status: 'approved',
                reviewed_by: userId,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async reject(id: string, userId: string, reason: string) {
        // 1. Get the approval record to know which barcode/product to revert
        const { data: approval, error: fetchError } = await supabase
            .from('barcode_approvals')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !approval) throw fetchError || new Error('Approval not found');

        // 2. Mark as rejected
        const { error: updateError } = await supabase
            .from('barcode_approvals')
            .update({
                status: 'rejected',
                reviewed_by: userId,
                reviewed_at: new Date().toISOString(),
                rejection_reason: reason
            })
            .eq('id', id);

        if (updateError) throw updateError;

    },

    async uploadEvidence(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `audit_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        // Reuse 'system-assets' bucket for now
        const { error: uploadError } = await supabase.storage
            .from('system-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('system-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};

