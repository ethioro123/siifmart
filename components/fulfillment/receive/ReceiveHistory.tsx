import React, { useState, useMemo, useEffect } from 'react';
import { History as HistoryIcon, Search, ChevronRight, User, Calendar, Clock, PackageCheck, Box, ReceiptText, Undo2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, PurchaseOrder, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';
import { getSellUnit } from '../../../utils/units';

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
    jobs = []
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
        const receivedOrders = orders.filter(o => {
            const isFullyReceived = (o.lineItems || []).length > 0 &&
                (o.lineItems || []).every(li => (li.receivedQty || 0) >= li.quantity);
            const isMarkedReceived = o.status === 'Received' || (o.status as any) === 'Closed';
            return isFullyReceived || isMarkedReceived;
        }).map(o => {
            // Resolve User Name
            const userId = o.approvedBy || o.createdBy;
            const userObj = employees.find(e => e.id === userId || e.name === userId);
            const displayId = userObj?.code || (userId && userId.length > 20 ? userId.slice(0, 5).toUpperCase() : userId);
            const userName = userObj
                ? `${userObj.name} (${displayId})`
                : (userId ? `${userId} (${displayId})` : 'System');

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
                displayQty = `${qtyItems.length} items`;
            }

            return {
                id: o.id,
                reference: o.poNumber || o.po_number || o.id.slice(0, 8),
                type: 'PO',
                actionType: 'Manifest Finalized',
                status: o.status === 'Approved' ? 'Received' : o.status,
                subtitle: (o.lineItems || []).length === 1
                    ? (o.lineItems[0].productName || (o.lineItems[0] as any).name || o.supplierName)
                    : (o.lineItems || []).length > 1
                        ? `${o.lineItems[0].productName || (o.lineItems[0] as any).name} + ${(o.lineItems || []).length - 1} more`
                        : o.supplierName,
                date: o.updatedAt || o.updated_at || o.createdAt || o.created_at || new Date().toISOString(),
                user: userName,
                items: (o.lineItems || []).length,
                rawData: o,
                // Only show SKU if it's a single-item PO to avoid ambiguity
                sku: (o.lineItems || []).length === 1 ? o.lineItems?.[0]?.sku : undefined,
                displayQty
            };
        });

        // Only show RECEIVE jobs here — PUTAWAY has its own history tab
        const relevantJobs = historicalJobs.filter(j => j.type === 'RECEIVE').map(j => {
            // Resolve User Name
            const userId = j.completedBy || j.createdBy || j.assignedTo;
            const userObj = employees.find(e => e.id === userId || e.name === userId);
            const displayId = userObj?.code || (userId && userId.length > 20 ? userId.slice(0, 5).toUpperCase() : userId);
            const userName = userObj
                ? `${userObj.name} (${displayId})`
                : (userId ? `${userId} (${displayId})` : 'System');

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
                displayQty = `${j.items || qtyItems.length} items`;
            }

            return {
                id: j.id,
                reference: resolveOrderRef(j.orderRef) || j.jobNumber || j.id.slice(0, 8),
                type: 'JOB',
                actionType: j.type === 'PUTAWAY' ? 'Stock Putaway' : 'Items Received',
                status: j.status,
                subtitle: j.lineItems?.[0]?.name || j.notes || 'Inbound Receipt',
                date: j.updatedAt || j.updated_at || j.createdAt || j.created_at || new Date().toISOString(),
                user: userName,
                items: j.items || j.lineItems?.length || 0,
                rawData: j,
                sku: j.lineItems?.[0]?.sku,
                displayQty
            };
        });

        const combined = [...receivedOrders, ...relevantJobs].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return combined.filter(item =>
            !search ||
            item.reference.toLowerCase().includes(search.toLowerCase()) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase())) ||
            (item.user && item.user.toLowerCase().includes(search.toLowerCase()))
        );
    }, [orders, historicalJobs, search, resolveOrderRef, employees]);

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
        <div className="border-t border-zinc-300 dark:border-white/10 mt-4 md:mt-8 pt-4 md:pt-8 relative overflow-hidden group/history">
            {/* 🌈 Futuristic Mesh Accent — hidden on mobile */}
            <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
            <div className="hidden md:block absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-6 mb-4 md:mb-8">
                <h4 className="text-base md:text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                    <div className="hidden md:block p-2 bg-zinc-100 dark:bg-violet-500/10 rounded-xl border border-zinc-300 dark:border-violet-500/20 group-hover/history:bg-violet-500/20 transition-colors">
                        <HistoryIcon size={20} className="text-zinc-950 dark:text-violet-400" />
                    </div>
                    History Logs
                </h4>
                <div className="relative w-full sm:w-72 group">
                    <div className="hidden md:block absolute -inset-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition duration-500"></div>
                    <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-xl focus-within:border-zinc-950 dark:focus-within:border-zinc-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-zinc-500 dark:text-zinc-600 group-focus-within:text-zinc-950 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by Reference..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 md:py-3 text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-widest focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        <AnimatePresence>
                            {paginatedHistory.map((item: any, index) => (
                                <motion.div
                                    key={`${item.type}-${item.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        setSelectedJob(item.rawData);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="group relative bg-white dark:bg-black/60 hover:bg-zinc-50 dark:hover:bg-black border border-zinc-200 dark:border-white/5 hover:border-violet-500/50 dark:hover:border-violet-400/50 rounded-xl md:rounded-2xl p-3 md:p-5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-violet-500/10"
                                >
                                    {/* Hover Glow — hidden on mobile */}
                                    <div className="hidden md:block absolute inset-0 bg-zinc-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {/* Top Row: Type & Status */}
                                    <div className="relative flex justify-between items-start mb-2 md:mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg transition-colors ${item.type === 'PO' ? 'bg-zinc-100 dark:bg-violet-500 text-zinc-950 dark:text-black shadow-md dark:shadow-violet-500/20' : 'bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-violet-400 group-hover:bg-violet-500/10'}`}>
                                                {item.type === 'PO' ? <ReceiptText size={14} /> : <PackageCheck size={14} />}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-500">
                                                {item.actionType}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors uppercase tracking-widest font-mono">
                                            {getRelativeTime(item.date)}
                                        </span>
                                        {item.type === 'JOB' && ((item.rawData as any)?.lineItems || (item.rawData as any)?.line_items || []).some((li: any) => (li.returnedQty || li.returned_qty) > 0) && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/20">
                                                Returned
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Content */}
                                    <div className="relative mb-2 md:mb-4">
                                        <h5 className="text-zinc-900 dark:text-zinc-200 font-black text-xs md:text-sm truncate pr-2 group-hover:text-black dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tight">
                                            {item.subtitle}
                                        </h5>
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-600 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                            <span className="bg-zinc-100 dark:bg-violet-500/5 px-1.5 py-0.5 rounded text-zinc-600 dark:text-violet-400 transition-colors group-hover:bg-violet-500/10 group-hover:text-violet-600 dark:group-hover:text-violet-300">#{item.reference}</span>
                                            {item.sku && <span className="hidden md:inline text-zinc-300 dark:text-zinc-800 font-black">| <span className="text-zinc-600 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400">{item.sku}</span></span>}
                                        </p>
                                    </div>

                                    {/* Footer: User & Details */}
                                    <div className="relative flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-2 md:pt-3 mt-auto">
                                        <div className="hidden md:flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-violet-950 flex items-center justify-center border border-zinc-300 dark:border-violet-500/30 shadow-inner group-hover/history:scale-110 transition-transform">
                                                <span className="text-[9px] font-black text-zinc-950 dark:text-violet-400">{item.user.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-600 uppercase tracking-widest leading-tight">By</span>
                                                <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-400 uppercase tracking-wider leading-tight">
                                                    {item.user}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {item.displayQty ? (
                                                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-violet-500/5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-violet-500/10 group-hover:border-violet-500/30 transition-all">
                                                    <Box size={12} className="text-zinc-950 dark:text-violet-400" />
                                                    <span className="text-[10px] font-black text-zinc-950 dark:text-violet-100 tabular-nums">{item.displayQty}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-600">{item.items} units</span>
                                            )}
                                            {item.type === 'JOB' && (item.rawData as any)?.status === 'Completed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReturnType('warehouse');
                                                        setReturnJob(item.rawData as WMSJob);
                                                    }}
                                                    className="flex items-center gap-1 bg-amber-500/5 hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all text-amber-400 hover:text-amber-300"
                                                    title="Return items to warehouse"
                                                >
                                                    <Undo2 size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Return</span>
                                                </button>
                                            )}
                                            {item.type === 'PO' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const po = item.rawData as any;
                                                        // Adapt PO data to WMSJob-like shape
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
                                                    className="flex items-center gap-1 bg-purple-500/5 hover:bg-purple-500/15 px-2 py-1 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all text-purple-400 hover:text-purple-300"
                                                    title="Return PO items (requires procurement approval)"
                                                >
                                                    <Undo2 size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Return</span>
                                                </button>
                                            )}
                                            <ChevronRight size={14} className="text-zinc-950 dark:text-violet-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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
                <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-zinc-100/50 dark:bg-zinc-100/[0.02] rounded-2xl md:rounded-3xl border border-dashed border-zinc-300 dark:border-white/10">
                    <div className="p-4 bg-zinc-100 dark:bg-gray-900 rounded-2xl mb-4 border border-zinc-200 dark:border-white/5 shadow-xl">
                        <HistoryIcon size={32} className="text-zinc-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">No history found</h3>
                    <p className="text-zinc-600 dark:text-gray-500 text-xs uppercase tracking-[0.2em] font-black">Scanning records empty</p>
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
