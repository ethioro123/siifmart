import React from 'react';
import { WMSJob, Site, Product } from '../../../../types';
import { productsService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';

export function usePutawayAutoRepair(
    filteredJobs: WMSJob[],
    activeSite: Site | null | undefined,
    allProducts: Product[],
    refreshData: () => void
) {
    const attemptedSkusRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        if (!activeSite?.id || !filteredJobs || filteredJobs.length === 0) return;

        const checkAndCreateMissingProducts = async () => {
            const pendingPutawayJobs = filteredJobs.filter(j => 
                (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && 
                j.status !== 'Completed' && j.status !== 'Cancelled'
            );

            let createdAny = false;

            for (const job of pendingPutawayJobs) {
                const targetSiteId = job.siteId || (job as any).site_id || activeSite.id;
                if (!job.lineItems) continue;

                for (const item of job.lineItems) {
                    const sku = item.sku;
                    if (!sku) continue;

                    const cleanSkuKey = `${targetSiteId}_${sku.replace(/[- ]/g, '').toLowerCase()}`;
                    if (attemptedSkusRef.current.has(cleanSkuKey)) continue;

                    const existsLocally = allProducts.some(p => 
                        p.sku?.replace(/[- ]/g, '').toLowerCase() === sku.replace(/[- ]/g, '').toLowerCase() &&
                        (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                    );

                    if (!existsLocally) {
                        attemptedSkusRef.current.add(cleanSkuKey);
                        const globalTemplate = allProducts.find(p => p.sku?.replace(/[- ]/g, '').toLowerCase() === sku.replace(/[- ]/g, '').toLowerCase());

                        try {
                            logger.info('usePutawayAutoRepair', `Auto-creating missing product placeholder for SKU ${sku} in site ${targetSiteId}`);
                            await productsService.create({
                                siteId: targetSiteId,
                                name: item.name || (item as any).productName || globalTemplate?.name || `Item ${sku}`,
                                sku: sku,
                                barcode: item.barcode || globalTemplate?.barcode || '',
                                barcodes: globalTemplate?.barcodes || [],
                                price: item.retailPrice || globalTemplate?.price || 0,
                                costPrice: item.cost || globalTemplate?.costPrice || 0,
                                category: item.category || globalTemplate?.category || 'Uncategorized',
                                status: 'active',
                                stock: 0,
                                location: 'On Order',
                                size: item.size || globalTemplate?.size || '',
                                brand: item.brand || globalTemplate?.brand || '',
                                unit: item.unit || globalTemplate?.unit || 'UNIT',
                                packQuantity: item.packQuantity || globalTemplate?.packQuantity || 1,
                                customAttributes: item.customAttributes || globalTemplate?.customAttributes || null,
                                description: item.description || globalTemplate?.description || '',
                                minStock: item.minStock || globalTemplate?.minStock || 0,
                                maxStock: item.maxStock || globalTemplate?.maxStock || 0
                            } as any);
                            createdAny = true;
                        } catch (err: any) {
                            if (err?.code === '23505') {
                                logger.info('usePutawayAutoRepair', `Product for SKU ${sku} already exists in DB (23505 conflict ignored)`);
                            } else {
                                logger.error('usePutawayAutoRepair', `Failed auto-creating product for SKU ${sku}`, err as Error);
                            }
                        }
                    }
                }
            }

            if (createdAny) {
                refreshData();
            }
        };

        checkAndCreateMissingProducts();
    }, [filteredJobs, activeSite?.id, allProducts, refreshData]);
}
