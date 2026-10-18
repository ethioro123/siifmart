import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    WMSJob, JobItem, TransferRecord, JobAssignment,
    WarehouseZone, BarcodeApproval, Product, PurchaseOrder, POReceivingInput,
    Site
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
    systemLogsService
} from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { realtimeService } from '../../services/realtime.service';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useReceiving } from './useReceiving';
import { useJobActions } from './useJobActions';
import { useJobCompletion } from './useJobCompletion';
import { useJobMaintenance } from './useJobMaintenance';
import { useTransfers } from './useTransfers';
import { useGhostJobCleanup } from './hooks/useGhostJobCleanup';
import { mapWmsJobRow } from '../../services/wms-jobs.mapper';
import { mapJobAssignmentRow } from '../../services/job-assignments.service';
import { playBeep } from '../../utils/audioUtils';
import { logger } from '../../utils/logger';
import { isAdminSite } from '../../utils/countryAdmin';

interface FulfillmentDataContextType {
    // State
    jobs: WMSJob[];
    /** RULE 10: Starts empty on mount. Populated only when user explicitly clicks History. */
    historicalJobs: WMSJob[];
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

    /**
     * RULE 10 — Zero Eager History: call this ONLY when the user explicitly clicks the History tab.
     * Fetches the 25 most recent completed/cancelled jobs on demand.
     */
    loadHistoricalJobs: (limit?: number) => Promise<void>;

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
        setAllProducts,
        effectiveCountry
    } = useData(); // Dependency on DataContext

    const { user } = useStore();
    const queryClient = useQueryClient();
    const activeSiteId = activeSite?.id;

    // --- LOCAL STATE ---
    const [jobs, setJobs] = useState<WMSJob[]>([]);
    /** RULE 10: Never pre-populated. Filled only on user-triggered loadHistoricalJobs(). */
    const [historicalJobs, setHistoricalJobs] = useState<WMSJob[]>([]);
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

    /**
     * RULE 10 — Zero Eager History: on-demand history loader.
     * Called ONLY when the user explicitly switches to the History view in any tab.
     * Clears stale cache and fetches completed/cancelled jobs on demand.
     */
    const loadHistoricalJobs = useCallback(async (limit: number = 200) => {
        if (!activeSiteId) return;
        try {
            const activeCountryCode = effectiveCountry || settings?.country || 'ET';
            const fetched = await wmsJobsService.getHistory(activeSiteId, limit, undefined, activeCountryCode);
            setHistoricalJobs(fetched);
        } catch (error) {
            logger.error('FulfillmentDataProvider', 'Failed to load history', error);
        }
    }, [activeSiteId, effectiveCountry, settings?.country]);

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

        // The provider mounts before CentralStore finishes restoring Supabase Auth.
        // Don't send protected table requests with the publishable key as `anon`.
        if (!user?.id) {
            setJobs([]);
            setTransfers([]);
            setJobAssignments([]);
            setZones([]);
            setBarcodeApprovals([]);
            setHistoricalJobs([]);
            return;
        }

        const loadFulfillmentData = async () => {
            try {
                // Global-queue roles (super_admin, managers, dispatchers) see ALL site jobs.
                // Do NOT pass their personal employeeId — it would pollute the DB query with
                // an auth UUID that may match stale assigned_to records, showing false assignments.
                const GLOBAL_QUEUE_ROLES = [
                    'super_admin', 'admin', 'manager', 'regional_manager',
                    'operations_manager', 'warehouse_manager', 'dispatcher',
                    'store_manager', 'logistics_manager', 'inventory_manager',
                    'assistant_manager', 'shift_lead', 'inventory_specialist',
                    'dispatch_manager', 'supply_chain_manager', 'fleet_maintenance_supervisor', 'replenishment_planner'
                ];
                const isGlobalRole = GLOBAL_QUEUE_ROLES.includes((user?.role || '').toLowerCase());

                // For operational roles (picker, packer, driver etc.) pass their employee ID
                // so the query also catches jobs cross-site that are explicitly assigned to them.
                const currentEmployee = !isGlobalRole ? employees.find((e: any) =>
                    (user?.email && e.email === user.email) ||
                    (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
                    (user?.employeeId && e.id === user.employeeId) ||
                    e.id === user?.id
                ) : undefined;
                const employeeId = !isGlobalRole ? (currentEmployee?.id || user?.employeeId || user?.id) : undefined;

                const isCountryAdmin = isAdminSite(activeSite);
                const targetSiteId = isCountryAdmin ? undefined : activeSiteId;
                const activeCountryCode = effectiveCountry || settings?.country || 'ET';

                const [
                    loadedJobs,
                    loadedTransfers,
                    loadedAssignments,
                    loadedZones,
                    loadedApprovals
                ] = await Promise.all([
                    // RULE 10: limit=0 → active jobs only, zero history on mount
                    wmsJobsService.getAll(activeSiteId, 0, employeeId, activeCountryCode),
                    transfersService.getAll(activeSiteId),
                    jobAssignmentsService.getAll(activeSiteId),
                    warehouseZonesService.getAll(activeSiteId),
                    barcodeApprovalsService.getAuditLog(targetSiteId, activeCountryCode)
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
    }, [activeSiteId, refreshCounter, user?.email, user?.id, user?.name, user?.employeeId, user?.role]);

    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
        if (!activeSiteId || !user?.id) return;

        const currentWorker = employees.find((e: any) =>
            (user?.email && e.email === user.email) ||
            (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
            (user?.employeeId && e.id === user.employeeId) ||
            e.id === user?.id
        );
        const currentWorkerId = currentWorker?.id || user?.employeeId || user?.id;

        logger.debug('FulfillmentDataProvider', `📡 [Fulfillment] Subscribing to real-time updates for site: ${activeSiteId}`);

        const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
            onWMSJobChange: (event, payload) => {
                if (event === 'INSERT') {
                    const mapped = mapWmsJobRow(payload);
                    setJobs(prev => {
                        if (prev.some(j => j.id === mapped.id)) return prev;
                        return [mapped, ...prev];
                    });
                    // If line items not present in payload, fetch full job
                    if ((mapped.items || 0) > 0 && (!mapped.lineItems || mapped.lineItems.length === 0)) {
                        wmsJobsService.getById(mapped.id).then((freshJob: WMSJob | null) => {
                            if (freshJob) {
                                setJobs(curr => curr.map(j => j.id === freshJob.id ? freshJob : j));
                            }
                        }).catch(() => {});
                    }
                    // Alert worker if newly assigned to them
                    if (currentWorkerId && mapped.assignedTo === currentWorkerId) {
                        try { playBeep('success'); } catch {}
                        addNotification('info', `New job assigned: ${mapped.jobNumber || mapped.type}`);
                    }
                    queryClient.invalidateQueries({ queryKey: ['jobs'] });
                }
                else if (event === 'UPDATE') {
                    const mapped = mapWmsJobRow(payload);
                    let wasAssignedToMeBefore = false;
                    setJobs(prev => {
                        const existing = prev.find(j => j.id === mapped.id);
                        if (!existing) {
                            return [mapped, ...prev];
                        }
                        wasAssignedToMeBefore = existing.assignedTo === currentWorkerId;
                        const hasLineItemsInPayload = Array.isArray(payload.line_items) && payload.line_items.length > 0;
                        const mergedLineItems = hasLineItemsInPayload ? mapped.lineItems : (existing.lineItems || []);

                        if (!hasLineItemsInPayload && (!existing.lineItems || existing.lineItems.length === 0)) {
                            wmsJobsService.getById(mapped.id).then((freshJob: WMSJob | null) => {
                                if (freshJob) {
                                    setJobs(curr => curr.map(j => j.id === freshJob.id ? freshJob : j));
                                }
                            }).catch(() => {});
                        }
                        return prev.map(j => j.id === mapped.id ? { ...existing, ...mapped, lineItems: mergedLineItems } : j);
                    });

                    // Alert if newly assigned to current worker
                    if (currentWorkerId && mapped.assignedTo === currentWorkerId && !wasAssignedToMeBefore) {
                        try { playBeep('success'); } catch {}
                        addNotification('info', `Job assigned to you: ${mapped.jobNumber || mapped.type}`);
                    }
                    queryClient.invalidateQueries({ queryKey: ['jobs'] });
                }
                else if (event === 'DELETE') {
                    const targetId = payload.old?.id || payload.id;
                    setJobs(prev => prev.filter(j => j.id !== targetId));
                    queryClient.invalidateQueries({ queryKey: ['jobs'] });
                }
            },
            onJobAssignmentChange: (event, payload) => {
                const mappedAssignment = mapJobAssignmentRow(payload);
                if (event === 'INSERT') {
                    setJobAssignments(prev => {
                        if (prev.some(a => a.id === mappedAssignment.id)) {
                            return prev.map(a => a.id === mappedAssignment.id ? mappedAssignment : a);
                        }
                        return [mappedAssignment, ...prev];
                    });
                }
                else if (event === 'UPDATE') {
                    setJobAssignments(prev => {
                        const exists = prev.some(a => a.id === mappedAssignment.id);
                        if (!exists) return [mappedAssignment, ...prev];
                        return prev.map(a => a.id === mappedAssignment.id ? mappedAssignment : a);
                    });
                }
                else if (event === 'DELETE') {
                    const targetId = payload.old?.id || payload.id;
                    setJobAssignments(prev => prev.filter(a => a.id !== targetId));
                }
                queryClient.invalidateQueries({ queryKey: ['job-assignments'] });
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

                if (event === 'INSERT') setTransfers(prev => [mapRealtimeTransfer(payload), ...prev]);
                else if (event === 'UPDATE') setTransfers(prev => prev.map(t => t.id === payload.id ? mapRealtimeTransfer(payload) : t));
                else if (event === 'DELETE') setTransfers(prev => prev.filter(t => t.id !== payload.id));
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
            },
            onPurchaseOrderChange: (event, payload) => {
                const poId = payload.id || payload.old?.id;
                if (!poId) return;
                queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                if (event === 'INSERT' || event === 'UPDATE') {
                    purchaseOrdersService.getById(poId).then(fullPO => {
                        if (fullPO) {
                            setOrders(prev => prev.some(o => o.id === fullPO.id) ? prev.map(o => o.id === fullPO.id ? fullPO : o) : [fullPO, ...prev]);
                            setAllOrders(prev => prev.some(o => o.id === fullPO.id) ? prev.map(o => o.id === fullPO.id ? fullPO : o) : [fullPO, ...prev]);
                        }
                    }).catch(() => {});
                } else if (event === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== poId));
                    setAllOrders(prev => prev.filter(o => o.id !== poId));
                }
            },
            onInventoryRequestChange: () => {
                queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
            },
            onBarcodeApprovalChange: (event, payload) => {
                const targetId = payload.id || payload.old?.id;
                if (event === 'INSERT') setBarcodeApprovals(prev => [payload, ...prev]);
                else if (event === 'UPDATE') setBarcodeApprovals(prev => prev.map(b => b.id === targetId ? { ...b, ...payload } : b));
                else if (event === 'DELETE') setBarcodeApprovals(prev => prev.filter(b => b.id !== targetId));
                queryClient.invalidateQueries({ queryKey: ['barcode-approvals'] });
            }
        });

        return () => {
            logger.debug('FulfillmentDataProvider', 'Unsubscribing from fulfillment real-time updates...');
            realtimeService.unsubscribeAll(subscriptions);
        };
    }, [activeSiteId, employees, user?.id, user?.email, user?.name, user?.employeeId, queryClient, addNotification]);

    // --- AUTO CLEANUP OF GHOST JOBS ---
    useGhostJobCleanup({ jobs, orders, user, setJobs });


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
        setProducts, setAllProducts, settings
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
            historicalJobs,
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
            loadHistoricalJobs,
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
