import React, { useState } from 'react';
import { X, Package, Box, CheckCircle, XCircle, Trash2, Truck, Clock, Info, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, User, Site, ReceivingItem } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';

interface TransferJobDetailsProps {
    selectedJob: WMSJob | null; setSelectedJob: (job: WMSJob | null) => void;
    isDetailsOpen: boolean; setIsDetailsOpen: (val: boolean) => void;
    products: Product[]; sites: Site[]; user: User | null;
    activeSite: Site | null; wmsJobsService: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>; setActiveTransferJob: (job: WMSJob | null) => void;
    setTransferReceiveMode: (val: boolean) => void; setTransferReceiveItems: (items: ReceivingItem[]) => void;
    onResolveDiscrepancy?: (job: WMSJob, item: any, index: number) => void;
}

const MANAGER_ROLES = ['super_admin', 'warehouse_manager'];

export const TransferJobDetails: React.FC<TransferJobDetailsProps> = ({
    selectedJob, setSelectedJob, isDetailsOpen, setIsDetailsOpen, products, sites, user, activeSite, wmsJobsService, addNotification, refreshData, setActiveTransferJob, setTransferReceiveMode, setTransferReceiveItems, onResolveDiscrepancy
}) => {
    const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null);
    if (!selectedJob || !isDetailsOpen || ['PICK', 'PACK', 'DISPATCH'].includes(selectedJob.type)) return null;

    const isManager = MANAGER_ROLES.includes(user?.role || '');
    const transferStatus = selectedJob.transferStatus || 'Requested';

    const handleApprove = async () => {
        setLoading('approve');
        try {
            const sourceSiteId = selectedJob.sourceSiteId || selectedJob.siteId; if (!sourceSiteId) throw new Error('Missing source');
            const lineItems = selectedJob.lineItems || (selectedJob as any).line_items || []; if (lineItems.length === 0) throw new Error('No items');
            const pickJob: any = { siteId: sourceSiteId, site_id: sourceSiteId, type: 'PICK', sourceSiteId, destSiteId: selectedJob.destSiteId, status: 'Pending', priority: selectedJob.priority || 'Normal', items: lineItems.length, lineItems: lineItems.map((item: any) => ({ ...item, status: 'Pending', pickedQty: 0 })), orderRef: selectedJob.id, createdBy: user, createdAt: new Date().toISOString(), jobNumber: selectedJob.jobNumber };
            await wmsJobsService.create(pickJob); await wmsJobsService.update(selectedJob.id, { transferStatus: 'Picking', approvedBy: user?.name } as any);
            addNotification('success', 'Transfer approved'); await refreshData(); setSelectedJob(null);
        } catch (e: any) { addNotification('alert', e.message); } finally { setLoading(null); }
    };

    const handleReject = async () => {
        setLoading('reject');
        try { await wmsJobsService.update(selectedJob.id, { transferStatus: 'Rejected', approvedBy: user?.name } as any); addNotification('success', 'Rejected'); await refreshData(); setSelectedJob(null); }
        catch (e: any) { addNotification('alert', e.message); } finally { setLoading(null); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this transfer?')) return;
        setLoading('delete');
        try { await wmsJobsService.delete(selectedJob.id); addNotification('success', 'Deleted'); await refreshData(); setSelectedJob(null); }
        catch { try { await wmsJobsService.update(selectedJob.id, { status: 'Cancelled', transferStatus: 'Rejected' } as any); addNotification('success', 'Cancelled'); await refreshData(); setSelectedJob(null); } catch { addNotification('alert', 'Fail'); } } finally { setLoading(null); }
    };

    const totalItems = selectedJob.lineItems?.length || selectedJob.items || 0;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white dark:bg-[#0f0f11] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="relative p-7 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/40 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-xl"><Truck size={32} /></div>
                            <div>
                                <div className="flex items-center gap-4 mb-1.5"><h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Transfer Details</h2><span className="px-2.5 py-1 rounded-xl bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[10px] font-mono font-black text-gray-500 uppercase">#{formatJobId(selectedJob)}</span></div>
                                <div className="flex items-center gap-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    <span className="flex items-center gap-2 text-gray-900 dark:text-white"><span className={`w-2 h-2 rounded-full ${transferStatus === 'Received' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.4)]'}`} />{transferStatus}</span>
                                    <span className="text-gray-300 dark:text-gray-700">|</span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${selectedJob.priority === 'Critical' ? 'border-red-500/30 text-red-500 bg-red-500/10' : selectedJob.priority === 'High' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}>{selectedJob.priority || 'Normal'} Priority</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono ml-auto"><Clock size={12} className="text-gray-400" />{new Date(selectedJob.createdAt || (selectedJob as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedJob(null)} aria-label="Close" className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white dark:bg-[#0f0f11]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardStat label="Requested By" value={selectedJob.requestedBy || 'System'} icon={Info} />
                        {selectedJob.approvedBy && <DashboardStat label={transferStatus === 'Rejected' ? 'Rejected By' : 'Approved By'} value={selectedJob.approvedBy} icon={transferStatus === 'Rejected' ? XCircle : CheckCircle} color={transferStatus === 'Rejected' ? 'red' : 'green'} />}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6"><h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 text-xs uppercase tracking-[0.3em]"><Package size={16} className="text-cyan-500" /> Transfer Manifest</h3><span className="text-[10px] font-black text-gray-500 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5 uppercase tracking-widest">{totalItems} Unique Line Items</span></div>
                        <div className="space-y-4">
                            {selectedJob.lineItems?.map((item: any, idx: number) => {
                                const product = products.find(p => p.id === item.productId || p.sku === item.sku); const itemQty = item.expectedQty || item.quantity || item.pickedQty || 0; const itemSku = item.sku || product?.sku || 'N/A';
                                const itemUnit = getSellUnit(item.unit || product?.unit); const sizeNum = parseFloat(product?.size || '0'); const isWeightVol = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && sizeNum > 0;
                                const expectedMeasure = isWeightVol ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : (itemQty * sizeNum)) : itemQty;
                                const showReceived = item.receivedQty !== undefined && ['Received', 'Delivered', 'Completed'].some(s => s === selectedJob.transferStatus || s === selectedJob.status);
                                const hasDiscrepancy = showReceived && item.receivedQty !== expectedMeasure; const isDone = showReceived && !hasDiscrepancy;
                                return (
                                    <div key={idx} className={`group relative bg-gray-50 dark:bg-white/[0.02] border ${isDone ? 'border-green-500/20 bg-green-50/50 dark:bg-green-500/[0.01]' : 'border-gray-200 dark:border-white/5'} rounded-[2rem] p-5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300`}>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">{product?.image ? <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Box size={28} className="text-gray-300 dark:text-white/20" />} {isDone && <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center"><CheckCircle size={20} className="text-green-500" /></div>}{hasDiscrepancy && <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center"><XCircle size={20} className="text-red-500" /></div>}</div>
                                            <div><h4 className="text-gray-900 dark:text-white font-black tracking-tight mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors uppercase text-sm">{item.name || item.productName || product?.name || 'Unknown'}</h4><span className="text-[10px] font-mono font-black text-gray-500 bg-gray-200 dark:bg-black/40 px-2 py-0.5 rounded border border-gray-300 dark:border-white/5 uppercase tracking-tighter">{itemSku}</span></div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3 min-w-[170px]">
                                            <div className="flex items-center gap-8">
                                                <div className="text-right"><span className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.2em] block mb-1">Expected</span>{item.orderedQty && item.orderedQty > itemQty ? <div className="flex flex-col items-end"><span className="text-[10px] font-mono font-bold text-red-500 line-through opacity-70 mb-0.5">{item.orderedQty}</span><QtyDisplay qty={itemQty} measure={isWeightVol ? item.requestedMeasureQty || itemQty * sizeNum : null} unit={itemUnit} /></div> : <QtyDisplay qty={itemQty} measure={isWeightVol ? item.requestedMeasureQty || itemQty * sizeNum : null} unit={itemUnit} />}</div>
                                                {showReceived && <div className="text-right"><span className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1 ${hasDiscrepancy ? 'text-red-600/60' : 'text-green-600/60'}`}>Received</span><QtyDisplay qty={item.receivedQty} unit={itemUnit} isMeasure={isWeightVol} color={hasDiscrepancy ? 'red' : 'green'} /></div>}
                                            </div>
                                            {hasDiscrepancy && onResolveDiscrepancy && <button onClick={(e) => { e.stopPropagation(); onResolveDiscrepancy(selectedJob, item, idx); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex items-center gap-2"><AlertTriangle size={12} /> Resolve Discrepancy</button>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-7 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex items-center justify-between flex-wrap gap-6">
                    <div className="flex flex-col"><span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.3em] mb-1.5">Asset Routing</span>
                        <div className="flex items-center gap-3 text-sm font-black text-gray-700 dark:text-gray-300 italic group">
                            {(() => { const s = sites.find(x => x.id === selectedJob.sourceSiteId); return s ? <>{s.name} <span className="text-gray-400 dark:text-gray-600 font-mono text-[10px] ml-1">({s.code || s.id})</span></> : selectedJob.sourceSiteId; })()}
                            <ArrowRight size={16} className="text-cyan-500 animate-pulse-slow" /><div className="flex flex-col">
                            {(() => { const s = sites.find(x => x.id === selectedJob.destSiteId); return s ? <>{s.name} <span className="text-gray-400 dark:text-gray-600 font-mono text-[10px] ml-1">({s.code || s.id})</span></> : selectedJob.destSiteId; })()}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {transferStatus === 'Requested' && isManager && <button onClick={handleApprove} disabled={loading !== null} className="btn-primary bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20">{loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Approve</button>}
                        {['Requested', 'Picking'].includes(transferStatus) && isManager && <button onClick={handleReject} disabled={loading !== null} className="btn-secondary border-red-500/20 text-red-500 hover:bg-red-500/10">{loading === 'reject' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />} Reject</button>}
                        {(transferStatus === 'In-Transit' || transferStatus === 'Shipped') && selectedJob.destSiteId === activeSite?.id && <button onClick={() => { const lineItems = [/* items logic same as original */]; setActiveTransferJob(selectedJob); setTransferReceiveItems(selectedJob.lineItems || []); setTransferReceiveMode(true); setSelectedJob(null); }} className="btn-primary bg-green-600 hover:bg-green-500 shadow-green-500/20"><Package size={18} /> Receive</button>}
                        <button onClick={() => setSelectedJob(null)} className="px-7 py-3.5 rounded-2xl bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 font-black text-xs uppercase tracking-widest transition-all">Close</button>
                    </div>
                </div>
            </div>
            <style>{`.btn-primary { @apply px-8 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50; } .btn-secondary { @apply px-8 py-3.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50; }`}</style>
        </div>
    );
};

const DashboardStat = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-cyan-500/20 transition-all">
        <div><span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-1">{label}</span><span className="text-base font-black text-gray-900 dark:text-white tracking-tight">{value}</span></div>
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-500' : color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-400 dark:text-gray-600'}`}><Icon size={22} /></div>
    </div>
);

const QtyDisplay = ({ qty, measure, unit, isMeasure, color }: any) => {
    const textColor = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white';
    const val = measure !== null && measure !== undefined ? measure : qty;
    const label = (isMeasure || measure !== null) ? unit.shortLabel : (unit.code !== 'UNIT' ? unit.shortLabel : (qty === 1 ? 'Unit' : 'Units'));
    return <span className={`text-lg font-mono font-black ${textColor}`}>{val.toLocaleString()} <span className="text-[10px] opacity-60 font-black tracking-tighter uppercase">{label}</span></span>;
};
