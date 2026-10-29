import {getFulfillmentTransferPage} from '../../services/fulfillment-transfer-queue.service';
import {useFulfillmentQueuePaging,fulfillmentQueueWorker} from '../../hooks/useFulfillmentQueuePaging';
import { useScopedJobHistory } from '../../hooks/useScopedJobHistory';
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
import { mapWmsJobRow } from '../../services/wms-jobs.mapper';
import { mapJobAssignmentRow } from '../../services/job-assignments.service';
import { playBeep } from '../../utils/audioUtils';
import { logger } from '../../utils/logger';
import { isAdminSite } from '../../utils/countryAdmin';
interface FulfillmentDataContextType {
    jobs: WMSJob[];
    /** RULE 10: Starts empty on mount. Populated only when user explicitly clicks History. */
    historicalJobs: WMSJob[];
    historyError:boolean;
    historyLoading:boolean;
    historyHasMore:boolean;
    loadMoreHistory:()=>Promise<void>;
    queueHasMore:boolean;
    queueLoading:boolean;
    queueError:boolean;
    loadMoreJobs:()=>Promise<void>;
    transfers: TransferRecord[];
    jobAssignments: JobAssignment[];
    zones: WarehouseZone[];
    barcodeApprovals: BarcodeApproval[];
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
    receivePO: (poId: string, receivedItems?: POReceivingInput[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>, locationId?: string, user?: { name: string; email: string }) => Promise<any>;
    receivePOSplit: (poId: string, itemId: string, variants: Array<{ sku: string; skuType: 'existing' | 'new'; productId?: string; productName?: string; quantity: number; barcode?: string; barcodes?: string[]; expiryDate?: string; batchNumber?: string; condition?: string; }>, locationId?: string, user?: { name: string; email: string }) => Promise<void>;
    finalizePO: (poId: string) => Promise<void>;
    requestTransfer: (transfer: TransferRecord) => void;
    shipTransfer: (id: string, user: string) => void;
    receiveTransfer: (id: string, user: string, receivedQuantities?: Record<string, number>) => void;
    approveBarcode: (id: string, userId: string) => Promise<void>;
    rejectBarcode: (id: string, userId: string, reason: string) => Promise<void>;
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
    const [jobs, setJobs] = useState<WMSJob[]>([]);
    /** RULE 10: Never pre-populated. Filled only on user-triggered loadHistoricalJobs(). */
    const history = useScopedJobHistory(activeSiteId, effectiveCountry || settings?.country || 'ET', user, employees);
    const {historicalJobs,loadHistoricalJobs,historyError,historyLoading,historyHasMore,loadMoreHistory}=history;
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
    const [zones, setZones] = useState<WarehouseZone[]>([]);
    const [barcodeApprovals, setBarcodeApprovals] = useState<BarcodeApproval[]>([]);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const queueWorker=fulfillmentQueueWorker(user,employees);
    const {initialize,failInitial,loadMoreJobs,queueHasMore,queueLoading,queueError}=useFulfillmentQueuePaging(activeSiteId,effectiveCountry||settings?.country||'',queueWorker,user?.id,setJobs,setJobAssignments,setTransfers);
    const siteFilteredEmployees = useMemo(() => {
        if (!activeSiteId) return [];
        return employees.filter((e: any) => {
            const empSiteId = e.siteId || e.site_id;
            return empSiteId === activeSiteId;
        });
    }, [employees, activeSiteId]);
    const refreshJobs = useCallback(() => setRefreshCounter(c => c + 1), []);
    /**
     * RULE 10 — Zero Eager History: on-demand history loader.
     * Called ONLY when the user explicitly switches to the History view in any tab.
     * Clears stale cache and fetches completed/cancelled jobs on demand.
     */
    useEffect(() => {
        if (!activeSiteId) return;
        if (!user?.id) {
            setJobs([]);
            setTransfers([]);
            setJobAssignments([]);
            setZones([]);
            setBarcodeApprovals([]);
            return;
        }
        let cancelled=false;
        setJobs([]);setTransfers([]);setJobAssignments([]);
        const loadFulfillmentData = async () => {
            try {
                const employeeId=queueWorker;
                const isCountryAdmin = isAdminSite(activeSite);
                const targetSiteId = isCountryAdmin ? undefined : activeSiteId;
                const activeCountryCode = effectiveCountry || settings?.country || 'ET';
                const [
                    loadedJobs,
                    loadedTransfers,
                    loadedZones,
                    loadedApprovals
                ] = await Promise.all([
                    wmsJobsService.getActivePage(activeSiteId, employeeId, activeCountryCode),
                    getFulfillmentTransferPage(activeSiteId,activeCountryCode),
                    warehouseZonesService.getAll(activeSiteId),
                    barcodeApprovalsService.getAuditLog(targetSiteId, activeCountryCode)
                ]);
                if(cancelled)return;
                initialize(loadedJobs.hasMore||loadedTransfers.hasMore,loadedJobs.cursor,loadedTransfers.cursor);
                setJobs(loadedJobs.jobs);
                setTransfers(loadedTransfers.transfers);
                try {
                    const assignments=await jobAssignmentsService.getForJobs(loadedJobs.jobs, activeSiteId);
                    if(cancelled)return;setJobAssignments(assignments);
                } catch (assignmentError) {
                    if(cancelled)return;
                    setJobAssignments([]);
                    logger.error('FulfillmentDataProvider', 'Failed to load active job assignments', assignmentError);
                    addNotification('alert', 'Job assignments could not be loaded.');
                }
                setZones(loadedZones);
                setBarcodeApprovals(loadedApprovals);
            } catch (error) {
                if(cancelled)return;failInitial();
                logger.error('FulfillmentDataProvider', "Failed to load fulfillment data", error);
                addNotification('alert', 'Failed to load fulfillment data');
            }
        };
        loadFulfillmentData();
        return ()=>{cancelled=true;};
    }, [activeSiteId, effectiveCountry, refreshCounter, user?.email, user?.id, user?.name, user?.employeeId, user?.role]);
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
                    if ((mapped.items || 0) > 0 && (!mapped.lineItems || mapped.lineItems.length === 0)) {
                        wmsJobsService.getById(mapped.id).then((freshJob: WMSJob | null) => {
                            if (freshJob) {
                                setJobs(curr => curr.map(j => j.id === freshJob.id ? freshJob : j));
                            }
                        }).catch(() => {});
                    }
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
    const { assignJob, unassignJob, updateJobItem, updateJobStatus, updateJob, autoAssignJobs, autoUnassignJobs } = useJobActions({
        jobs, jobAssignments, employees: siteFilteredEmployees, user,
        setJobs, setJobAssignments, addNotification, queryClient, activeSiteId
    });
    const { completeJob } = useJobCompletion({
        jobs, sales, employees, user, allOrders, allProducts, jobAssignments,
        setJobs, setTransfers, setOrders, setAllOrders, setSales, setJobAssignments,
        addNotification, adjustStock, queryClient
    });
    const { resetJob, fixBrokenJobs, createPutawayJob, deleteJob } = useJobMaintenance({
        jobs, orders, products, activeSite: activeSite || null, user, countryCode:effectiveCountry || settings?.country || '',
        setJobs, addNotification, refreshJobs, queryClient
    });
    const { receivePO, receivePOSplit, finalizePO } = useReceiving({
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts, settings
    });
    const { requestTransfer, shipTransfer, receiveTransfer, updateTransfer } = useTransfers({
        transfers, sites,
        setJobs, setTransfers, addNotification, logSystemEvent
    });
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
            historicalJobs,historyError,historyLoading,historyHasMore,loadMoreHistory,
            loadMoreJobs,queueHasMore,queueLoading,queueError,
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
