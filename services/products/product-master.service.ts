import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export type MasterStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MERGED';

export interface ProductMasterRow {
    id: string;
    country_code: string;
    sku: string;
    name: string;
    category: string | null;
    barcode: string | null;
    brand?: string | null;
    unit?: string | null;
    size?: string | null;
    pack_quantity?: number | null;
    cost_price?: number | null;
    price_band_min?: number | null;
    price_band_max?: number | null;
    status: MasterStatus;
    origin_region_code: string | null;
    origin_site_id?: string | null;
    created_by?: string | null;
    approved_by?: string | null;
    approved_at?: string | null;
    created_at?: string;
}

/** Postgres/PostgREST codes meaning "migration not applied yet" (undefined table / function / column). */
const MISSING_OBJECT_CODES = new Set(['42P01', '42883', '42703', 'PGRST202', 'PGRST204', 'PGRST205']);

function isMissingObject(error: { code?: string } | null): boolean {
    return Boolean(error?.code && MISSING_OBJECT_CODES.has(error.code));
}

/**
 * Issue the next SKU atomically on the server (no client-side race).
 * Returns e.g. "KEGR004".
 */
export async function issueSku(country: string, categoryPrefix: string): Promise<string> {
    const { data, error } = await supabase.rpc('next_sku', {
        p_country: country.toUpperCase(),
        p_category_prefix: categoryPrefix.toUpperCase()
    });
    if (error) throw error;
    return data as string;
}

/** Look up an existing (non-merged) master by barcode within a country. */
export async function findMasterByBarcode(country: string, barcode: string): Promise<ProductMasterRow | null> {
    const trimmed = barcode.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase.rpc('find_product_by_barcode', {
        p_country: country.toUpperCase(),
        p_barcode: trimmed
    });
    if (error) {
        if (isMissingObject(error)) {
            logger.warn('product-master', 'Barcode lookup unavailable: product master migration not applied yet');
            return null;
        }
        throw error;
    }
    const rows = (data ?? []) as ProductMasterRow[];
    return rows[0] ?? null;
}

export interface EnsureMasterInput {
    siteId: string;
    sku: string;
    name: string;
    category?: string | null;
    barcode?: string | null;
    brand?: string | null;
    unit?: string | null;
    size?: string | null;
    costPrice?: number | null;
    /** true only when an HQ approver is creating the product */
    approved: boolean;
    createdBy?: string | null;
}

/**
 * Get-or-create the country-level master for a SKU and return its id.
 * New masters start PENDING unless an HQ approver created them.
 * Returns null (with a warning) only while the migration is not yet applied.
 */
export async function ensureMaster(input: EnsureMasterInput, mode: 'register' | 'lookup-only' = 'register'): Promise<string | null> {
    const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('country, region_code')
        .eq('id', input.siteId)
        .maybeSingle();
    if (siteError) throw siteError;
    if (!site?.country) return null;

    const { data: existing, error: lookupError } = await supabase
        .from('product_master')
        .select('id')
        .eq('country_code', site.country)
        .eq('sku', input.sku)
        .maybeSingle();
    if (lookupError) {
        if (isMissingObject(lookupError)) {
            logger.warn('product-master', 'Master linking skipped: product master migration not applied yet');
            return null;
        }
        throw lookupError;
    }
    if (existing?.id) return existing.id as string;
    // Receiving can link a visible master, but never register or approve national catalog data.
    if (mode === 'lookup-only') return null;

    const { data: created, error: insertError } = await supabase
        .from('product_master')
        .insert({
            country_code: site.country,
            sku: input.sku,
            name: input.name,
            category: input.category ?? null,
            barcode: input.barcode?.trim() || null,
            brand: input.brand ?? null,
            unit: input.unit ?? null,
            size: input.size ?? null,
            cost_price: input.costPrice ?? null,
            status: input.approved ? 'APPROVED' : 'PENDING',
            origin_region_code: site.region_code ?? null,
            origin_site_id: input.siteId,
            created_by: input.createdBy ?? null
        })
        .select('id')
        .single();
    if (insertError) throw insertError;
    return created.id as string;
}

/**
 * Propagates newly registered barcode aliases across all sites in the country for a given SKU.
 * When receiving discovers a new barcode variant at one warehouse dock, all facilities in that market
 * immediately inherit the alias.
 */
