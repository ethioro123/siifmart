import React, { useState, useMemo, useEffect } from 'react';
import { History as HistoryIcon, Search, ChevronRight, User, Calendar, Clock, PackageCheck, Box, ReceiptText, Undo2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, PurchaseOrder, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';

import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';
import { getSellUnit } from '../../../utils/units';
import { convertToSellableUnits } from '../useReceiving';

interface ReceiveHistoryProps {
    orders: PurchaseOrder[];
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref: string) => string;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    employees: any[];
    products: Product[];
    user: any;
    addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any;
    wmsJobsService?: any;
    jobs?: WMSJob[];
    sites: any[];
    t: (key: string) => string;
}

const RECEIVE_HISTORY_PER_PAGE = 12;
const RECEIVE_HISTORY_PER_PAGE_MOBILE = 2;

export const ReceiveHistory: React.FC<ReceiveHistoryProps> = ({
    orders,
    historicalJobs,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    employees,
    products,
    user,
    addNotification,
    inventoryRequestsService,
    wmsJobsService,
    jobs = [],
    sites,
    t
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const [returnType, setReturnType] = useState<'warehouse' | 'procurement'>('warehouse');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const perPage = isMobile ? RECEIVE_HISTORY_PER_PAGE_MOBILE : RECEIVE_HISTORY_PER_PAGE;

    const filteredHistory = useMemo(() => {
        const employeeId = employees.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;
        const isStaffWithLimitedAccess = !['admin', 'warehouse_manager', 'super_admin', 'dispatcher', 'inventory_specialist'].includes(user?.role || '');

        const receivedOrders = orders.filter(o => {
            const isFullyReceived = (o.lineItems || []).length > 0 &&
                (o.lineItems || []).every(li => (li.receivedQty || 0) >= convertToSellableUnits(li.quantity, li));
            const isMarkedReceived = o.status === 'Received' || (o.status as any) === 'Closed';
            
            if (!isFullyReceived && !isMarkedReceived) return false;

            if (isStaffWithLimitedAccess) {
                const receiveJob = jobs.find(j => j.type === 'RECEIVE' && j.orderRef === o.id);
                if (receiveJob && receiveJob.assignedTo !== employeeId) return false;
            }

            return true;
        }).map(o => {
            // Find matching receive job if available to get actual completing worker
            const matchingJob = jobs?.find(j => j.type === 'RECEIVE' && (j.orderRef === o.id || (o.poNumber && j.jobNumber === o.poNumber))) ||
                historicalJobs?.find(j => j.type === 'RECEIVE' && (j.orderRef === o.id || (o.poNumber && j.jobNumber === o.poNumber)));

            // Resolve User Name: Prioritize the person who actually completed/received the goods
            const userId = o.receivedBy || (o as any).received_by || matchingJob?.completedBy || (matchingJob as any)?.completed_by || (o as any).completedBy || o.approvedBy || o.createdBy;
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            let userObj = employees.find(e => 
                e.id === userId || 
                (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
            );
            if (!userObj && user && userId && (
                userId.toLowerCase() === user.id?.toLowerCase() || 
                userId.toLowerCase() === user.email?.toLowerCase() || 
                userId.toLowerCase() === user.name?.toLowerCase() || 
                userId.toLowerCase() === user.employeeId?.toLowerCase()
            )) {
                userObj = employees.find(e => 
                    (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
                    (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
                    e.id === user.employeeId
                );
            }
            const displayId = (userObj?.code ? formatDisplayEmployeeId(userObj.code) : '') || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
            const resolvedUser = {
                name: userObj?.name || (userId ? userId : 'System'),
                displayId: displayId || ''
            };

            let displayQty = '';
            let qtyItems = o.lineItems || [];
            if (qtyItems.length === 1) {
                const li = qtyItems[0];
                const baseQty = li.receivedQty || li.quantity || 0;
                const unitDef = getSellUnit(li.unit);
                const sizeNum = parseFloat(li.size || '') || 0;
                if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                    displayQty = `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                } else {
                    displayQty = `${baseQty}${unitDef.code !== 'UNIT' ? ' ' + unitDef.shortLabel.toUpperCase() : ''}`;
                }
            } else if (qtyItems.length > 0) {
                displayQty = `${qtyItems.length} ${t('warehouse.itemPlural')}`;
            }

            return {
                id: o.id,
                reference: o.poNumber || o.po_number || o.id.slice(0, 8),
                type: 'PO',
                actionType: t('warehouse.manifestFinalized'),
                status: o.status === 'Approved' ? 'Received' : o.status,
                subtitle: (o.lineItems || []).length === 1
                    ? (o.lineItems[0].productName || (o.lineItems[0] as any).name || o.supplierName)
                    : (o.lineItems || []).length > 1
                        ? `${o.lineItems[0].productName || (o.lineItems[0] as any).name} + ${(o.lineItems || []).length - 1} ${t('warehouse.more')}`
                        : o.supplierName,
                date: o.updatedAt || o.updated_at || o.createdAt || o.created_at || new Date().toISOString(),
                resolvedUser,
                items: (o.lineItems || []).length,
                rawData: o,
                // Only show SKU if it's a single-item PO to avoid ambiguity
                sku: (o.lineItems || []).length === 1 ? o.lineItems?.[0]?.sku : undefined,
                displayQty
            };
        });

        // Only show RECEIVE jobs here — PUTAWAY has its own history tab
        const relevantJobs = historicalJobs.filter(j => {
            if (j.type !== 'RECEIVE') return false;
            if (isStaffWithLimitedAccess && j.assignedTo !== employeeId) return false;
            return true;
        }).map(j => {
            // Resolve User Name: Prioritize the person who actually completed the job!
            const userId = j.completedBy || (j as any).completed_by || j.receivedBy || (j as any).received_by || j.assignedTo || j.createdBy;
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            let userObj = employees.find(e => 
                e.id === userId || 
                (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
            );
            if (!userObj && user && userId && (
                userId.toLowerCase() === user.id?.toLowerCase() || 
                userId.toLowerCase() === user.email?.toLowerCase() || 
                userId.toLowerCase() === user.name?.toLowerCase() || 
                userId.toLowerCase() === user.employeeId?.toLowerCase()
            )) {
                userObj = employees.find(e => 
                    (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
                    (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
                    e.id === user.employeeId
                );
            }
            const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
            const resolvedUser = {
                name: userObj?.name || (userId ? userId : 'System'),
                displayId: displayId || ''
            };

            let displayQty = '';
            let qtyItems = j.lineItems || [];
            if (qtyItems.length === 1) {
                const li = qtyItems[0];
                const baseQty = li.expectedQty || li.quantity || 0;
                const unitDef = getSellUnit(li.unit);
                const sizeNum = parseFloat((li as any).size || '') || 0;
                if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                    displayQty = `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                } else {
                    displayQty = `${baseQty}${unitDef.code !== 'UNIT' ? ' ' + unitDef.shortLabel.toUpperCase() : ''}`;
                }
            } else if (j.items || qtyItems.length > 0) {
                displayQty = `${j.items || qtyItems.length} ${t('warehouse.itemPlural')}`;
            }

            return {
                id: j.id,
                reference: resolveOrderRef(j.orderRef) || j.jobNumber || j.id.slice(0, 8),
                type: 'JOB',
                actionType: j.type === 'PUTAWAY' ? (t('warehouse.stockPutaway') || 'Stock Putaway') : t('warehouse.itemsReceived'),
                status: j.status,
                subtitle: j.lineItems?.[0]?.name || j.notes || 'Inbound Receipt',
                date: j.updatedAt || j.updated_at || j.createdAt || j.created_at || new Date().toISOString(),
                resolvedUser,
                items: j.items || j.lineItems?.length || 0,
                rawData: j,
                sku: j.lineItems?.[0]?.sku,
                displayQty
            };
        });

        const combined = [...receivedOrders, ...relevantJobs].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return combined.filter(item => {
            if (!search) return true;
            const q = search.toLowerCase();
            const raw = item.rawData;

            let matchesItems = false;
            if (raw) {
                const itemsList = (raw as any).lineItems || (raw as any).line_items || [];
                matchesItems = itemsList.some((li: any) =>
                    (li.name || '').toLowerCase().includes(q) ||
                    (li.productName || '').toLowerCase().includes(q) ||
                    (li.sku || '').toLowerCase().includes(q)
                );
            }

            return (
                item.reference.toLowerCase().includes(q) ||
                (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
                (item.resolvedUser && item.resolvedUser.name.toLowerCase().includes(q)) ||
                (item.resolvedUser && item.resolvedUser.displayId && item.resolvedUser.displayId.toLowerCase().includes(q)) ||
                (raw && raw.id && raw.id.toLowerCase().includes(q)) ||
                (raw && raw.status && raw.status.toLowerCase().includes(q)) ||
                (raw && (raw as any).notes && (raw as any).notes.toLowerCase().includes(q)) ||
                (raw && ((raw as any).jobNumber || (raw as any).job_number) && ((raw as any).jobNumber || (raw as any).job_number).toLowerCase().includes(q)) ||
                (raw && ((raw as any).poNumber || (raw as any).po_number) && ((raw as any).poNumber || (raw as any).po_number).toLowerCase().includes(q)) ||
                matchesItems
            );
        });
    }, [orders, historicalJobs, search, resolveOrderRef, employees, user, jobs, t]);

    const totalPages = Math.ceil(filteredHistory.length / perPage);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredHistory.slice(start, start + perPage);
    }, [filteredHistory, currentPage, perPage]);

    // Helper to format relative time
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        // Check if it is literally "Today" (same calendar day)
        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        }

        // For older dates: Show Date AND Time as requested
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="mt-4 md:mt-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 p-4 md:p-5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-[var(--shadow-sm)] mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                        <HistoryIcon size={18} />
                    </div>
                    <h4 className="text-base md:text-lg font-semibold text-[var(--theme-text-primary)] tracking-tight">
                        {t('warehouse.recentHistory')}
                    </h4>
                </div>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder={t('warehouse.searchHistoryPlaceholder')}
                        aria-label={t('warehouse.searchHistoryPlaceholder')}
                        title={t('warehouse.searchHistoryPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--theme-text-primary)] placeholder:[var(--theme-text-secondary)]/60 focus:outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent-muted)] transition-colors"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-4">
                        {paginatedHistory.map((item: any) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                onClick={() => {
                                    setSelectedJob(item.rawData);
                                    setIsDetailsOpen(true);
                                }}
                                className="group bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-2xl p-4 md:p-5 transition-all cursor-pointer shadow-[var(--shadow-sm)] active:scale-[0.98] flex flex-col justify-between"
                            >
                                <div>
                                    {/* Top Row: Type & Status */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] flex items-center justify-center">
                                                {item.type === 'PO' ? <ReceiptText size={14} /> : <PackageCheck size={14} />}
                                            </div>
                                            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                                {item.actionType}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                            {getRelativeTime(item.date)}
                                        </span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="mb-4">
                                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate tracking-tight">
                                            {item.subtitle}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                #{item.reference}
                                            </span>
                                            {item.sku && (
                                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                    {item.sku}
                                                </span>
                                            )}
                                            {item.type === 'JOB' && ((item.rawData as any)?.lineItems || (item.rawData as any)?.line_items || []).some((li: any) => (li.returnedQty || li.returned_qty) > 0) && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                    Returned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: User & Details */}
                                <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-3 mt-auto">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">By</span>
                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                                            {item.resolvedUser?.name} {item.resolvedUser?.displayId && <span className="font-mono text-[var(--theme-text-secondary)] font-normal">({item.resolvedUser.displayId})</span>}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.displayQty ? (
                                            <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--theme-border)]">
                                                <Box size={12} className="text-[var(--theme-text-secondary)]" />
                                                <span className="text-xs font-mono font-semibold tabular-nums text-[var(--theme-text-primary)]">{item.displayQty}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">{item.items} {t('warehouse.unitsLabel')}</span>
                                        )}

                                        {item.type === 'JOB' && (item.rawData as any)?.status === 'Completed' && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReturnType('warehouse');
                                                    setReturnJob(item.rawData as WMSJob);
                                                }}
                                                className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                                title={t('warehouse.returnToWarehouse')}
                                            >
                                                <Undo2 size={12} />
                                                <span>{t('warehouse.undoAction')}</span>
                                            </button>
                                        )}
                                        {item.type === 'PO' && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const po = item.rawData as any;
                                                    const adaptedJob = {
                                                        ...po,
                                                        type: 'RECEIVE',
                                                        status: 'Completed',
                                                        lineItems: (po.lineItems || []).map((li: any) => ({
                                                            productId: li.productId || li.product_id || '',
                                                            name: li.productName || li.name || li.sku || 'Unknown',
                                                            sku: li.sku || '',
                                                            receivedQty: li.receivedQty || li.received_qty || li.quantity || 0,
                                                            expectedQty: li.quantity || 0,
                                                            quantity: li.receivedQty || li.received_qty || li.quantity || 0
                                                        }))
                                                    };
                                                    setReturnType('procurement');
                                                    setReturnJob(adaptedJob as any);
                                                }}
                                                className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                                title={t('warehouse.returnToWarehouse')}
                                            >
                                                <Undo2 size={12} />
                                                <span>{t('warehouse.undoAction')}</span>
                                            </button>
                                        )}
                                        <ChevronRight size={14} className="text-[var(--theme-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={perPage}
                        onPageChange={setCurrentPage}
                        itemName="records"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3">
                        <HistoryIcon size={28} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-1">
                        {t('warehouse.noHistoryFound')}
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        {t('warehouse.completedAndFinalizedShipments')}
                    </p>
                </div>
            )}

            {/* Return to Warehouse Modal */}
            {returnJob && (
                <ReturnToWarehouseModal
                    job={returnJob}
                    products={products}
                    user={user}
                    onClose={() => setReturnJob(null)}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                    wmsJobsService={wmsJobsService}
                    jobs={jobs}
                    returnType={returnType}
                />
            )}
        </div>
    );
};
