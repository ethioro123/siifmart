import { supabase } from '../../lib/supabase';

/**
 * Ask the database to materialise (or return) the destination-site product row for one SKU
 * on an open transfer. The server validates the caller's receiving authority, that the SKU is
 * on the transfer, and the country boundary; master data and prices come from the source
 * product, never from the client. Stock is created at 0.
 */
export async function ensureTransferReceiptProduct(transferId: string, sku: string): Promise<string> {
    const { data, error } = await supabase.rpc('ensure_transfer_receipt_product', {
        p_transfer_id: transferId,
        p_sku: sku
    });
    if (error) throw error;
    if (!data) throw new Error(`Could not prepare product ${sku} at the destination`);
    return data as string;
}
