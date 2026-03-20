import { supabase } from '../lib/supabase';
import { productsService } from './products.service';

export const barcodeApprovalsService = {
    async create(approval: {
        product_id: string;
        barcode: string;
        image_url?: string;
        site_id?: string;
        created_by: string;
        resolution_time?: number;
    }) {
        const { data, error } = await supabase
            .from('barcode_approvals')
            .insert({
                product_id: approval.product_id,
                barcode: approval.barcode,
                image_url: approval.image_url,
                site_id: approval.site_id,
                created_by: approval.created_by,
                resolution_time: approval.resolution_time,
                status: 'logged' // Reference-only audit (no approval needed)
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAuditLog(siteId?: string) {
        let query = supabase
            .from('barcode_approvals')
            .select(`
                *,
                product:products(id, name, sku, category)
            `)
            // .eq('status', 'logged') // Show ALL history for audit trail
            .order('created_at', { ascending: false })
            .limit(100); // Limit to recent 100 entries

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
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

        // 3. Revert the barcode on the product (Remove it)
        const { data: product } = await supabase
            .from('products')
            .select('barcodes')
            .eq('id', approval.product_id)
            .single();

        if (product && product.barcodes) {
            const newBarcodes = product.barcodes.filter((b: string) => b !== approval.barcode);
            await productsService.update(approval.product_id, { barcodes: newBarcodes });
        }
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

