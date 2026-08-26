import { supabase } from '../lib/supabase';
import { productsService } from './products.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string): boolean => !!val && UUID_REGEX.test(val);

export const barcodeApprovalsService = {
    async create(approval: {
        product_id: string;
        barcode: string;
        image_url?: string;
        site_id?: string;
        created_by?: string;
        resolution_time?: number;
    }) {
        const insertPayload: Record<string, any> = {
            product_id: approval.product_id,
            barcode: approval.barcode,
            image_url: approval.image_url || null,
            status: 'approved'
        };

        // Only pass site_id if it is a valid UUID format
        if (isUuid(approval.site_id)) {
            insertPayload.site_id = approval.site_id;
        }

        // Only pass created_by if it is a valid UUID format
        if (isUuid(approval.created_by)) {
            insertPayload.created_by = approval.created_by;
        }

        try {
            const { data, error } = await supabase
                .from('barcode_approvals')
                .insert(insertPayload)
                .select('id, product_id, barcode, image_url, status, site_id, created_at')
                .maybeSingle();

            if (error) {
                return {
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    ...insertPayload
                };
            }
            return data || insertPayload;
        } catch {
            return {
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                ...insertPayload
            };
        }
    },

    async getAuditLog(siteId?: string, limit: number = 1000) {
        try {
            let query = supabase
                .from('barcode_approvals')
                .select(`
                    *,
                    product:products(id, name, sku, category)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (siteId) {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query;
            if (error) {
                // Fallback query if joined products table is missing or relationship is unmapped in PostgREST
                let fallbackQuery = supabase
                    .from('barcode_approvals')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (siteId) {
                    fallbackQuery = fallbackQuery.eq('site_id', siteId);
                }

                const { data: fallbackData, error: fallbackError } = await fallbackQuery;
                if (fallbackError) throw fallbackError;
                return fallbackData || [];
            }
            return data || [];
        } catch {
            return [];
        }
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
            .select('barcode, barcodes')
            .eq('id', approval.product_id)
            .single();

        if (product) {
            const currentList = Array.isArray(product.barcodes) ? product.barcodes : [];
            const newBarcodes = currentList.filter((b: string) => b !== approval.barcode);
            const updates: any = { barcodes: newBarcodes };
            if (product.barcode === approval.barcode) {
                updates.barcode = newBarcodes[0] || null;
            }
            await productsService.update(approval.product_id, updates);
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

