import { useState, useEffect } from 'react';
import { WMSJob, Product, Site, User } from '../../../../types';
import { getTransferQuantityConfig, normalizeTransferEntry, toTransferMeasureQuantity } from '../transferQuantity';
import { logisticsZonesService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';
import { isTransferManager } from '../../../../utils/transferGovernance';

interface UseSmartReplenishStateProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    wmsJobsService: any;
    productsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    settings: any;
}

export const useSmartReplenishState = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    wmsJobsService,
    productsService,
    addNotification,
    refreshData,
    settings
}: UseSmartReplenishStateProps) => {
    const [logisticsZones, setLogisticsZones] = useState<any[]>([]);
    const isRestricted = !['group_ceo', 'country_managing_director'].includes(user?.role || '') && !!user?.siteId;
    const userSiteObj = sites.find(s => s.id === user?.siteId);
    const userZoneId = userSiteObj?.logisticsZoneId || '';

    // --- STATE ---
    const [distHubLoading, setDistHubLoading] = useState(false);
    const [distHubLowStockItems, setDistHubLowStockItems] = useState<any[]>([]);
    const [distHubSelectedSku, setDistHubSelectedSku] = useState('');
    const [distHubSelectedDestSite, setDistHubSelectedDestSite] = useState('');
    const [distHubAvailableSources, setDistHubAvailableSources] = useState<any[]>([]);
    const [dbDraftJobs, setDbDraftJobs] = useState<WMSJob[]>([]);
    const [distHubSectorIntegrity, setDistHubSectorIntegrity] = useState(100);
    const [distHubTimer, setDistHubTimer] = useState(0);
    const [distHubAllocQty, setDistHubAllocQty] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'LOW'>('ALL');
    const [filterStoreId, setFilterStoreId] = useState<string>('ALL');

    // --- EFFECTS ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen) {
            setDistHubTimer(0);
            interval = setInterval(() => setDistHubTimer(prev => prev + 1), 1000);
            fetchDistHubData();

            // Fetch logistics zones
            const fetchZones = async () => {
                try {
                    const zones = await logisticsZonesService.getAll();
                    setLogisticsZones(zones);
                } catch (err) {
                    logger.error('useSmartReplenishState', 'Failed to fetch logistics zones:', err);
                }
            };
            fetchZones();
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const formatMissionTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getZoneName = (zoneId?: string) => {
        if (!zoneId) return 'Unassigned / Free Zone';
        const zone = logisticsZones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Loading...';
    };

    const fetchDistHubData = async () => {
        setDistHubLoading(true);
        try {
            // 1. Analyze store stock for replenishment (Rule 10: bounded query)
            const targetSiteId = isRestricted && userSiteObj ? userSiteObj.id : undefined;
            let allSiteProducts: any[] = [];
            if (allProducts && allProducts.length > 0) {
                allSiteProducts = allProducts;
            } else {
                const result = await productsService.getAll(targetSiteId, 50, 0);
                allSiteProducts = result.data || [];
            }
            const lowStock: any[] = [];
            let totalItems = 0;
            let healthyItems = 0;

            allSiteProducts.forEach((p: any) => {
                const productSite = sites.find(s => s.id === (p.siteId || p.site_id));
                if (productSite?.type !== 'Store') {
                    return; // Skip warehouses/distribution centers
                }

                // If zoning is enforced and user is restricted, only show stores in the same zone as the user's site
                if (settings?.enforceRegionalZoning && isRestricted && userSiteObj) {
                    if ((productSite.logisticsZoneId || '') !== userZoneId) {
                        return; // Skip stores from other zones
                    }
                }

                totalItems++;
                if (p.minStock > 0 && p.stock < p.minStock) {
                    lowStock.push(p);
                } else {
                    healthyItems++;
                }
            });

            setDistHubLowStockItems(lowStock);
            setDistHubSectorIntegrity(totalItems > 0 ? (healthyItems / totalItems) * 100 : 100);

            // 2. Fetch staged draft WMS jobs from database (Rule 10: capped to 25 records)
            const allJobs = await wmsJobsService.getAll(targetSiteId, 25, undefined, settings?.country || 'ET');
            const drafts = allJobs.filter((j: WMSJob) => j.type === 'TRANSFER' && j.transferStatus === 'Draft' && j.status === 'Pending');
            setDbDraftJobs(drafts);
        } catch (err) {
            logger.error('useSmartReplenishState', 'Dist Hub Analysis Failed', err);
            addNotification('alert', 'Network analysis failed');
        } finally {
            setDistHubLoading(false);
        }
    };

    const handleSelectLowStockProduct = (targetProduct: any) => {
        setDistHubSelectedSku(targetProduct.sku);
        const destId = targetProduct.siteId || targetProduct.site_id;
        setDistHubSelectedDestSite(destId);

        const targetStore = sites.find(s => s.id === destId);

        // Find sources with stock > 0 of this SKU
        let potentialSources = allProducts.filter(p => {
            if (p.sku !== targetProduct.sku) return false;
            if (p.stock <= 0) return false;
            if ((p.siteId || p.site_id) === destId) return false;

            const sourceSiteObj = sites.find(s => s.id === (p.siteId || p.site_id));
            const isWarehouseType = sourceSiteObj && (
                sourceSiteObj.type === 'Warehouse' || 
                sourceSiteObj.type === 'Distribution Center' || 
                (sourceSiteObj.type as any) === 'Storage & Fulfillment' || 
                (sourceSiteObj.type as any) === 'Regional Hub'
            );
            if (!isWarehouseType) return false;

            // Under regional zoning, we route by zone.
            // Regular managers can only target warehouses in the same zone.
            // CEOs can target any warehouse (with override warnings).
            if (settings?.enforceRegionalZoning) {
                if (user?.role !== 'group_ceo' && targetStore && sourceSiteObj) {
                    return (sourceSiteObj.logisticsZoneId || '') === (targetStore.logisticsZoneId || '');
                }
            }

            return true;
        });

        const mappedSources = potentialSources.map(p => ({
            ...p,
            site: sites.find(s => s.id === (p.siteId || p.site_id))
        }));

        setDistHubAvailableSources(mappedSources);

        // Inventory thresholds and stock share the same unit basis; only input precision varies by product.
        const maxStock = targetProduct.maxStock || 0;
        const minStock = targetProduct.minStock || 0;
        const targetStock = maxStock > 0 ? maxStock * 0.7 : minStock * 2;
        const stockGap = Math.max(0, targetStock - (targetProduct.stock || 0));

        // Initialize allocation quantities using the source product's stock unit and decimal rules.
        const initialQty: Record<string, number> = {};
        mappedSources.forEach(src => {
            const qty = Math.min(src.stock || 0, stockGap);
            initialQty[src.id] = normalizeTransferEntry(String(qty), src);
        });
        setDistHubAllocQty(initialQty);
    };

    const incrementQty = (sourceId: string, maxStock: number) => {
        const source = distHubAvailableSources.find(item => item.id === sourceId);
        const config = getTransferQuantityConfig(source);
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 0;
            const next = Math.min(maxStock, current + config.step);
            return { ...prev, [sourceId]: normalizeTransferEntry(String(next), source) };
        });
    };

    const decrementQty = (sourceId: string) => {
        const source = distHubAvailableSources.find(item => item.id === sourceId);
        const config = getTransferQuantityConfig(source);
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 0;
            return { ...prev, [sourceId]: normalizeTransferEntry(String(Math.max(0, current - config.step)), source) };
        });
    };

    const handleQtyChange = (sourceId: string, value: number, maxStock: number) => {
        const source = distHubAvailableSources.find(item => item.id === sourceId);
        const parsed = Number.isFinite(value) ? Math.max(0, Math.min(maxStock, value)) : 0;
        setDistHubAllocQty(prev => ({ ...prev, [sourceId]: normalizeTransferEntry(String(parsed), source) }));
    };

    const addToDistDraft = async (sourceProd: any, qty: number) => {
        setDistHubLoading(true);
        try {
            const destSiteId = distHubSelectedDestSite;
            const sourceSiteId = sourceProd.siteId || sourceProd.site_id;

            const finalExpectedQty = qty;
            const unitConfig = getTransferQuantityConfig(sourceProd);
            const requestedMeasureQty = unitConfig.unit.category === 'weight' || unitConfig.unit.category === 'volume'
                ? toTransferMeasureQuantity(qty, sourceProd)
                : undefined;

            // Search for existing draft manifest for this source/destination pair
            const existing = dbDraftJobs.find(j => j.sourceSiteId === sourceSiteId && j.destSiteId === destSiteId);

            if (existing) {
                // Check if product is already in the line items
                const lineItems = [...(existing.lineItems || [])];
                const existingItemIdx = lineItems.findIndex(i => i.productId === sourceProd.id || i.sku === sourceProd.sku);

                if (existingItemIdx > -1) {
                    lineItems[existingItemIdx].expectedQty = finalExpectedQty;
                    if (requestedMeasureQty !== undefined) {
                        (lineItems[existingItemIdx] as any).requestedMeasureQty = requestedMeasureQty;
                    }
                    Object.assign(lineItems[existingItemIdx], {
                        unit: sourceProd.unit || 'UNIT', size: sourceProd.size || '', packQuantity: sourceProd.packQuantity,
                        packageType: sourceProd.packageType, customAttributes: sourceProd.customAttributes
                    });
                } else {
                    lineItems.push({
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
                        unit: sourceProd.unit || 'UNIT',
                        size: sourceProd.size || '',
                        packQuantity: sourceProd.packQuantity,
                        packageType: sourceProd.packageType,
                        customAttributes: sourceProd.customAttributes,
                        expectedQty: finalExpectedQty,
                        requestedMeasureQty,
                        pickedQty: 0,
                        status: 'Pending'
                    } as any);
                }

                await wmsJobsService.update(existing.id, {
                    lineItems,
                    items: lineItems.length
                });
            } else {
                // Create a new draft manifest
                const sourceSite = sites.find((s: Site) => s.id === sourceSiteId);
                const siteCountry = sourceSite?.country || (sourceSite as any)?.country_code || settings?.country || 'ET';
                const orderRef = `AUTO-REPL-${sourceProd.sku}-${Date.now().toString().slice(-4)}`;
                const newDraft = {
                    siteId: sourceSiteId,
                    type: 'TRANSFER' as const,
                    priority: 'Normal' as const,
                    status: 'Pending' as const,
                    transferStatus: 'Draft' as const,
                    orderRef,
                    countryCode: siteCountry,
                    country_code: siteCountry,
                    requestedBy: user?.name || 'System',
                    items: 1,
                    lineItems: [{
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
                        price: sourceProd.price ?? 0,
                        retailPrice: sourceProd.price ?? 0,
                        costPrice: (sourceProd as any)?.costPrice ?? (sourceProd as any)?.cost ?? 0,
                        category: sourceProd.category || 'General',
                        brand: sourceProd.brand || '',
                        unit: sourceProd.unit || 'pcs',
                        size: sourceProd.size || '',
                        barcode: sourceProd.barcode || '',
                        expectedQty: finalExpectedQty,
                        requestedMeasureQty,
                        pickedQty: 0,
                        status: 'Pending' as const
                    }],
                    sourceSiteId,
                    destSiteId,
                    location: 'Staging'
                };
                await wmsJobsService.create(newDraft as any);
            }

            addNotification('success', 'Manifest draft updated');
            await fetchDistHubData();
        } catch (err) {
            logger.error('useSmartReplenishState', 'Failed to add to draft:', err);
            addNotification('alert', 'Failed to update manifest draft');
        } finally {
            setDistHubLoading(false);
        }
    };

    const removeDraftItem = async (jobId: string, itemIndex: number) => {
        setDistHubLoading(true);
        try {
            const job = dbDraftJobs.find(j => j.id === jobId);
            if (!job) return;

            const lineItems = (job.lineItems || []).filter((_: any, idx: number) => idx !== itemIndex);
            if (lineItems.length === 0) {
                // Delete the whole draft job if no items are left
                await wmsJobsService.delete(jobId);
                addNotification('success', 'Draft manifest deleted');
            } else {
                await wmsJobsService.update(jobId, {
                    lineItems,
                    items: lineItems.length
                });
                addNotification('success', 'Item removed from draft');
            }
            await fetchDistHubData();
        } catch (err) {
            logger.error('useSmartReplenishState', 'Failed to remove item from draft:', err);
            addNotification('alert', 'Failed to remove item from draft');
        } finally {
            setDistHubLoading(false);
        }
    };

    const updateDraftItemQty = async (jobId: string, itemIndex: number, newQty: number) => {
        if (newQty <= 0) {
            await removeDraftItem(jobId, itemIndex);
            return;
        }

        setDistHubLoading(true);
        try {
            const job = dbDraftJobs.find(j => j.id === jobId);
            if (!job) return;

            const lineItems = [...(job.lineItems || [])];
            const item = lineItems[itemIndex];
            if (item) {
                const product = allProducts.find(p => p.id === item.productId || p.sku === item.sku);
                const resolvedSize = product?.size || allProducts.find(p => p.sku === item.sku && p.size && parseFloat(p.size) > 0)?.size;
                item.expectedQty = newQty;
                const quantityProduct = { ...product, ...item, size: resolvedSize };
                const unitConfig = getTransferQuantityConfig(quantityProduct);
                if (unitConfig.unit.category === 'weight' || unitConfig.unit.category === 'volume') {
                    item.requestedMeasureQty = toTransferMeasureQuantity(newQty, quantityProduct);
                }
            }

            await wmsJobsService.update(jobId, { lineItems });
            addNotification('success', 'Quantity updated');
            await fetchDistHubData();
        } catch (err) {
            logger.error('useSmartReplenishState', 'Failed to update draft item quantity:', err);
            addNotification('alert', 'Failed to update quantity');
        } finally {
            setDistHubLoading(false);
        }
    };

    const submitDistTransfers = async () => {
        if (!isTransferManager(user)) {
            addNotification('alert', 'Only a warehouse manager or higher can approve transfer deployments. Your manifests remain saved as drafts.');
            return;
        }

        if (settings?.enforceRegionalZoning && user?.role !== 'group_ceo') {
            const hasCrossZoneDraft = dbDraftJobs.some(draft => {
                const sourceSiteObj = sites.find(s => s.id === draft.sourceSiteId);
                const destSiteObj = sites.find(s => s.id === draft.destSiteId);
                return sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '');
            });
            if (hasCrossZoneDraft) {
                addNotification('alert', 'Cross-zone replenishment is restricted. Manifests can only be deployed between locations in the same Logistics Zone.');
                return;
            }
        }

        setDistHubLoading(true);
        try {
            let successCount = 0;
            for (const draft of dbDraftJobs) {
                await wmsJobsService.approveTransferForPicking(draft.id);
                successCount++;
            }

            addNotification('success', `Successfully authorized ${successCount} staged manifests`);
            onClose();
            refreshData();
        } catch (err) {
            logger.error('useSmartReplenishState', 'Failed to submit transfers:', err);
            addNotification('alert', 'Error authorizing replenishment deployments');
        } finally {
            setDistHubLoading(false);
        }
    };

    return {
        distHubLoading,
        distHubLowStockItems,
        distHubSelectedSku,
        setDistHubSelectedSku,
        distHubSelectedDestSite,
        setDistHubSelectedDestSite,
        distHubAvailableSources,
        dbDraftJobs,
        distHubSectorIntegrity,
        distHubTimer,
        distHubAllocQty,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterStoreId,
        setFilterStoreId,
        logisticsZones,
        getZoneName,
        formatMissionTime,
        fetchDistHubData,
        handleSelectLowStockProduct,
        incrementQty,
        decrementQty,
        handleQtyChange,
        addToDistDraft,
        removeDraftItem,
        updateDraftItemQty,
        submitDistTransfers,
        setDistHubLoading
    };
};
