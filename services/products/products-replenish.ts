import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';
import { getSellUnit } from '../../utils/units';

export async function handleAutoReplenish(product: Product) {
    // Only run if stock < minStock and minStock is configured > 0
    if (!product.minStock || product.minStock <= 0 || product.stock >= product.minStock) return;

    const destSiteId = product.siteId;

    // 1. Get all replenishment source IDs for this store from the join table
    const { data: sourceRows, error: sourceError } = await supabase
        .from('site_replenishment_sources')
        .select('source_site_id')
        .eq('site_id', destSiteId);

    // Fallback: check legacy replenishment_source_id column
    let sourceIds: string[] = [];
    if (!sourceError && sourceRows && sourceRows.length > 0) {
        sourceIds = sourceRows.map((r: any) => r.source_site_id);
    } else {
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('replenishment_source_id')
            .eq('id', destSiteId)
            .maybeSingle();
        if (siteError || !site || !site.replenishment_source_id) {
            return; // No replenishment source configured
        }
        sourceIds = [site.replenishment_source_id];
    }

    if (!sourceIds.length) return;

    // 2. Find which source has the most stock for this SKU (smart routing)
    let sourceSiteId = sourceIds[0]; // Default to first source
    if (sourceIds.length > 1) {
        const { data: sourceProducts } = await supabase
            .from('products')
            .select('site_id, stock')
            .eq('sku', product.sku)
            .in('site_id', sourceIds)
            .gt('stock', 0)
            .order('stock', { ascending: false });

        if (sourceProducts && sourceProducts.length > 0) {
            // Route to source with highest stock
            sourceSiteId = sourceProducts[0].site_id;
        }
    }

    // Resolve package size and unit from other sites if missing on dest site product
    const { data: siblingProducts } = await supabase
        .from('products')
        .select('size, unit')
        .eq('sku', product.sku)
        .not('size', 'is', null);

    let sizeNum = 0;
    let unitDef = getSellUnit(product.unit || '');
    if (siblingProducts && siblingProducts.length > 0) {
        const validProd = siblingProducts.find(p => p.size && parseFloat(p.size) > 0);
        if (validProd) {
            sizeNum = parseFloat(validProd.size);
            unitDef = getSellUnit(validProd.unit || product.unit || '');
        }
    }
    if (!sizeNum) {
        sizeNum = parseFloat(product.size || '0');
    }
    const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

    // Current stock in raw physical unit (Liters or Kgs if isWeightVol, else count)
    // If product.size is set and > 0, the stock field stores package case count, so multiply.
    // Otherwise, it is already stored as the raw physical unit.
    const currentPhysicalStock = isWeightVol && product.size && parseFloat(product.size) > 0
        ? product.stock * parseFloat(product.size)
        : product.stock;

    const minStockVal = product.minStock || 0;
    const maxStockVal = product.maxStock || 0;

    // Target stock in raw physical units
    const targetPhysicalStock = maxStockVal > 0
        ? Math.round(maxStockVal * 0.7)
        : (minStockVal * 2);

    const replenishPhysicalQty = targetPhysicalStock - currentPhysicalStock;
    if (replenishPhysicalQty <= 0) return;

    // Convert the physical quantity to case counts for expectedQty, rounded to the nearest integer case (minimum 1 case)
    const finalExpectedQty = isWeightVol ? Math.max(1, Math.round(replenishPhysicalQty / sizeNum)) : replenishPhysicalQty;
    const requestedMeasureQty = isWeightVol ? finalExpectedQty * sizeNum : undefined;

    // 3. Look for existing DRAFT transfer manifest from sourceSiteId to destSiteId
    const { data: existingDrafts, error: draftError } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('type', 'TRANSFER')
        .eq('transfer_status', 'Draft')
        .eq('status', 'Pending')
        .eq('source_site_id', sourceSiteId)
        .eq('dest_site_id', destSiteId);

    if (draftError) {
        console.error('Failed to query existing draft transfers:', draftError);
        return;
    }

    if (existingDrafts && existingDrafts.length > 0) {
        // Update existing draft
        const draft = existingDrafts[0];
        const lineItems = draft.line_items || [];

        // Check if product already in draft
        const existingItemIndex = lineItems.findIndex((item: any) => item.productId === product.id || item.sku === product.sku);

        if (existingItemIndex > -1) {
            // Update quantity to current replenishment needs
            lineItems[existingItemIndex].expectedQty = finalExpectedQty;
            if (isWeightVol) {
                lineItems[existingItemIndex].requestedMeasureQty = requestedMeasureQty;
            } else {
                delete lineItems[existingItemIndex].requestedMeasureQty;
            }
        } else {
            // Append new line item
            const newItem: any = {
                productId: product.id,
                sku: product.sku,
                name: product.name,
                expectedQty: finalExpectedQty,
                pickedQty: 0,
                status: 'Pending'
            };
            if (isWeightVol) {
                newItem.requestedMeasureQty = requestedMeasureQty;
            }
            lineItems.push(newItem);
        }

        // Update draft job in DB
        const { error: updateError } = await supabase
            .from('wms_jobs')
            .update({
                line_items: lineItems,
                items_count: lineItems.length
            })
            .eq('id', draft.id);

        if (updateError) {
            console.error('Failed to update existing draft WMS job:', updateError);
        }
    } else {
        // Create a new draft manifest
        const orderRef = `AUTO-REPL-${product.sku}-${Date.now().toString().slice(-4)}`;

        const newDraftJob = {
            site_id: sourceSiteId, // Warehouse fulfills it
            type: 'TRANSFER',
            priority: 'Normal',
            status: 'Pending',
            transfer_status: 'Draft',
            items_count: 1,
            line_items: [{
                productId: product.id,
                sku: product.sku,
                name: product.name,
                expectedQty: finalExpectedQty,
                ...(isWeightVol ? { requestedMeasureQty } : {}),
                pickedQty: 0,
                status: 'Pending'
            }],
            source_site_id: sourceSiteId,
            dest_site_id: destSiteId,
            order_ref: orderRef,
            location: 'Staging'
        };

        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let jobNum = '';
        for (let i = 0; i < 6; i++) {
            jobNum += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        (newDraftJob as any).job_number = jobNum;

        const { error: createError } = await supabase
            .from('wms_jobs')
            .insert(newDraftJob);

        if (createError) {
            console.error('Failed to create new draft WMS job:', createError);
        }
    }
}
