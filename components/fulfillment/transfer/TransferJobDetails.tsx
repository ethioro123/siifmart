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
                <div className="relative px-6 py-4 border-b border-[#E2DCCE]/60 dark:border-[#2C5E3B]/10 bg-[#FAF8F5]/50 dark:bg-[#1C2620]/50 backdrop-blur-md shrink-0 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0">
                                <Truck size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('warehouse.transferDetails')}</h2>
                                    <span className="px-2 py-0.5 rounded-lg bg-stone-200/60 dark:bg-white/10 border border-stone-300/30 dark:border-white/10 text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider">#{formatJobId(selectedJob)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                    <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                                        <span className={`w-2 h-2 rounded-full ${transferStatus === 'Received' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.4)]'}`} />
                                        {getLocalizedStatus(transferStatus)}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-black ${selectedJob.priority === 'Critical' ? 'border-red-500/30 text-red-500 bg-red-500/10' : selectedJob.priority === 'High' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-stone-200 dark:border-white/5 text-gray-500 dark:text-gray-400'}`}>
                                        {selectedJob.priority || 'Normal'}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span>Req: <strong className="text-gray-800 dark:text-gray-200">{selectedJob.requestedBy || 'System'}</strong></span>
                                    {selectedJob.approvedBy && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-700">•</span>
                                            <span>Appr: <strong className="text-gray-800 dark:text-gray-200">{selectedJob.approvedBy}</strong></span>
                                        </>
                                    )}
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span className="flex items-center gap-1 font-mono text-[9px]"><Clock size={11} className="text-gray-400" />{new Date(selectedJob.createdAt || (selectedJob as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedJob(null)} aria-label={t('warehouse.dismiss')} className="p-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar bg-transparent z-10">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-200/50 dark:border-white/5">
                        <h3 className="font-black text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-2 text-xs uppercase tracking-[0.2em]"><Package size={14} /> {t('warehouse.transferRequest')}</h3>
                        <span className="text-[10px] font-black text-gray-500 bg-stone-100 dark:bg-white/5 px-2.5 py-0.5 rounded-lg border border-stone-200 dark:border-white/5 uppercase tracking-wider">{totalItems} {t('warehouse.itemPlural')}</span>
                    </div>

                    <div className="space-y-2">
                        {selectedJob.lineItems?.map((item: any, idx: number) => {
                            const product = products.find(p => p.id === item.productId || p.sku === item.sku);
                            const itemQty = item.expectedQty || item.quantity || item.pickedQty || 0;
                            const itemSku = item.sku || product?.sku || 'N/A';
                            const itemUnit = getSellUnit(item.unit || product?.unit);
                            const sizeNum = getEffectivePackageSize(item.unit || product?.unit, product?.size || item.size);
                            const isWeightVol = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && sizeNum > 0;
                            const expectedMeasure = isWeightVol ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : (itemQty * sizeNum)) : itemQty;
                            const showReceived = item.receivedQty !== undefined && ['Received', 'Delivered', 'Completed'].some(s => s === selectedJob.transferStatus || s === selectedJob.status);
                            const hasDiscrepancy = showReceived && item.receivedQty !== expectedMeasure;
                            const isDone = showReceived && !hasDiscrepancy;

                            return (
                                <div key={idx} className={`group relative bg-stone-50 dark:bg-white/5 border ${isDone ? 'border-green-500/25 bg-green-500/[0.03]' : 'border-stone-200 dark:border-white/5'} rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 hover:border-[#2C5E3B]/30 transition-all shadow-sm`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-10 h-10 rounded-lg bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            {product?.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Box size={18} className="text-gray-300 dark:text-white/20" />}
                                            {isDone && <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center"><CheckCircle size={16} className="text-green-500" /></div>}
                                            {hasDiscrepancy && <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center"><XCircle size={16} className="text-red-500" /></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-gray-900 dark:text-white font-bold tracking-tight truncate uppercase text-xs leading-snug">{item.name || item.productName || product?.name || 'Unknown'}</h4>
                                            <span className="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-stone-200/50 dark:bg-black/30 px-1.5 py-0.2 rounded border border-stone-300/30 dark:border-white/5 uppercase tracking-tighter">{itemSku}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-right">
                                            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest block">{t('warehouse.expected')}</span>
                                            <QtyDisplay qty={itemQty} size={product?.size || item.size} unit={itemUnit} t={t} />
                                        </div>

                                        {showReceived && (
                                            <div className="text-right">
                                                <span className={`text-[8px] font-extrabold uppercase tracking-widest block ${hasDiscrepancy ? 'text-red-500' : 'text-green-600'}`}>{t('warehouse.received')}</span>
                                                <QtyDisplay qty={item.receivedQty} size={product?.size || item.size} unit={itemUnit} color={hasDiscrepancy ? 'red' : 'green'} t={t} />
                                            </div>
                                        )}

                                        {hasDiscrepancy && onResolveDiscrepancy && (
                                            <button onClick={(e) => { e.stopPropagation(); onResolveDiscrepancy(selectedJob, item, idx); }} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[9px] uppercase font-bold tracking-wider rounded-lg transition-all flex items-center gap-1">
                                                <AlertTriangle size={10} /> Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-[#E2DCCE]/60 dark:border-white/5 bg-[#FAF8F5]/90 dark:bg-[#1C2620]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0 z-10">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                        <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">Route:</span>
                        {(() => {
                            const srcSite = sites.find(x => x.id === selectedJob.sourceSiteId);
                            const destSite = sites.find(x => x.id === selectedJob.destSiteId);
                            return (
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-stone-200/50 dark:bg-white/5 border border-stone-300/30 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold text-[10px]">
                                        {srcSite?.name || selectedJob.sourceSiteId}
                                    </span>
                                    <ArrowRight size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                    <span className="px-2 py-0.5 rounded-md bg-stone-200/50 dark:bg-white/5 border border-stone-300/30 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold text-[10px]">
                                        {destSite?.name || selectedJob.destSiteId}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {['Requested', 'Draft'].includes(transferStatus) && isManager && (
                            <button onClick={handleApprove} disabled={loading !== null} className="px-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50">
                                {loading === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                            </button>
                        )}
                        {['Requested', 'Draft', 'Picking'].includes(transferStatus) && isManager && (
                            <button onClick={handleReject} disabled={loading !== null} className="px-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50">
                                {loading === 'reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                            </button>
                        )}
                        {['Requested', 'Draft', 'Approved', 'Picking', 'Rejected'].includes(transferStatus) && isManager && (
                            <button onClick={handleDelete} disabled={loading !== null} className="px-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-stone-200/40 hover:bg-red-500 hover:text-white dark:bg-white/5 border border-stone-300/30 dark:border-white/10 text-gray-600 dark:text-gray-400 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50">
                                {loading === 'delete' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete Manifest
                            </button>
                        )}
                        {(transferStatus === 'In-Transit' || transferStatus === 'Shipped') && (selectedJob.destSiteId === activeSite?.id || ['super_admin', 'admin', 'warehouse_manager'].includes(user?.role || '')) && (
                            <button onClick={() => { setActiveTransferJob(selectedJob); setTransferReceiveItems(selectedJob.lineItems || []); setTransferReceiveMode(true); setSelectedJob(null); }} className="px-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-[#2C5E3B] hover:bg-[#20452B] dark:bg-[#EAE5D9] dark:hover:bg-[#D8D2C4] text-white dark:text-[#1C2620] shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50">
                                <Package size={12} /> {t('warehouse.received')}
                            </button>
                        )}
                        <button onClick={() => setSelectedJob(null)} className="px-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider border border-stone-200 dark:border-white/10 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all">
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

const QtyDisplay = ({ qty, size, unit, color, t }: any) => {
    const textColor = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-[#A9CBA2]';
    const isWeightVol = unit && (unit.category === 'weight' || unit.category === 'volume');

    let unitLabel = unit?.code !== 'UNIT' ? unit?.shortLabel : (qty === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural'));
    if (isWeightVol && size) {
        unitLabel = `packs (${size}${unit.shortLabel})`;
    } else if (isWeightVol) {
        unitLabel = `packs (${unit.shortLabel})`;
    }

    return (
        <span className={`text-base font-mono font-black ${textColor}`}>
            {qty.toLocaleString()} <span className="text-[10px] opacity-75 font-bold uppercase">{unitLabel}</span>
        </span>
    );
};
