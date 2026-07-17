import React, { useState } from 'react';
import { X, Package, Box, CheckCircle, XCircle, Trash2, Truck, Clock, Info, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, User, Site, ReceivingItem } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit, getEffectivePackageSize } from '../../../utils/units';
import { supabase } from '../../../lib/supabase';
import { productsService } from '../../../services/products.service';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';

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
    const { t } = useLanguage();
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
        try {
            // Check if picking is already completed
            const { data: childPickJobs, error: checkError } = await supabase
                .from('wms_jobs')
                .select('status')
                .eq('type', 'PICK')
                .or(`order_ref.eq.${selectedJob.id},order_ref.eq.${selectedJob.jobNumber}`);

            if (checkError) {
                logger.error('TransferJobDetails', 'Failed to check child pick jobs:', checkError);
            }

            const isPickCompleted = childPickJobs?.some((j: any) => j.status === 'Completed');
            if (isPickCompleted) {
                addNotification('alert', 'Cannot delete manifest: picking has already been completed.');
                setLoading(null);
                return;
            }

            // Delete all child jobs (PICK, PACK, DISPATCH)
            const { error: deleteChildrenError } = await supabase
                .from('wms_jobs')
                .delete()
                .or(`order_ref.eq.${selectedJob.id},order_ref.eq.${selectedJob.jobNumber}`);

            if (deleteChildrenError) {
                logger.error('TransferJobDetails', 'Failed to delete child jobs:', deleteChildrenError);
            }

            // Delete the main transfer job
            await wmsJobsService.delete(selectedJob.id);
            addNotification('success', 'Manifest deleted successfully');

            // Trigger smart replenishment check again for each product in the deleted manifest
            const lineItems = selectedJob.lineItems || (selectedJob as any).line_items || [];
            for (const item of lineItems) {
                const product = products.find(p => p.id === item.productId || p.sku === item.sku);
                if (product) {
                    productsService.handleAutoReplenish(product).catch(err => {
                        logger.error('TransferJobDetails', 'Failed to restart auto-replenish for', product.sku, err);
                    });
                }
            }

            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            addNotification('alert', 'Failed to delete manifest');
            logger.error('TransferJobDetails', e, new Error(String(e)));
        } finally {
            setLoading(null);
        }
    };

    const totalItems = selectedJob.lineItems?.length || selectedJob.items || 0;

    const getLocalizedStatus = (status: string) => {
        switch (status) {
            case 'Requested': return t('warehouse.requested');
            case 'Approved': return t('warehouse.putaway.confirmLocation');
            case 'Picking': return t('warehouse.picking');
            case 'Picked': return t('warehouse.picking') + ' (OK)';
            case 'Packed': return t('warehouse.packed');
            case 'Shipped': return t('warehouse.inTransitLabel').split(' ')[0] + ' ⚓';
            case 'In-Transit': return t('warehouse.inTransitLabel');
            case 'Delivered': return t('warehouse.delivered');
            case 'Received': return t('warehouse.received');
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#FAF8F5]/95 dark:bg-[#1C2620]/95 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-[#E2DCCE] dark:border-emerald-950/20 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative">
                {/* Visual Flair Glow Blobs */}
                <div className="hidden md:block absolute -top-32 -right-32 w-96 h-96 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-32 -left-32 w-96 h-96 bg-[#A9CBA2]/10 dark:bg-[#A9CBA2]/25 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="relative p-7 border-b border-[#E2DCCE]/60 dark:border-[#2C5E3B]/10 bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 backdrop-blur-md overflow-hidden shrink-0 z-10">
                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] shadow-inner">
                                <Truck size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-4 mb-1.5">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('warehouse.transferDetails')}</h2>
                                    <span className="px-2.5 py-1 rounded-xl bg-stone-200/50 dark:bg-white/5 border border-stone-300/30 dark:border-white/10 text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider">#{formatJobId(selectedJob)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                                        <span className={`w-2 h-2 rounded-full ${transferStatus === 'Received' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.4)]'}`} />
                                        {getLocalizedStatus(transferStatus)}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-700">|</span>
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${selectedJob.priority === 'Critical' ? 'border-red-500/30 text-red-500 bg-red-500/10' : selectedJob.priority === 'High' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-stone-200 dark:border-white/5 text-gray-500 dark:text-gray-400'}`}>
                                        {selectedJob.priority || 'Normal'} Priority
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono ml-auto"><Clock size={12} className="text-gray-400" />{new Date(selectedJob.createdAt || (selectedJob as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedJob(null)} aria-label={t('warehouse.dismiss')} className="p-3 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 rounded-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-transparent z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardStat label={t('warehouse.requested')} value={selectedJob.requestedBy || 'System'} icon={Info} />
                        {selectedJob.approvedBy && <DashboardStat label={transferStatus === 'Rejected' ? 'Rejected By' : 'Approved By'} value={selectedJob.approvedBy} icon={transferStatus === 'Rejected' ? XCircle : CheckCircle} color={transferStatus === 'Rejected' ? 'red' : 'green'} />}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-3 text-xs uppercase tracking-[0.3em]"><Package size={16} /> {t('warehouse.transferRequest')}</h3>
                            <span className="text-[10px] font-black text-gray-500 bg-stone-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/5 uppercase tracking-widest">{totalItems} {t('warehouse.itemPlural')}</span>
                                                </div>
                        <div className="space-y-4">
                            {selectedJob.lineItems?.map((item: any, idx: number) => {
                                const product = products.find(p => p.id === item.productId || p.sku === item.sku); const itemQty = item.expectedQty || item.quantity || item.pickedQty || 0; const itemSku = item.sku || product?.sku || 'N/A';
                                const itemUnit = getSellUnit(item.unit || product?.unit); const sizeNum = getEffectivePackageSize(item.unit || product?.unit, product?.size || item.size); const isWeightVol = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && sizeNum > 0;
                                const expectedMeasure = isWeightVol ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : (itemQty * sizeNum)) : itemQty;
                                const showReceived = item.receivedQty !== undefined && ['Received', 'Delivered', 'Completed'].some(s => s === selectedJob.transferStatus || s === selectedJob.status);
                                const hasDiscrepancy = showReceived && item.receivedQty !== expectedMeasure; const isDone = showReceived && !hasDiscrepancy;
                                return (
                                    <div key={idx} className={`group relative bg-stone-50 dark:bg-white/5 border ${isDone ? 'border-green-500/25 bg-green-500/[0.04]' : 'border-stone-200 dark:border-white/5'} rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2C5E3B]/20 dark:hover:border-[#2C5E3B]/30 hover:scale-[1.005] transition-all duration-300 shadow-sm`}>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                {product?.image ? <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Box size={28} className="text-gray-300 dark:text-white/20" />}
                                                {isDone && <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center"><CheckCircle size={20} className="text-green-500" /></div>}
                                                {hasDiscrepancy && <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center"><XCircle size={20} className="text-red-500" /></div>}
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 dark:text-white font-black tracking-tight mb-1 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase text-sm">{item.name || item.productName || product?.name || 'Unknown'}</h4>
                                                <span className="text-[10px] font-mono font-black text-gray-500 dark:text-gray-400 bg-stone-200/50 dark:bg-black/40 px-2 py-0.5 rounded border border-stone-300/30 dark:border-white/5 uppercase tracking-tighter">{itemSku}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-4 w-full sm:w-auto shrink-0">
                                            <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto border-t border-stone-200/40 dark:border-white/5 pt-4 sm:pt-0 sm:border-t-0">
                                                <div className="text-left sm:text-right">
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.2em] block mb-1">{t('warehouse.expected')}</span>
                                                    {item.orderedQty && item.orderedQty > itemQty ? (
                                                        <div className="flex flex-col sm:items-end">
                                                            <span className="text-[10px] font-mono font-bold text-red-500 line-through opacity-70 mb-0.5">{item.orderedQty}</span>
                                                            <QtyDisplay qty={itemQty} measure={isWeightVol ? item.requestedMeasureQty || itemQty * sizeNum : null} unit={itemUnit} t={t} />
                                                        </div>
                                                    ) : (
                                                        <QtyDisplay qty={itemQty} measure={isWeightVol ? item.requestedMeasureQty || itemQty * sizeNum : null} unit={itemUnit} t={t} />
                                                    )}
                                                </div>
                                                {showReceived && (
                                                    <div className="text-right">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1 ${hasDiscrepancy ? 'text-red-600/60 dark:text-red-400/60' : 'text-green-600/60'}`}>{t('warehouse.received')}</span>
                                                        <QtyDisplay qty={item.receivedQty} unit={itemUnit} isMeasure={isWeightVol} color={hasDiscrepancy ? 'red' : 'green'} t={t} />
                                                    </div>
                                                )}
                                            </div>
                                            {hasDiscrepancy && onResolveDiscrepancy && (
                                                <button onClick={(e) => { e.stopPropagation(); onResolveDiscrepancy(selectedJob, item, idx); }} className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                                                    <AlertTriangle size={12} /> Resolve Discrepancy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-[#E2DCCE]/60 dark:border-[#2C5E3B]/10 bg-[#FAF8F5]/50 dark:bg-[#1C2620]/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-10">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-[0.3em]">Asset Routing</span>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-800 dark:text-gray-200">
                            {(() => {
                                const s = sites.find(x => x.id === selectedJob.sourceSiteId);
                                return s ? (
                                    <span className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-gray-900 dark:text-gray-200 font-bold text-[11px] shadow-sm flex items-center gap-2">
                                        {s.name}
                                        <span className="px-1.5 py-0.5 rounded bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-[9px] font-black tracking-wider uppercase shrink-0">
                                            {s.code || s.id}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 font-mono text-[10px]">{selectedJob.sourceSiteId}</span>
                                );
                            })()}
                            <ArrowRight size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 animate-pulse" />
                            {(() => {
                                const s = sites.find(x => x.id === selectedJob.destSiteId);
                                return s ? (
                                    <span className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-gray-900 dark:text-gray-200 font-bold text-[11px] shadow-sm flex items-center gap-2">
                                        {s.name}
                                        <span className="px-1.5 py-0.5 rounded bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-[9px] font-black tracking-wider uppercase shrink-0">
                                            {s.code || s.id}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 font-mono text-[10px]">{selectedJob.destSiteId}</span>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {['Requested', 'Draft'].includes(transferStatus) && isManager && (
                            <button onClick={handleApprove} disabled={loading !== null} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50 shadow-sm bg-[#2C5E3B] hover:bg-[#20452B] dark:bg-[#EAE5D9] dark:hover:bg-[#D8D2C4] text-white dark:text-[#1C2620]">
                                {loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Approve
                            </button>
                        )}
                        {['Requested', 'Draft', 'Picking'].includes(transferStatus) && isManager && (
                            <button onClick={handleReject} disabled={loading !== null} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-500/20">
                                {loading === 'reject' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />} Reject
                            </button>
                        )}
                        {['Requested', 'Draft', 'Approved', 'Picking', 'Rejected'].includes(transferStatus) && isManager && (
                            <button onClick={handleDelete} disabled={loading !== null} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-500/20">
                                {loading === 'delete' ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} Delete Manifest
                            </button>
                        )}
                        {(transferStatus === 'In-Transit' || transferStatus === 'Shipped') && (selectedJob.destSiteId === activeSite?.id || ['super_admin', 'admin', 'warehouse_manager'].includes(user?.role || '')) && (
                            <button onClick={() => { setActiveTransferJob(selectedJob); setTransferReceiveItems(selectedJob.lineItems || []); setTransferReceiveMode(true); setSelectedJob(null); }} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50 shadow-sm bg-[#2C5E3B] hover:bg-[#20452B] dark:bg-[#EAE5D9] dark:hover:bg-[#D8D2C4] text-white dark:text-[#1C2620]">
                                <Package size={18} /> {t('warehouse.received')}
                            </button>
                        )}
                        <button onClick={() => setSelectedJob(null)} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50 border border-[#E2DCCE] dark:border-white/10 bg-stone-50 hover:bg-stone-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300">
                            {t('warehouse.dismiss')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardStat = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white/80 dark:bg-white/[0.02] border border-[#E2DCCE] dark:border-emerald-950/20 p-5 rounded-[2rem] flex items-center justify-between group hover:border-[#2C5E3B]/20 dark:hover:border-[#2C5E3B]/40 transition-all shadow-sm">
        <div><span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-1">{label}</span><span className="text-base font-black text-gray-900 dark:text-white tracking-tight">{value}</span></div>
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${color === 'red' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-600' : color === 'green' ? 'bg-green-50 dark:bg-[#1C2620]/30 border-green-200 dark:border-green-800/30 text-green-600 dark:text-[#A9CBA2]' : 'bg-[#FAF8F5] dark:bg-[#1C2620]/30 border-[#E2DCCE]/60 dark:border-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'}`}><Icon size={22} /></div>
    </div>
);

const QtyDisplay = ({ qty, measure, unit, isMeasure, color, t }: any) => {
    const textColor = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white';
    const val = measure !== null && measure !== undefined ? measure : qty;
    const label = (isMeasure || measure !== null) ? unit.shortLabel : (unit.code !== 'UNIT' ? unit.shortLabel : (qty === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')));
    return <span className={`text-lg font-mono font-black ${textColor}`}>{val.toLocaleString()} <span className="text-[10px] opacity-60 font-black tracking-tighter uppercase">{label}</span></span>;
};
