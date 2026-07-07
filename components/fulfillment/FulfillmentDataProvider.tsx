import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    WMSJob, JobItem, TransferRecord, JobAssignment,
    WarehouseZone, BarcodeApproval, Product, PurchaseOrder, POReceivingInput,
    SaleRecord, SystemConfig, Site
} from '../../types';
import {
    wmsJobsService,
    transfersService,
    jobAssignmentsService,
    warehouseZonesService,
    barcodeApprovalsService,
    productsService,
    purchaseOrdersService,
    salesService,
    systemLogsService // Added for logging
} from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { realtimeService } from '../../services/realtime.service'; // Import realtime service
import { useData } from '../../contexts/DataContext'; // Consume DataContext for products/sites
import { useStore } from '../../contexts/CentralStore'; // Consume Store for User
import { TRANSLATIONS, Language } from '../../utils/translations';
import { generateSKU } from '../../utils/skuGenerator';
import { CURRENCY_SYMBOL } from '../../constants';
import { useReceiving, convertToSellableUnits } from './useReceiving';
import { useJobActions } from './useJobActions';
import { useJobCompletion } from './useJobCompletion';
import { useJobMaintenance } from './useJobMaintenance';
import { useTransfers } from './useTransfers';
import { logger } from '../../utils/logger';

// convertToSellableUnits is now imported from ./useReceiving

// Helper for translations (duplicated from DataContext until util is widespread)
const getTranslation = (path: string): string => {
    const lang = (localStorage.getItem('siifmart_language') as Language) || 'en';
    const keys = path.split('.');
    let current: any = TRANSLATIONS;
    for (const key of keys) {
        if (current[key] === undefined) return path;
        current = current[key];
    }
    if (typeof current === 'object' && current[lang]) return current[lang];
    if (typeof current === 'object' && current['en']) return current['en'];
    return path;
};

interface FulfillmentDataContextType {
    // State
    jobs: WMSJob[];
    transfers: TransferRecord[];
    jobAssignments: JobAssignment[];
    zones: WarehouseZone[];
    barcodeApprovals: BarcodeApproval[];

    // Actions
    assignJob: (jobId: string, employeeIdOrName: string) => Promise<void>;
    unassignJob: (jobId: string) => Promise<void>;
    updateJobItem: (jobId: string, itemId: number, status: JobItem['status'], qty: number, location?: string) => Promise<void>;
    updateJobStatus: (jobId: string, status: WMSJob['status']) => Promise<void>;
    updateJob: (id: string, updates: Partial<WMSJob>) => Promise<void>;
    autoAssignJobs: () => Promise<void>;
    autoUnassignJobs: () => Promise<void>;
    completeJob: (jobId: string, user: string, skipValidation?: boolean, optimisticLineItems?: any[]) => Promise<any>;
    resetJob: (jobId: string) => Promise<void>;
    fixBrokenJobs: () => Promise<void>;
    createPutawayJob: (product: Product, quantity: number, user: string, source?: string) => Promise<WMSJob | undefined>;
    deleteJob: (id: string) => Promise<void>;