export async function syncProductAliases(sku: string, siteId: string, newBarcodes: string[]): Promise<void> {
    if (!sku || !newBarcodes || newBarcodes.length === 0) return;
    try {
        const { data: site } = await supabase
            .from('sites')
            .select('country')
            .eq('id', siteId)
            .maybeSingle();
        if (!site?.country) return;

        const cleanBarcodes = Array.from(new Set(newBarcodes.map(b => b ? b.trim() : '').filter(Boolean)));
        if (cleanBarcodes.length === 0) return;

        // Fetch all sites in the same country
        const { data: siteIds } = await supabase
            .from('sites')
            .select('id')
            .eq('country', site.country);
        const countrySiteIds = (siteIds || []).map(s => s.id);

        if (countrySiteIds.length > 0) {
            const { data: existingRows } = await supabase
                .from('products')
                .select('id, barcodes')
                .in('site_id', countrySiteIds)
                .eq('sku', sku);

            if (existingRows) {
                for (const row of existingRows) {
                    const rowBarcodes: string[] = Array.isArray(row.barcodes) ? row.barcodes : [];
                    const merged = Array.from(new Set([...rowBarcodes, ...cleanBarcodes]));
                    if (merged.length !== rowBarcodes.length) {
                        await supabase
                            .from('products')
                            .update({ barcodes: merged })
                            .eq('id', row.id);
                    }
                }
            }
        }
    } catch (err) {
        logger.warn('product-master', 'Failed to synchronize product aliases across country sites', {
            error: err instanceof Error ? err.message : String(err)
        });
    }
}

/**
 * Retrieve master catalog products for the active country, optionally filtered by status.
 */
export async function getMasterProducts(countryCode: string, status?: MasterStatus, limit: number = 50): Promise<ProductMasterRow[]> {
    try {
        let query = supabase
            .from('product_master')
            .select('*')
            .eq('country_code', countryCode.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            if (isMissingObject(error)) return [];
            throw error;
        }
        return (data || []) as ProductMasterRow[];
    } catch (err) {
        logger.error('product-master', 'Failed to fetch master catalog products', { error: err instanceof Error ? err.message : String(err) });
        return [];
    }
}

/**
 * Approve a pending master product, enabling it for nationwide retail sales and POS checkout.
 */
export async function approveMasterProduct(
    id: string,
    approverName: string,
    priceBand?: { min?: number; max?: number }
): Promise<boolean> {
    const updates: Record<string, any> = {
        status: 'APPROVED',
        approved_by: approverName,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    if (priceBand?.min !== undefined) updates.price_band_min = priceBand.min;
    if (priceBand?.max !== undefined) updates.price_band_max = priceBand.max;

    const { error } = await supabase
        .from('product_master')
        .update(updates)
        .eq('id', id);

    if (error) throw error;

    // Also update matching products rows so local facilities immediately unlock for POS
    const { data: masterRow } = await supabase
        .from('product_master')
        .select('country_code, sku')
        .eq('id', id)
        .maybeSingle();

    if (masterRow?.sku) {
        await supabase
            .from('products')
            .update({
                approval_status: 'approved',
                approved_by: approverName,
                approved_at: new Date().toISOString()
            })
            .eq('sku', masterRow.sku);
    }

    return true;
}

/**
 * Reject a proposed master product with a justification reason.
 */
export async function rejectMasterProduct(
    id: string,
    rejectedBy: string,
    reason: string
): Promise<boolean> {
    const { error } = await supabase
        .from('product_master')
        .update({
            status: 'REJECTED',
            approved_by: rejectedBy,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;

    const { data: masterRow } = await supabase
        .from('product_master')
        .select('sku')
        .eq('id', id)
        .maybeSingle();

    if (masterRow?.sku) {
        await supabase
            .from('products')
            .update({
                approval_status: 'rejected',
                rejected_by: rejectedBy,
                rejection_reason: reason,
                rejected_at: new Date().toISOString()
            })
            .eq('sku', masterRow.sku);
    }

    return true;
}

/**
 * Execute a canonical merge of two SKUs using the atomic database RPC.
 */
export async function mergeMasterProduct(
    countryCode: string,
    survivingSku: string,
    deprecatedSku: string
): Promise<any> {
    const { data, error } = await supabase.rpc('merge_duplicate_product_sku', {
        p_country: countryCode.toUpperCase(),
        p_surviving_sku: survivingSku.toUpperCase(),
        p_deprecated_sku: deprecatedSku.toUpperCase()
    });
    if (error) throw error;
    return data;
}

/**
 * Fetch candidate duplicates detected across the nation.
 */
export async function getMergeCandidates(countryCode: string): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('product_merge_candidates')
            .select('*')
            .eq('country_code', countryCode.toUpperCase());
        if (error) {
            if (isMissingObject(error)) return [];
            throw error;
        }
        return data || [];
    } catch {
        return [];
    }
}

