import { logger } from '../../../../utils/logger';
import { normalizeLocation } from '../../../../utils/locationTracking';
import { WMSJob, JobItem, Product } from '../../../../types';

interface UsePutawayScanningDeps {
    selectedJob: WMSJob | null;
    currentItem: JobItem | undefined;
    currentProduct: Product | undefined;
    scannedLocation: string;
    setScannedLocation: (v: string) => void;
    setLocationOccupants: (occupants: Product[]) => void;
    isSubmitting: boolean;
    isSubmittingRef: React.RefObject<boolean>;
    setIsSubmitting: (v: boolean) => void;
    putawayStock: (params: any) => Promise<any>;
    updateJobItem: (jobId: string, itemIndex: number, status: string, expectedQty: number, scannedLocation: string) => Promise<any>;
    completeJob: (jobId: string, userId: string, active: boolean, nextItems: any[], timestamp?: string) => Promise<any>;
    addNotification: (type: 'success' | 'alert' | 'info' | 'error', message: string) => void;
    activeSite: any;
    allProducts: Product[];
    user: any;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsScannerOpen: (open: boolean) => void;
}

export const usePutawayScanning = (deps: UsePutawayScanningDeps) => {
    const {
        selectedJob,
        currentItem,
        currentProduct,
        scannedLocation,
        setScannedLocation,
        setLocationOccupants,
        isSubmitting,
        isSubmittingRef,
        setIsSubmitting,
        putawayStock,
        updateJobItem,
        completeJob,
        addNotification,
        activeSite,
        allProducts,
        user,
        setSelectedJob,
        setIsScannerOpen
    } = deps;

    const handleScanLocation = async (loc: string) => {
        const normalized = normalizeLocation(loc);

        if (!normalized) {
            addNotification('error', `Invalid storage format. Expected: A-02-03 (Zones A-Z, Aisles 1-99, Bays 1-99)`);
            throw new Error('Invalid location format');
        }

        addNotification('success', `Location ${normalized} ready`);
    };

    const handleScanItem = async (barcode: string, quantityToPutaway?: number) => {
        if (!selectedJob || !currentItem) return;
        if (isSubmitting || isSubmittingRef.current) {
            logger.warn('PutawayTab', "⚠️ Already submitting putaway. Ignoring duplicate scan.");
            return;
        }

        // [NEW] Enforce location scan first
        if (!scannedLocation) {
            addNotification('alert', 'Please scan a location first!');
            throw new Error('Location not scanned');
        }

        const normalized = barcode.toUpperCase().trim();
        const product = currentProduct;

        // Normalize SKU for matching: strip hyphens, slashes, and whitespace
        const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
        const normalizedInput = normSku(normalized);

        const getBarcodesArray = (barcodes: any): string[] => {
            if (!barcodes) return [];
            if (Array.isArray(barcodes)) return barcodes.filter(b => typeof b === 'string');
            if (typeof barcodes === 'string') {
                let clean = barcodes.trim();
                if (clean.startsWith('{') && clean.endsWith('}')) {
                    return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                }
                if (clean.startsWith('[') && clean.endsWith(']')) {
                    try {
                        return JSON.parse(clean);
                    } catch (e) {
                        return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    }
                }
                return [clean];
            }
            return [];
        };

        const aliasList = getBarcodesArray(product?.barcodes);
        const hasAliasMatch = aliasList.some(b => {
            const cleanB = b.toUpperCase().trim();
            return normalized === cleanB || normalizedInput === normSku(cleanB);
        });

        const isValid =
            normalized === currentItem.sku?.toUpperCase() ||
            normalized === product?.barcode?.toUpperCase() ||
            hasAliasMatch ||
            normalizedInput === normSku(currentItem.sku || '') ||
            normalizedInput === normSku(product?.barcode || '');

        if (!isValid) {
            addNotification('alert', 'Wrong item scanned!');
            throw new Error('Wrong item');
        }

        const exactIndex = selectedJob.lineItems.indexOf(currentItem);
        const itemIndex = exactIndex >= 0 && !['Picked', 'Completed', 'Short'].includes(currentItem.status) ? exactIndex :
            selectedJob.lineItems.findIndex(item => !['Picked', 'Completed', 'Short'].includes(item.status) &&
                item.productId === currentItem.productId && item.sku === currentItem.sku);
        if (itemIndex < 0) throw new Error('This item is no longer pending. Reopen the job before placing stock.');
        const requestedQty = quantityToPutaway ?? currentItem.expectedQty;
        if (!Number.isFinite(requestedQty) || requestedQty <= 0 || requestedQty > currentItem.expectedQty) {
            throw new Error('Enter a positive physical quantity no greater than this job item quantity.');
        }
        if (selectedJob.siteId !== activeSite?.id || !['Pending', 'In-Progress'].includes(selectedJob.status)) throw new Error('Select an active job at this receiving facility.');

        if (isSubmittingRef.current !== undefined) {
            (isSubmittingRef as any).current = true;
        }
        setIsSubmitting(true);
        try {
            // Capture a single timestamp for consistency across inventory and putaway history
            const putawayTimestamp = new Date().toISOString();

            const qty = requestedQty;

            // 2. Putaway Stock Logic (Replaces adjustStock + relocate)
            await putawayStock({
                jobId: selectedJob.id, itemIndex,
                sku: currentItem.sku || '',
                location: scannedLocation,
                quantity: qty,
                siteId: activeSite?.id,
                type: 'IN',
                expiryDate: currentItem.expiryDate,
                batchNumber: currentItem.batchNumber,
                sourceProductId: currentItem.productId,
                timestamp: putawayTimestamp,
                // Pass PO attributes from job line item → product record
                size: currentItem.size,
                brand: currentItem.brand,
                unit: currentItem.unit,
                image: (currentItem as any).image,
                packQuantity: currentItem.packQuantity,
                packageType: (currentItem as any).packageType,
                caseSize: (currentItem as any).caseSize,
                category: currentItem.category,
                retailPrice: currentItem.retailPrice,
                customAttributes: currentItem.customAttributes,
                description: currentItem.description,
                minStock: currentItem.minStock,
                maxStock: currentItem.maxStock
            });

            // 1. Update Job Item Status — use findIndex (not indexOf) to avoid reference mismatch
            const itemStatus = qty < currentItem.expectedQty ? 'Short' : 'Picked';
            // The placement RPC already saved the job line with the stock movement.

            addNotification('success', 'Item put away successfully');

            // 3. Update Local Job State
            const nextItems = [...selectedJob.lineItems];
            nextItems[itemIndex] = { ...currentItem, status: itemStatus, pickedQty: qty, location: scannedLocation };

            // 4. Auto-Complete: If all items are done, complete the job automatically
            const allDone = nextItems.every(i => !i || i.status === 'Picked' || i.status === 'Short' || i.status === 'Completed');
            logger.debug('PutawayTab', '📍 [PUTAWAY] allDone');

            if (allDone) {
                logger.debug('PutawayTab', '🏁 [PUTAWAY] Auto-completing job');
                await completeJob(selectedJob.id, user?.id || 'Driver', false, nextItems, putawayTimestamp);
                addNotification('success', 'All items put away — Job completed!');
                setIsScannerOpen(false);
                setSelectedJob(null);
            } else {
                setSelectedJob({ ...selectedJob, lineItems: nextItems });
            }

        } catch (e) {
            logger.error('PutawayTab', '❌ [PUTAWAY] Error:', e);
            addNotification('alert', 'Error processing putaway');
            throw e;
        } finally {
            if (isSubmittingRef.current !== undefined) {
                (isSubmittingRef as any).current = false;
            }
            setIsSubmitting(false);
        }
    };

    return { handleScanLocation, handleScanItem };
};
