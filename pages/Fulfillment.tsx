import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Check, Filter, Grid, History as HistoryIcon, Map as MapIcon, User as UserIcon,
    AlertTriangle, Loader2, ArrowRight
} from 'lucide-react';
import { JobItem, User, Site, WMSJob, Product, PurchaseOrder } from '../types';
import { playBeep } from '../utils/audioUtils';
import { Protected } from '../components/Protected';
import Modal from '../components/Modal';

import { useStore } from '../contexts/CentralStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useFulfillmentData } from '../components/fulfillment/FulfillmentDataProvider';
import { useGamification } from '../contexts/GamificationContext';
import { FulfillmentProvider } from '../components/fulfillment/FulfillmentContext';
import Pagination from '../components/shared/Pagination';

import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';
import { useRelocateProductMutation } from '../hooks/useRelocateProductMutation';
import { CURRENCY_SYMBOL } from '../constants';
import { wmsJobsService, purchaseOrdersService, productsService, inventoryRequestsService, stockMovementsService } from '../services/supabase.service';
import { filterBySite } from '../utils/locationAccess';
import { generatePackLabelHTML } from '../utils/labels/PackLabelGenerator';
import { formatJobId, generateTrackingNumber } from '../utils/jobIdFormatter';
import { formatDateTime, formatRelativeTime } from '../utils/formatting';

import { FulfillmentContent } from '../components/fulfillment/FulfillmentContent';
import { useFilteredFulfillmentData } from '../hooks/useFilteredFulfillmentData';
import { useFulfillmentActions } from '../hooks/useFulfillmentActions';


type OpTab = 'DOCKS' | 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'PACK' | 'REPLENISH' | 'COUNT' | 'WASTE' | 'RETURNS' | 'ASSIGN' | 'TRANSFER' | 'DRIVER';



// --- SUB-COMPONENTS ---

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());




// --- MAIN COMPONENT ---

