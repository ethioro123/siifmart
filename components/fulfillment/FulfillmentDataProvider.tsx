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
        adjustStock
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
                const [
                    loadedJobs,
                    loadedTransfers,
                    loadedAssignments,
                    loadedZones,
                    loadedApprovals
                ] = await Promise.all([
                    wmsJobsService.getAll(activeSiteId),
                    transfersService.getAll(activeSiteId),
                    jobAssignmentsService.getAll(activeSiteId),
                    jobAssignmentsService.getAll(activeSiteId),
                    warehouseZonesService.getAll(activeSiteId),
                    barcodeApprovalsService.getAuditLog()
                ]);

                setJobs(loadedJobs);

                setJobs(loadedJobs);
                setTransfers(loadedTransfers);
                setJobAssignments(loadedAssignments);
                setZones(loadedZones);
                setBarcodeApprovals(loadedApprovals);

            } catch (error) {
                console.error("Failed to load fulfillment data", error);
                addNotification('alert', 'Failed to load fulfillment data');
            }
        };

        loadFulfillmentData();
    }, [activeSiteId, refreshCounter]);

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

        console.log(`📡 [Fulfillment] Subscribing to real-time updates for site: ${activeSiteId}`);

        const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
            onWMSJobChange: (event, payload) => {
                if (event === 'INSERT') setJobs(prev => prev.find(j => j.id === payload.id) ? prev : [payload, ...prev]);
                else if (event === 'UPDATE') setJobs(prev => prev.map(j => j.id === payload.id ? payload : j));
                else if (event === 'DELETE') setJobs(prev => prev.filter(j => j.id !== payload.id));
            },
            onJobAssignmentChange: (event, payload) => {
                if (event === 'INSERT') setJobAssignments(prev => [payload, ...prev]);
                else if (event === 'UPDATE') setJobAssignments(prev => prev.map(a => a.id === payload.id ? payload : a));
                else if (event === 'DELETE') setJobAssignments(prev => prev.filter(a => a.id !== payload.id));
            },
            onTransferChange: (event, payload) => {
                if (event === 'INSERT') setTransfers(prev => [payload, ...prev]);
                else if (event === 'UPDATE') setTransfers(prev => prev.map(t => t.id === payload.id ? payload : t));
                else if (event === 'DELETE') setTransfers(prev => prev.filter(t => t.id !== payload.id));
            }
        });

        return () => {
            realtimeService.unsubscribeAll(subscriptions);
        };
    }, [activeSiteId]);


    // ═══════════════════════════════════════════════════════════════
    // ACTIONS (Copied & Adapted from DataContext)
    // ═══════════════════════════════════════════════════════════════

    // ... (I will paste the actions in the next chunks using multi_replace or sequential writes to avoid huge artifacts)

    // For now, I'll return the provider structure with empty actions to establish the file, then populate.

    // ═══════════════════════════════════════════════════════════════════
    // EXTRACTED HOOKS — all business logic lives in focused hook files
    // ═══════════════════════════════════════════════════════════════════

    // Job Actions: assign, unassign, updateJobItem, updateJobStatus, updateJob
    const { assignJob, unassignJob, updateJobItem, updateJobStatus, updateJob } = useJobActions({
        jobs, jobAssignments, employees, user,
        setJobs, setJobAssignments, addNotification, queryClient
    });

    // Job Completion: completeJob (with job chaining, putaway, gamification)
    const { completeJob } = useJobCompletion({
        jobs, sales, employees, user, allOrders, allProducts,
        setJobs, setTransfers, setOrders, setAllOrders, setSales,
        addNotification, adjustStock, queryClient
    });

    // Job Maintenance: resetJob, fixBrokenJobs, createPutawayJob, deleteJob
    const { resetJob, fixBrokenJobs, createPutawayJob, deleteJob } = useJobMaintenance({
        jobs, orders, products, activeSite,
        setJobs, addNotification, refreshJobs, queryClient
    });

    // Receiving: receivePO, receivePOSplit, finalizePO
    const { receivePO, receivePOSplit, finalizePO } = useReceiving({
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification
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
            console.error(e);
            addNotification('alert', 'Failed to approve barcode');
        }
    };

    const rejectBarcode = async (id: string, userId: string, reason: string) => {
        try {
            await barcodeApprovalsService.reject(id, userId, reason);
            setBarcodeApprovals(prev => prev.filter(b => b.id !== id));
            addNotification('success', 'Barcode rejected');
        } catch (e) {
            console.error(e);
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