    // Receiving Actions (Moved from DataContext)
    receivePO: (poId: string, receivedItems?: POReceivingInput[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>, locationId?: string, user?: { name: string; email: string }) => Promise<any>;
    receivePOSplit: (poId: string, itemId: string, variants: Array<{ sku: string; skuType: 'existing' | 'new'; productId?: string; productName?: string; quantity: number; barcode?: string; barcodes?: string[]; expiryDate?: string; batchNumber?: string; condition?: string; }>, locationId?: string, user?: { name: string; email: string }) => Promise<void>;
    finalizePO: (poId: string) => Promise<void>;

    // Transfer Actions
    requestTransfer: (transfer: TransferRecord) => void;
    shipTransfer: (id: string, user: string) => void;
    receiveTransfer: (id: string, user: string, receivedQuantities?: Record<string, number>) => void;

    // Data Audit
    approveBarcode: (id: string, userId: string) => Promise<void>;
    rejectBarcode: (id: string, userId: string, reason: string) => Promise<void>;

    // Refresh
    refreshJobs: () => void;
}

const FulfillmentDataContext = createContext<FulfillmentDataContextType | undefined>(undefined);

export const FulfillmentDataProvider = ({ children }: { children: ReactNode }) => {
    const {
        activeSite,
        sites,
        products,
        allProducts,
        employees,
        orders,
        setOrders,
        setAllOrders,
        allOrders,
        sales,
        setSales,
        settings,
        logSystemEvent,
        addNotification,
        refreshData: refreshInfo,
        adjustStock,
        setProducts,
        setAllProducts
    } = useData(); // Dependency on DataContext

    const { user } = useStore();
    const queryClient = useQueryClient();
    const activeSiteId = activeSite?.id;

    // --- LOCAL STATE ---
    const [jobs, setJobs] = useState<WMSJob[]>([]);
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
    const [zones, setZones] = useState<WarehouseZone[]>([]);
    const [barcodeApprovals, setBarcodeApprovals] = useState<BarcodeApproval[]>([]);
    const [refreshCounter, setRefreshCounter] = useState(0);

    // --- STRICT SITE-FILTERED EMPLOYEES ---
    // The raw `employees` from useData() contains ALL employees across ALL sites.
    // For auto-assign and assignment operations, we MUST restrict to the active site.
    const siteFilteredEmployees = useMemo(() => {
        if (!activeSiteId) return [];
        return employees.filter((e: any) => {
            const empSiteId = e.siteId || e.site_id;
            return empSiteId === activeSiteId;
        });
    }, [employees, activeSiteId]);

    // Call this from any child component to force a fresh fetch of WMS jobs
    const refreshJobs = useCallback(() => setRefreshCounter(c => c + 1), []);

    // --- FETCHING LOGIC (Migrated from DataContext hooks/useDataQueries) ---
    // In a real refactor, we should probably pull this out into a hook too, 
    // but for now we'll fetch inside useEffect to mirror DataContext behavior 
    // or use the existing react-query structure if possible.
    // Since useDataQueries was fetching EVERYTHING, we should ideally modify it or create a new one.
    // For the sake of this task, I will replicate the fetching logic using simple useEffects/service calls 
    // OR rely on the existing useDataQueries if it's modular.
    // Looking at useDataQueries usage in DataContext, it fetches everything. 
    // We want to STOP DataContext from fetching these. 
    // So we should implementation fetching here.

    useEffect(() => {
        if (!activeSiteId) return;

        const loadFulfillmentData = async () => {
            try {
                const currentEmployee = employees.find((e: any) => 
                    (user?.email && e.email === user.email) ||
                    (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
                    (user?.employeeId && e.id === user.employeeId) ||
                    e.id === user?.id
                );
                const employeeId = currentEmployee?.id || user?.id;

                const [
                    loadedJobs,
                    loadedTransfers,
                    loadedAssignments,
                    loadedZones,
                    loadedApprovals
                ] = await Promise.all([
                    wmsJobsService.getAll(activeSiteId, 500, employeeId),
                    transfersService.getAll(activeSiteId),
                    jobAssignmentsService.getAll(activeSiteId),
                    warehouseZonesService.getAll(activeSiteId),
                    barcodeApprovalsService.getAuditLog()
                ]);


                setJobs(loadedJobs);
                setTransfers(loadedTransfers);
                setJobAssignments(loadedAssignments);
                setZones(loadedZones);
                setBarcodeApprovals(loadedApprovals);

            } catch (error) {
                logger.error('FulfillmentDataProvider', "Failed to load fulfillment data", error);
                addNotification('alert', 'Failed to load fulfillment data');
            }
        };

        loadFulfillmentData();
    }, [activeSiteId, refreshCounter, employees.length, user?.email, user?.id]);

    // Enriched Jobs Memoization (Previously in DataContext)
    const enrichedJobs = useMemo(() => {
        return jobs.map(j => {
            // Clone job to allow extension
            const enhancedJob = { ...j } as any;

            // --- OUTBOUND ENRICHMENT (Pack/Dispatch) ---
            if (j.type === 'PACK' || j.type === 'DISPATCH' || j.type === 'PICK') {
                const orderRef = (j.orderRef || '').trim();

                // 1. Try finding linked Sale (for Customer details)
                const sale = sales.find(s => s.id === orderRef);
                // Note: access to `customers` is needed here. 
                // We need to grab customers from DataContext if we want this enrichment.
                // For now, let's keep it simple. If we need deep enrichment we might need `customers`.
            }
            return enhancedJob;
        });
    }, [jobs, sales, orders]); // Simplified for now


    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
        if (!activeSiteId) return;

        logger.debug('FulfillmentDataProvider', `📡 [Fulfillment] Subscribing to real-time updates for site: ${activeSiteId}`);

        const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
            onWMSJobChange: (event, payload) => {
                // Map raw DB payload (snake_case) to camelCase domain model
                // Without this mapping, realtime payloads create "ghost" jobs with undefined fields
                const mapped = {
                    ...payload,
                    siteId: payload.site_id,
                    items: payload.items_count,
                    assignedTo: payload.assigned_to,
                    orderRef: payload.order_ref,
                    lineItems: payload.line_items || [],
                    jobNumber: payload.job_number,
                    sourceSiteId: payload.source_site_id,
                    destSiteId: payload.dest_site_id,
                    transferStatus: payload.transfer_status,
                    requestedBy: payload.requested_by,
                    approvedBy: payload.approved_by,
                    shippedAt: payload.shipped_at,
                    deliveredAt: payload.delivered_at,
                    receivedAt: payload.received_at,
                    receivedBy: payload.received_by,
                    trackingNumber: payload.tracking_number,
                    createdAt: payload.created_at,
                    updatedAt: payload.updated_at,
                    deliveryMethod: payload.delivery_method,
                    hasDiscrepancy: payload.has_discrepancy,
                    discrepancyDetails: payload.discrepancy_details,
                    completedBy: payload.completed_by,
                    completedAt: payload.completed_at,
                    externalCarrierName: payload.external_carrier_name,
                    assignedBy: payload.assigned_by,
                    notes: payload.notes
                };
                if (event === 'INSERT') setJobs(prev => prev.find(j => j.id === mapped.id) ? prev : [mapped, ...prev]);
                else if (event === 'UPDATE') setJobs(prev => prev.map(j => j.id === mapped.id ? mapped : j));
                else if (event === 'DELETE') setJobs(prev => prev.filter(j => j.id !== (payload.old?.id || payload.id)));
            },
            onJobAssignmentChange: (event, payload) => {
                if (event === 'INSERT') setJobAssignments(prev => [payload, ...prev]);
                else if (event === 'UPDATE') setJobAssignments(prev => prev.map(a => a.id === payload.id ? payload : a));
                else if (event === 'DELETE') setJobAssignments(prev => prev.filter(a => a.id !== payload.id));
            },
            onTransferChange: (event, payload) => {
                const mapRealtimeTransfer = (data: any): TransferRecord => ({
                    ...data,
                    sourceSiteId: data.source_site_id,
                    destSiteId: data.dest_site_id,
                    requestedBy: data.requested_by,
                    approvedBy: data.approved_by,
                    shippedAt: data.shipped_at,
                    deliveredAt: data.delivered_at,
                    receivedAt: data.received_at,
                    receivedBy: data.received_by,
                    trackingNumber: data.tracking_number,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    deliveryMethod: data.delivery_method
                });
                
                if (event === 'INSERT') {
                    const mapped = mapRealtimeTransfer(payload);
                    setTransfers(prev => [mapped, ...prev]);
                }
                else if (event === 'UPDATE') {
                    const mapped = mapRealtimeTransfer(payload);
                    setTransfers(prev => prev.map(t => t.id === payload.id ? mapped : t));
                }
                else if (event === 'DELETE') setTransfers(prev => prev.filter(t => t.id !== payload.id));
            }
        });