export default function WarehouseOperations() {
    const { user } = useStore();
    const { t } = useLanguage();
    const {
        orders, products, allProducts, settings, sales, processReturn, employees, activeSite, sites, movements,
        addNotification, addProduct, refreshData, logSystemEvent
    } = useData();

    const {
        jobs, transfers, jobAssignments,
        receivePO, receivePOSplit, finalizePO, assignJob, updateJobItem, completeJob, resetJob, updateJobStatus, deleteJob,
        refreshJobs, fixBrokenJobs
    } = useFulfillmentData();

    const { workerPoints, getWorkerPoints, getLeaderboard } = useGamification();

    const adjustStockMutation = useAdjustStockMutation();
    const relocateProductMutation = useRelocateProductMutation();

    const canApprove = ['super_admin', 'CEO', 'Admin'].includes(user?.role || '');


    const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false); // Mobile Tab Selector Toggle


    // 🛡️ PO UUID RESOLUTION HELPER
    // Maps UUIDs (orderRef) back to readable PO Numbers for display
    const poNumberMap = useMemo(() => {
        const map = new Map<string, string>();
        orders?.forEach(o => {
            if (o.id) {
                // Prioritize real PO number from procurement if it exists
                const poRef = o.poNumber || o.po_number;
                map.set(o.id.toLowerCase(), poRef || o.id.slice(-4).toUpperCase());
            }
        });
        sales?.forEach(s => {
            if (s.id) map.set(s.id.toLowerCase(), s.receiptNumber || s.id.slice(-4).toUpperCase());
        });
        transfers?.forEach(t => {
            if (t.id) map.set(t.id.toLowerCase(), t.jobNumber || t.id.slice(-4).toUpperCase());
        });
        return map;
    }, [orders, sales, transfers]);

    const resolveOrderRef = (ref: string | undefined): string => {
        if (!ref) return '';
        // Try direct lookup
        const found = poNumberMap.get(ref.toLowerCase());
        if (found) return found;

        // Lenient fallback: If it's long and contains dashes (or looks like a full hex string), shorten it
        if (ref.length > 20 || isUUID(ref)) {
            return ref.slice(-4).toUpperCase();
        }
        return ref;
    };


    // --- SHARED FILTRATION & PAGINATION STATES ---













    // Gamification State
    const [showPointsPopup, setShowPointsPopup] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState({ points: 0, message: '', bonuses: [] as { label: string; points: number }[] });




    // Calculate bonus for current user


    // 🔒 LOCATION-BASED ACCESS CONTROL
    // CEOs MUST select a specific warehouse/store to view operations
    // If at HQ or no site selected, show empty results
    const isMultiSiteRole = ['CEO', 'Super Admin', 'Admin', 'Auditor', 'super_admin'].includes(user?.role || '');

    const isHQ = activeSite ? ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type) : 'N/A';
    const needsSiteSelection = isMultiSiteRole && (!activeSite || ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type));



    const {
        filteredJobs,
        filteredEmployees,
        filteredProducts,
        filteredMovements,
        historicalJobs
    } = useFilteredFulfillmentData({
        jobs,
        employees: employees as any,
        products,
        movements,
        user,
        activeSite: activeSite || null
    });


    // 🔒 TAB-LEVEL ACCESS CONTROL


    // Get list of tabs user can access
    // Set default tab to first visible tab
    const [activeTab, setActiveTab] = useState<OpTab>('RECEIVE'); // Default, will update or use state logic if needed
    // Actually, setActiveTab should be set initially based on role?
    // For now we rely on FulfillmentContext or just default.
    // FulfillmentContent handles visibility.

    const [selectedJob, setSelectedJob] = useState<WMSJob | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);



    // --- SCANNER STATE ---
    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
    const [isScannerMode, setIsScannerMode] = useState(false);

    // --- PICKING STATE ---
    // DISCREPANCY RESOLUTION STATE
    // Derived Confidence Score for Receiving
    // PICK Tab States    // pickJobsTotalPages and paginatedPickJobs moved to PickTab.tsx
    // dispatchTotalPages and paginatedDispatchJobs moved to DriverTab.tsx    // Assign Pagination State    // Count States    // Waste States    // Driver/Dispatch States    // Dock States    // Transfer History States    // Additional Missing States
    // Derived state for PO completion





    // --- RETURNS DATA --- moved to ReturnsTab.tsx

    // --- REVIEW & PRINT STATE ---


    // Pack Job Reprint State (uses same size/format as above)-Rich data for detailed labels

    // --- LOADING STATES (prevent double-clicking) ---
    const [label_sRePrint] = useState<string[]>([]);
    // const [creatingReplenishTask, setCreatingReplenishTask] = useState<string | null>(null); // Moved to ReplenishTab.tsx
    // const [approvingVariance, setApprovingVariance] = useState<number | null>(null); // Moved to CountTab.tsx
    // const [isDisposingWaste, setIsDisposingWaste] = useState(false); // Moved to WasteTab.tsx





    // --- PACKING STATE ---

    // Docks Tab State & Logic - Moved to DocksTab.tsx


    // [NEW] Quick one-click unload confirmation - stays on DOCKS tab

    // --- WAVE STATE ---

    // --- REPLENISH STATE ---
    // Moved to ReplenishTab.tsx

    // --- PUTAWAY STATE ---
    // Moved to PutawayTab.tsx

    // --- TRANSFER STATE ---
    // Moved to TransferTab.tsx







    const {
        isSubmitting,
        setIsSubmitting,
        handleStartJob
    } = useFulfillmentActions({
        user,
        filteredProducts,
        assignJob,
        updateJobStatus: updateJobStatus as any,
        addNotification,
        setSelectedJob,
        setIsDetailsOpen,
        setIsScannerMode,
        logSystemEvent,
        t
    });






    // Handle location selection
    // Handle location selection





    // --- UTILS ---

    // [NEW] Putaway Stock Handler (Fixes aggregation/overwrite issue)
    const putawayStock = async (params: { sku: string, location: string, quantity: number, siteId: string, type: 'IN' | 'TRANSFER', expiryDate?: string, batchNumber?: string, sourceProductId?: string, timestamp?: string, size?: string, brand?: string, unit?: string, packQuantity?: number, category?: string, retailPrice?: number, customAttributes?: any, description?: string, minStock?: number, maxStock?: number }) => {
        try {
            const ts = params.timestamp || new Date().toISOString();
            console.log('📦 putawayStock called:', params, 'using timestamp:', ts);

            // 1. Check if product exists at destination
            let destProduct = await productsService.getBySkuAndLocation(params.sku, params.location, params.siteId);
            let destProductId = destProduct?.id;

            if (destProduct) {
                console.log(`✅ Found existing product at ${params.location} (ID: ${destProduct.id}). Updating stock...`);
                // Update existing
                await productsService.adjustStock(destProduct.id, params.quantity, 'IN', `Putaway to ${params.location}`, user?.name || 'System', params.expiryDate, params.batchNumber, ts);
            } else {
                console.log(`ℹ️ No product found at ${params.location}. Creating or recycling record...`);
                // Create new
                // Need source details. Use sourceProductId if available, or fetch by SKU.
                let sourceProduct: any;
                if (params.sourceProductId) {
                    try { sourceProduct = await productsService.getById(params.sourceProductId); } catch (e) { }
                }

                if (!sourceProduct) {
                    // Fetch master record or any record for this SKU to copy details
                    sourceProduct = await productsService.getBySKU(params.sku, params.siteId);
                }

                // [FIX] Handle custom products that only exist as PO Items
                if (!sourceProduct && params.sourceProductId) {
                    const poItem = orders?.flatMap(o => o.lineItems || []).find(i => i.id === params.sourceProductId || i.productId === params.sourceProductId);
                    if (poItem) {
                        console.log(`ℹ️ Found PO Item matching ID. Creating initial product definition for ${params.sku}`);
                        sourceProduct = {
                            name: poItem.productName || params.sku,
                            sku: poItem.sku || params.sku,
                            price: poItem.retailPrice || 0,
                            cost: poItem.unitCost || 0,
                            category: poItem.category || 'Uncategorized',
                            brand: poItem.brand || '',
                            size: poItem.size || '',
                            unit: poItem.unit || 'UNIT',
                            packQuantity: poItem.packQuantity || 1,
                            description: poItem.description || '',
                            minStock: poItem.minStock || 0,
                            maxStock: poItem.maxStock || 0,
                            customAttributes: poItem.customAttributes || null,
                            stock: 0,
                            location: 'On Order', // Will be overridden to actual location below
                            status: 'active',
                            siteId: params.siteId,
                            approvalStatus: 'approved'
                        };
                    }
                }

                if (!sourceProduct) {
                    throw new Error(`Product definition for SKU ${params.sku} not found`);
                }

                // [FIX] Check if source is a "ghost" placeholder (On Order/Empty & 0 Stock)
                // If so, MOVE/RECYCLE it instead of creating a duplicate.
                const isPlaceholder = (sourceProduct.location === 'On Order' || !sourceProduct.location) && sourceProduct.stock === 0;

                if (isPlaceholder && params.sourceProductId === sourceProduct.id) {
                    console.log(`♻️ Recycling placeholder product ${sourceProduct.id} from '${sourceProduct.location}' to '${params.location}'`);

                    // Update the existing placeholder to be the real record
                    const updated = await productsService.update(sourceProduct.id, {
                        location: params.location,
                        stock: params.quantity,
                        expiryDate: params.expiryDate || sourceProduct.expiryDate,
                        batchNumber: params.batchNumber || sourceProduct.batchNumber,
                        // Carry over PO attributes from params (they travel from WMS job line item)
                        size: params.size || sourceProduct.size,
                        brand: params.brand || sourceProduct.brand,
                        unit: params.unit || sourceProduct.unit,
                        packQuantity: params.packQuantity || sourceProduct.packQuantity,
                        category: params.category || sourceProduct.category,
                        price: params.retailPrice || sourceProduct.price,
                        customAttributes: params.customAttributes || sourceProduct.customAttributes,
                        description: params.description || sourceProduct.description,
                        minStock: params.minStock || sourceProduct.minStock,
                        maxStock: params.maxStock || sourceProduct.maxStock,
                        // Ensure status is valid
                        status: 'active'
                    });
                    destProductId = updated.id;

                    // [FIX] Log Movement for Recycled Record
                    await stockMovementsService.create({
                        site_id: params.siteId,
                        product_id: updated.id,
                        product_name: updated.name,
                        type: 'IN',
                        quantity: params.quantity,
                        movement_date: ts,
                        performed_by: user?.name || 'System',
                        reason: `Putaway to ${params.location} (Recycled)`
                    } as any);

                } else {
                    // Standard Logic: Create clone for new location

                    // [FIX] Try to fetch PO Item explicitly to carry over deep attributes if they exist
                    let poAttribs = {};
                    if (params.sourceProductId) {
                        const poItem = orders?.flatMap(o => o.lineItems || []).find(i => i.id === params.sourceProductId || i.productId === params.sourceProductId);
                        if (poItem) {
                            poAttribs = {
                                brand: poItem.brand || sourceProduct.brand,
                                size: poItem.size || sourceProduct.size,
                                unit: poItem.unit || sourceProduct.unit,
                                packQuantity: poItem.packQuantity || sourceProduct.packQuantity,
                                description: poItem.description || sourceProduct.description,
                                minStock: poItem.minStock || sourceProduct.minStock,
                                maxStock: poItem.maxStock || sourceProduct.maxStock,
                                customAttributes: poItem.customAttributes || sourceProduct.customAttributes
                            };
                        }
                    }

                    const newProduct = {
                        ...sourceProduct,
                        ...poAttribs,
                        location: params.location,
                        stock: params.quantity,
                        status: 'active', // Ensure product shows in inventory
                        siteId: params.siteId, // [FIX] Override siteId to match destination
                        // Ensure we don't copy ID or other specific fields
                        id: undefined,
                        created_at: ts,
                        updated_at: undefined,
                        createdAt: ts,
                        updatedAt: undefined,
                        // Keep expiry/batch if provided, else use source
                        expiryDate: params.expiryDate || sourceProduct.expiryDate,
                        batchNumber: params.batchNumber || sourceProduct.batchNumber,
                        // Reset approval for new location? Or keep? Usually keep if moving approved stock.
                        approvalStatus: 'approved',
                    };

                    // Remove ID from object explicitly to avoid Supabase errors if spread didn't work as expected with types
                    delete (newProduct as any).id;

                    const newProductPayload = newProduct; // Rename for clarity in closure

                    try {
                        const created = await productsService.create(newProductPayload);
                        destProductId = created.id;
                        console.log(`✅ Created new product record at ${params.location}`);

                        // [FIX] Log Movement for New Location Record
                        await stockMovementsService.create({
                            site_id: params.siteId,
                            product_id: created.id,
                            product_name: created.name,
                            type: 'IN',
                            quantity: params.quantity,
                            movement_date: ts,
                            performed_by: user?.name || 'System',
                            reason: `Putaway to ${params.location} (New Location)`
                        } as any);

                    } catch (err: any) {
                        // [SAFETY] Handle Unique Constraint Violation (Race condition or hidden record)
                        if (err.code === '23505') {
                            console.warn(`⚠️ Product creation collision (already exists) at ${params.location}. Recovering...`);
                            // Fetch the existing record that caused the collision
                            const existing = await productsService.getBySkuAndLocation(params.sku, params.location, params.siteId);
                            if (existing) {
                                console.log(`🔄 Recovered: Found existing product ${existing.id}. Updating stock...`);
                                destProductId = existing.id;
                                // Force status to active and update stock
                                await productsService.update(existing.id, { status: 'active', updated_at: ts } as any);
                                await productsService.adjustStock(existing.id, params.quantity, 'IN', `Putaway to ${params.location} (Recovered)`, user?.name || 'System', params.expiryDate, params.batchNumber, ts);
                            } else {
                                // Should not happen if constraint fired, but just in case re-throw
                                throw err;
                            }
                        } else {
                            throw err;
                        }
                    }
                }
            }

            // [CLEANUP] Evict old tenants: If we put a new product here, ensure old 0-stock products don't claim this location
            try {
                await productsService.clearLocationForEmptyProducts(params.location, params.siteId, params.sku);
                console.log(`🧹 Location ${params.location} cleanup complete (evicted 0-stock ghosts)`);
            } catch (cleanupErr) {
                console.warn('⚠️ Manual cleanup of old location tenants failed (non-critical)', cleanupErr);
            }

            addNotification('success', `Stock putaway to ${params.location}`);
            refreshData(); // Refresh to show new location
        } catch (e) {
            console.error('❌ putawayStock failed:', e);
            addNotification('alert', 'Putaway failed');
            throw e;
        }
    };

    // --- RENDERERS ---

    // ScannerInterface extracted to ../components/fulfillment/ScannerInterface.tsx
    const contextValue: any = {
        user,
        activeSite,
        sites,
        products,
        allProducts,
        orders,
        sales,
        movements,
        transfers,
        employees,
        jobs,
        settings,
        workerPoints,
        getWorkerPoints,
        getLeaderboard,
        jobAssignments,
        refreshData,
        addNotification,
        receivePO,
        receivePOSplit,
        finalizePO,
        assignJob,
        updateJobItem,
        completeJob,
        resetJob,
        addProduct,
        updateJobStatus,
        logSystemEvent,
        processReturn,
        deleteJob,
        t,
        adjustStockMutation,
        relocateProductMutation,
        putawayStock,
        filteredJobs,
        filteredProducts,
        filteredEmployees,
        filteredMovements,
        historicalJobs,
        resolveOrderRef,
        canApprove,
        isMultiSiteRole,
        isHQ,
        needsSiteSelection,
        handleStartJob,
        activeTab,
        setActiveTab,
        selectedJob,
        setSelectedJob,
        isDetailsOpen,
        setIsDetailsOpen,
        isSubmitting,
        setIsSubmitting,
        showPointsPopup,
        setShowPointsPopup,
        earnedPoints,
        setEarnedPoints,
        wmsJobsService,
        formatJobId,
        formatDateTime,
        generateTrackingNumber,
        isScannerMode,
        setIsScannerMode,
        receivingPO,
        setReceivingPO,
        refreshJobs,
        fixBrokenJobs
    };



    // 🔒 SITE SELECTION REMOVED: User requested to delete the "Select a Location" page.
    // If we are in Global View, we simply fall through to the main UI.
    // Filter logic below handles what data is shown.




    return (
        <Protected permission="ACCESS_WAREHOUSE" showMessage>
            <FulfillmentProvider value={contextValue}>
                <FulfillmentContent />
            </FulfillmentProvider>
        </Protected>
    );
}
