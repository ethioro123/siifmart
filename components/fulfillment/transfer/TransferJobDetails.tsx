import React, { useState } from 'react';
import { X, Package, Box, CheckCircle, XCircle, Trash2, RefreshCw, Truck, Clock, MapPin, Info, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, User, Site, ReceivingItem } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';

interface TransferJobDetailsProps {
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (val: boolean) => void;
    products: Product[];
    sites: Site[];
    user: User | null;
    activeSite: Site | null;
    wmsJobsService: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    setActiveTransferJob: (job: WMSJob | null) => void;
    setTransferReceiveMode: (val: boolean) => void;
    setTransferReceiveItems: (items: ReceivingItem[]) => void;
    onResolveDiscrepancy?: (job: WMSJob, item: any, index: number) => void;
}

const MANAGER_ROLES = ['super_admin', 'warehouse_manager'];

export const TransferJobDetails: React.FC<TransferJobDetailsProps> = ({
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    products,
    sites,
    user,
    activeSite,
    wmsJobsService,
    addNotification,
    refreshData,
    setActiveTransferJob,
    setTransferReceiveMode,
    setTransferReceiveItems,
    onResolveDiscrepancy
}) => {
    const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null);

    if (!selectedJob || !isDetailsOpen || ['PICK', 'PACK', 'DISPATCH'].includes(selectedJob.type)) return null;

    const isManager = MANAGER_ROLES.includes(user?.role || '');
    const transferStatus = selectedJob.transferStatus || 'Requested';

    /* ─── ACTIONS ──────────────────────────────────────────────── */

    const handleApprove = async () => {
        setLoading('approve');
        try {
            const sourceSiteId = selectedJob.sourceSiteId || selectedJob.siteId;
            if (!sourceSiteId) throw new Error('Missing source site ID');
            const lineItems = selectedJob.lineItems || (selectedJob as any).line_items || [];
            if (lineItems.length === 0) throw new Error('Transfer has no items');

            const pickJob: any = {
                siteId: sourceSiteId,
                site_id: sourceSiteId,
                type: 'PICK',
                sourceSiteId,
                destSiteId: selectedJob.destSiteId,
                status: 'Pending',
                priority: selectedJob.priority || 'Normal',
                items: lineItems.length,
                lineItems: lineItems.map((item: any) => ({ ...item, status: 'Pending', pickedQty: 0 })),
                orderRef: selectedJob.id,   // ← UUID of parent TRANSFER
                createdBy: user,
                createdAt: new Date().toISOString(),
                jobNumber: selectedJob.jobNumber
            };

            await wmsJobsService.create(pickJob);
            await wmsJobsService.update(selectedJob.id, {
                transferStatus: 'Picking',
                approvedBy: user?.name
            } as any);

            addNotification('success', 'Transfer approved — Pick job created');
            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            addNotification('alert', 'Failed to approve: ' + e.message);
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        setLoading('reject');
        try {
            await wmsJobsService.update(selectedJob.id, {
                transferStatus: 'Rejected',
                approvedBy: user?.name   // record who rejected it
            } as any);
            addNotification('success', 'Transfer rejected');
            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            addNotification('alert', 'Failed to reject: ' + e.message);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Permanently delete this transfer request?')) return;
        setLoading('delete');
        try {
            await wmsJobsService.delete(selectedJob.id);
            addNotification('success', 'Transfer deleted');
            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            // Fallback: If delete isn't in the service, mark Cancelled
            try {
                await wmsJobsService.update(selectedJob.id, { status: 'Cancelled', transferStatus: 'Rejected' } as any);
                addNotification('success', 'Transfer cancelled');
                await refreshData();
                setSelectedJob(null);
            } catch {
                addNotification('alert', 'Failed to delete transfer');
            }
        } finally {
            setLoading(null);
        }
    };

    /* ─── RENDER ───────────────────────────────────────────────── */

    const statusColors: Record<string, string> = {
        Requested: 'text-yellow-400',
        Picking: 'text-orange-400',
        Picked: 'text-amber-400',
        Packed: 'text-indigo-400',
        'In-Transit': 'text-purple-400 flex items-center gap-2',
        Shipped: 'text-purple-400 flex items-center gap-2',
        Delivered: 'text-cyan-400',
        Received: 'text-green-400',
        Rejected: 'text-red-400',
    };

    const sourceSite = activeSite?.id === selectedJob.sourceSiteId ? activeSite : null; // Close enough for display
    const destSite = activeSite?.id === selectedJob.destSiteId ? activeSite : null;

    const totalItems = selectedJob.lineItems?.length || selectedJob.items || 0;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f11] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header - Glassmorphic Transfer Theme */}
                <div className="relative p-6 border-b border-white/10 bg-black/40 overflow-hidden">
                    {/* Background Accent Glow (Blue/Cyan for Transfer) */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                                <Truck size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                                        Transfer Details
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-500">
                                        #{formatJobId(selectedJob)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-white">
                                        <span className={`w-2 h-2 rounded-full ${transferStatus === 'Received' ? 'bg-green-500' : 'bg-cyan-500 animate-pulse'}`} />
                                        {transferStatus}
                                    </span>
                                    <span className="text-gray-600">•</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border ${selectedJob.priority === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                        selectedJob.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                            'border-white/10 text-gray-400'
                                        }`}>
                                        {selectedJob.priority || 'Normal'} Priority
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-gray-500" />
                                        {new Date(selectedJob.createdAt || (selectedJob as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedJob(null)} aria-label="Close" className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content - Robust Dashboard Layout */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.03),transparent)]">

                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">Requested By</span>
                                <span className="text-lg font-bold text-white tracking-tight">{selectedJob.requestedBy || 'System'}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                <Info size={18} />
                            </div>
                        </div>
                        {selectedJob.approvedBy && (
                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">
                                        {transferStatus === 'Rejected' ? 'Rejected By' : 'Approved By'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${transferStatus === 'Rejected' ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <span className="text-lg font-bold text-white tracking-tight">{selectedJob.approvedBy}</span>
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${transferStatus === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                    {transferStatus === 'Rejected' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Manifest */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Package size={16} className="text-cyan-400" />
                                Transfer Manifest
                            </h3>
                            <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase">
                                {totalItems} Distinct Items
                            </span>
                        </div>

                        <div className="space-y-3">
                            {selectedJob.lineItems?.map((item: any, idx: number) => {
                                const product = products.find(p => p.id === item.productId || p.sku === item.sku);
                                const itemQty = item.expectedQty || item.quantity || item.pickedQty || 0;
                                const itemSku = item.sku || product?.sku || 'N/A';
                                const itemName = item.name || item.productName || product?.name || 'Unknown Item';
                                const itemUnit = getSellUnit(item.unit || product?.unit);
                                const sizeNum = parseFloat(product?.size || '0');
                                const isWeightVol = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && sizeNum > 0;
                                
                                const expectedMeasure = isWeightVol 
                                    ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : (itemQty * sizeNum))
                                    : itemQty;

                                const receivedQty = item.receivedQty;
                                const showReceived = receivedQty !== undefined &&
                                    ['Received', 'Delivered', 'Completed'].some(s => s === selectedJob.transferStatus || s === selectedJob.status);
                                const hasDiscrepancy = showReceived && receivedQty !== expectedMeasure;
                                const isDone = showReceived && !hasDiscrepancy;

                                return (
                                    <div key={idx} className={`group relative bg-white/[0.02] border ${isDone ? 'border-green-500/20 bg-green-500/[0.01]' : 'border-white/5'
                                        } rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-300`}>

                                        <div className="flex items-center gap-5">
                                            {/* Thumbnail */}
                                            <div className="relative w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {product?.image ? (
                                                    <img src={product.image} alt={itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-white/20">
                                                        <Box size={28} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                                        <CheckCircle size={20} className="text-green-400" />
                                                    </div>
                                                )}
                                                {hasDiscrepancy && (
                                                    <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                                        <XCircle size={20} className="text-red-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <h4 className="text-white font-bold tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                                                    {itemName}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono font-black text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                                                        {itemSku}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantities & Actions */}
                                        <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-1">Expected</span>
                                                    {(() => {
                                                        const renderQty = (qty: number) => {
                                                            if (isWeightVol) {
                                                                let displayMeasure = qty * sizeNum;
                                                                if (item.requestedMeasureQty && qty === item.expectedQty) {
                                                                    displayMeasure = item.requestedMeasureQty;
                                                                }
                                                                return <span className="text-lg font-mono font-black text-white">{displayMeasure.toLocaleString()} <span className="text-[10px] text-gray-500 font-bold uppercase">{itemUnit.shortLabel}</span></span>;
                                                            }
                                                            return <span className="text-lg font-mono font-black text-white">{qty} <span className="text-[10px] text-gray-500 font-bold uppercase">{itemUnit.code !== 'UNIT' ? itemUnit.shortLabel : 'Units'}</span></span>;
                                                        };

                                                        return item.orderedQty && item.orderedQty > itemQty ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-mono font-bold text-red-500 line-through opacity-80 -mb-1" title="Short Picked">{item.orderedQty}</span>
                                                                <span className="leading-tight">{renderQty(itemQty)}</span>
                                                            </div>
                                                        ) : (
                                                            renderQty(itemQty)
                                                        );
                                                    })()}
                                                </div>
                                                {showReceived && (
                                                    <div className="text-right">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1 ${hasDiscrepancy ? 'text-red-600/60' : 'text-green-600/60'}`}>Received</span>
                                                        {(() => {
                                                            const renderRecvQty = (qty: number) => {
                                                                if (isWeightVol) {
                                                                    return <span className={`text-lg font-mono font-black ${hasDiscrepancy ? 'text-red-400' : 'text-green-400'}`}>{qty.toLocaleString()} <span className="text-[10px] uppercase font-bold opacity-60">{itemUnit.shortLabel}</span></span>;
                                                                }
                                                                return <span className={`text-lg font-mono font-black ${hasDiscrepancy ? 'text-red-400' : 'text-green-400'}`}>{qty} <span className="text-[10px] uppercase font-bold opacity-60">{itemUnit.code !== 'UNIT' ? itemUnit.shortLabel : 'Units'}</span></span>;
                                                            };
                                                            return renderRecvQty(receivedQty);
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {hasDiscrepancy && onResolveDiscrepancy && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onResolveDiscrepancy(selectedJob, item, idx);
                                                    }}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-center gap-1.5"
                                                >
                                                    <AlertTriangle size={12} />
                                                    Resolve Issue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!selectedJob.lineItems || selectedJob.lineItems.length === 0) && (
                                <div className="text-center py-8 text-gray-500 italic bg-white/[0.02] rounded-2xl border border-white/5">
                                    No items recorded.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Routing</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                            <span>{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'Unknown'}</span>
                            <ArrowRight size={14} className="text-cyan-500" />
                            <span>{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'Unknown'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* MANAGER ACTIONS */}
                        {transferStatus === 'Requested' && isManager && (
                            <button
                                onClick={handleApprove}
                                disabled={loading !== null}
                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                Approve Transfer
                            </button>
                        )}

                        {['Requested', 'Picking'].includes(transferStatus) && isManager && (
                            <button
                                onClick={handleReject}
                                disabled={loading !== null}
                                className="px-6 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading === 'reject' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                Reject
                            </button>
                        )}

                        {['Requested', 'Rejected'].includes(transferStatus) && isManager && (
                            <button
                                onClick={handleDelete}
                                disabled={loading !== null}
                                className="px-4 py-3 bg-white/5 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center gap-3 disabled:opacity-50"
                                title="Delete / Cancel"
                            >
                                {loading === 'delete' ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                        )}

                        {/* RECEIVE ACTION */}
                        {(transferStatus === 'In-Transit' || transferStatus === 'Shipped') && selectedJob.destSiteId === activeSite?.id && (
                            <button
                                onClick={() => {
                                    const lineItems = selectedJob.lineItems || (selectedJob as any).line_items || [];
                                    if (lineItems.length === 0) { addNotification('alert', 'No items to receive'); return; }
                                    setActiveTransferJob(selectedJob);
                                    setTransferReceiveItems(lineItems.map((item: any) => ({
                                        productId: item.productId,
                                        expectedQty: item.expectedQty,
                                        receivedQty: 0,
                                        condition: 'Good',
                                        notes: ''
                                    })));
                                    setTransferReceiveMode(true);
                                    setSelectedJob(null);
                                }}
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center gap-3 active:scale-95"
                            >
                                <Package size={18} />
                                Receive Items
                            </button>
                        )}

                        <button
                            onClick={() => setSelectedJob(null)}
                            className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-sm uppercase tracking-widest transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