        return () => {
            logger.debug('FulfillmentDataProvider', 'Unsubscribing from fulfillment real-time updates...');
            realtimeService.unsubscribeAll(subscriptions);
        };
    }, [activeSiteId]);

    // --- AUTO CLEANUP OF GHOST JOBS ---
    // Cleans up orphaned RECEIVE jobs where the PO was finalized,
    // but the RECEIVE WMS job was stuck in Pending/In-Progress due to UI disconnects.
    const hasRunGhostCleanup = React.useRef(false);
    useEffect(() => {
        if (!hasRunGhostCleanup.current && jobs.length > 0 && orders.length > 0) {
            hasRunGhostCleanup.current = true;
            let cleanupCount = 0;

            const ghostReceiveJobs = jobs.filter(j => 
                j.type === 'RECEIVE' && 
                ['Pending', 'In-Progress'].includes(j.status || '')
            );

            for (const job of ghostReceiveJobs) {
                const po = orders.find(o => o.id === job.orderRef);
                // If PO is missing or status is no longer 'Approved', map it as ghost job
                if (!po || po.status !== 'Approved') {
                    logger.debug('FulfillmentDataProvider', `🧹 [Auto-Cleanup] Completing orphaned ghost job: ${job.jobNumber} (${job.id})`);
                    cleanupCount++;
                    
                    wmsJobsService.update(job.id, { 
                        status: 'Completed',
                        completed_at: new Date().toISOString(),
                        completed_by: user?.id || 'System Auto-Cleanup'
                    } as any).catch(e => logger.error('FulfillmentDataProvider', 'Failed to auto-cleanup ghost job:', e as Error));

                    setJobs(prev => prev.map(j => j.id === job.id ? { 
                        ...j, 
                        status: 'Completed', 
                        completedAt: new Date().toISOString(),
                        completedBy: user?.id || 'System Auto-Cleanup'
                    } as WMSJob : j));
                }
            }
            if (cleanupCount > 0) {
                logger.debug('FulfillmentDataProvider', `✅ [Auto-Cleanup] Successfully cleared ${cleanupCount} ghost jobs.`);
            }
        }
    }, [jobs, orders, user]);


    // ═══════════════════════════════════════════════════════════════════
    // EXTRACTED HOOKS — all business logic lives in focused hook files
    // ═══════════════════════════════════════════════════════════════════

    const { assignJob, unassignJob, updateJobItem, updateJobStatus, updateJob, autoAssignJobs, autoUnassignJobs } = useJobActions({
        jobs, jobAssignments, employees: siteFilteredEmployees, user,
        setJobs, setJobAssignments, addNotification, queryClient, activeSiteId
    });

    // Job Completion: completeJob (with job chaining, putaway, gamification)
    const { completeJob } = useJobCompletion({
        jobs, sales, employees, user, allOrders, allProducts, jobAssignments,
        setJobs, setTransfers, setOrders, setAllOrders, setSales, setJobAssignments,
        addNotification, adjustStock, queryClient
    });

    // Job Maintenance: resetJob, fixBrokenJobs, createPutawayJob, deleteJob
    const { resetJob, fixBrokenJobs, createPutawayJob, deleteJob } = useJobMaintenance({
        jobs, orders, products, activeSite: activeSite || null, user,
        setJobs, addNotification, refreshJobs, queryClient
    });

    // Receiving: receivePO, receivePOSplit, finalizePO
    const { receivePO, receivePOSplit, finalizePO } = useReceiving({
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts
    });

    // Transfers: requestTransfer, shipTransfer, receiveTransfer, updateTransfer
    const { requestTransfer, shipTransfer, receiveTransfer, updateTransfer } = useTransfers({
        transfers, sites,
        setJobs, setTransfers, addNotification, logSystemEvent
    });

    // ─── Barcode Approvals (small, kept inline) ─────────────────────────

    const approveBarcode = async (id: string, userId: string) => {
        try {
            await barcodeApprovalsService.approve(id, userId);
            setBarcodeApprovals(prev => prev.filter(b => b.id !== id));
            addNotification('success', 'Barcode approved');
            refreshInfo();
        } catch (e) {
            logger.error('FulfillmentDataProvider', 'caught error', e as Error);
            addNotification('alert', 'Failed to approve barcode');
        }
    };

    const rejectBarcode = async (id: string, userId: string, reason: string) => {
        try {
            await barcodeApprovalsService.reject(id, userId, reason);
            setBarcodeApprovals(prev => prev.filter(b => b.id !== id));
            addNotification('success', 'Barcode rejected');
        } catch (e) {
            logger.error('FulfillmentDataProvider', 'caught error', e as Error);
            addNotification('alert', 'Failed to reject barcode');
        }
    };





    return (
        <FulfillmentDataContext.Provider value={{
            jobs,
            transfers,
            jobAssignments,
            zones,
            barcodeApprovals,
            assignJob,
            unassignJob,
            updateJobItem,
            updateJobStatus,
            updateJob,
            autoAssignJobs,
            autoUnassignJobs,
            completeJob,
            resetJob,
            fixBrokenJobs,
            createPutawayJob,
            deleteJob,
            receivePO,
            receivePOSplit,
            requestTransfer,
            shipTransfer,
            receiveTransfer,
            approveBarcode,
            finalizePO,
            rejectBarcode,
            refreshJobs
        }}>
            {children}
        </FulfillmentDataContext.Provider>
    );
};

export const useFulfillmentData = () => {
    const context = useContext(FulfillmentDataContext);
    if (context === undefined) {
        throw new Error('useFulfillmentData must be used within a FulfillmentDataProvider');
    }
    return context;
};
