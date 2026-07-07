import { useState, useEffect } from 'react';
import { WMSJob, Product, Site, User } from '../../../../types';
import { getSellUnit } from '../../../../utils/units';
import { logisticsZonesService } from '../../../../services/supabase.service';

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
    const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
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
                    console.error('Failed to fetch logistics zones:', err);
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
            // 1. Analyze entire network stock
            const result = await productsService.getAll(); // Fetch ALL products across ALL sites
            const allSiteProducts = result.data || [];
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

            // 2. Fetch staged draft WMS jobs from database
            const allJobs = await wmsJobsService.getAll(undefined, 1000);
            const drafts = allJobs.filter((j: WMSJob) => j.type === 'TRANSFER' && j.transferStatus === 'Draft' && j.status === 'Pending');
            setDbDraftJobs(drafts);
        } catch (err) {
            console.error('Dist Hub Analysis Failed', err);
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
                if (user?.role !== 'super_admin' && targetStore && sourceSiteObj) {
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

        // Calculate actual store need gap to bring it to 70% capacity (converting stock to raw measure)
        const maxStock = targetProduct.maxStock || 0;
        const minStock = targetProduct.minStock || 0;
        
        // Find if this SKU has a valid size/unit on any other product (e.g. at the warehouse)
        const skuSize = targetProduct.size || allProducts.find(p => p.sku === targetProduct.sku && p.size && parseFloat(p.size) > 0)?.size;
        const skuUnit = targetProduct.unit || allProducts.find(p => p.sku === targetProduct.sku && p.unit)?.unit;

        const unitDef = getSellUnit(skuUnit || '');
        const sizeNum = parseFloat(skuSize || '0');
        const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

        const currentStockLiters = isWeightVol && targetProduct.size && parseFloat(targetProduct.size) > 0
            ? targetProduct.stock * parseFloat(targetProduct.size)
            : targetProduct.stock;

        const targetStockLiters = maxStock > 0 ? maxStock * 0.7 : minStock * 2;
        const gapLiters = Math.max(0, targetStockLiters - currentStockLiters);
        const gapCases = isWeightVol ? gapLiters / sizeNum : gapLiters;

        // Initialize allocation quantities based on the store need gap (in cases/packages)
        const initialQty: Record<string, number> = {};
        mappedSources.forEach(src => {
            initialQty[src.id] = Math.round(Math.max(1, Math.min(src.stock, gapCases)) * 100) / 100;
        });
        setDistHubAllocQty(initialQty);
    };

    const incrementQty = (sourceId: string, maxStock: number) => {
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 1;
            if (current < maxStock) {
                return { ...prev, [sourceId]: current + 1 };
            }
            return prev;
        });
    };

    const decrementQty = (sourceId: string) => {
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 1;
            if (current > 1) {
                return { ...prev, [sourceId]: current - 1 };
            }
            return prev;
        });
    };

    const handleQtyChange = (sourceId: string, value: number, maxStock: number) => {
        const parsed = isNaN(value) ? 1 : value;
        if (parsed < 1) {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: 1 }));
        } else if (parsed > maxStock) {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: maxStock }));
        } else {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: parsed }));
        }
    };

    const addToDistDraft = async (sourceProd: any, qty: number) => {
        setDistHubLoading(true);
        try {
            const destSiteId = distHubSelectedDestSite;
            const sourceSiteId = sourceProd.siteId || sourceProd.site_id;

            const unitDef = getSellUnit(sourceProd.unit || '');
            const sizeNum = parseFloat(sourceProd.size || '0');
            const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

            const finalExpectedQty = qty;
            const requestedMeasureQty = isWeightVol ? qty * sizeNum : undefined;

            // Search for existing draft manifest for this source/destination pair
            const existing = dbDraftJobs.find(j => j.sourceSiteId === sourceSiteId && j.destSiteId === destSiteId);

            if (existing) {
                // Check if product is already in the line items
                const lineItems = [...(existing.lineItems || [])];
                const existingItemIdx = lineItems.findIndex(i => i.productId === sourceProd.id || i.sku === sourceProd.sku);

                if (existingItemIdx > -1) {
                    lineItems[existingItemIdx].expectedQty = finalExpectedQty;
                    if (isWeightVol) {
                        (lineItems[existingItemIdx] as any).requestedMeasureQty = requestedMeasureQty;
                    }
                } else {
                    lineItems.push({
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
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
                const orderRef = `AUTO-REPL-${sourceProd.sku}-${Date.now().toString().slice(-4)}`;
                const newDraft = {
                    siteId: sourceSiteId,
                    type: 'TRANSFER' as const,
                    priority: 'Normal' as const,
                    status: 'Pending' as const,
                    transferStatus: 'Draft' as const,
                    orderRef,
                    items: 1,
                    lineItems: [{
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
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
            console.error('Failed to add to draft:', err);
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
            console.error('Failed to remove item from draft:', err);
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
                const unitDef = getSellUnit(item.unit || product?.unit || '');
                const sizeNum = parseFloat(resolvedSize || '0');
                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

                item.expectedQty = newQty;
                if (isWeightVol) {
                    (item as any).requestedMeasureQty = newQty * sizeNum;
                }
            }

            await wmsJobsService.update(jobId, { lineItems });
            addNotification('success', 'Quantity updated');
            await fetchDistHubData();
        } catch (err) {
            console.error('Failed to update draft item quantity:', err);
            addNotification('alert', 'Failed to update quantity');
        } finally {
            setDistHubLoading(false);
        }
    };

    const submitDistTransfers = async () => {
        if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
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
                // 1. Update the TRANSFER job's status to 'Approved'
                await wmsJobsService.update(draft.id, {
                    transferStatus: 'Approved'
                });

                // 2. Create the matching PICK job in the source site (warehouse)
                const pickJob: any = {
                    site_id: draft.sourceSiteId,
                    siteId: draft.sourceSiteId,
                    type: 'PICK',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'Pending',
                    orderRef: draft.id,
                    items: draft.lineItems.length,
                    lineItems: draft.lineItems.map(item => ({
                        productId: item.productId,
                        sku: item.sku,
                        name: item.name,
                        expectedQty: item.expectedQty,
                        pickedQty: 0,
                        status: 'Pending',
                        requestedMeasureQty: (item as any).requestedMeasureQty
                    })),
                    jobNumber: draft.jobNumber
                };

                await wmsJobsService.create(pickJob);
                successCount++;
            }

            addNotification('success', `Successfully authorized ${successCount} staged manifests`);
            onClose();
            refreshData();
        } catch (err) {
            console.error('Failed to submit transfers:', err);
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
