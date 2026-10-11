import React, { useState } from 'react';
import { X, Package, Box, CheckCircle, XCircle, Trash2, Truck, Clock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, User, Site, ReceivingItem } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit, getEffectivePackageSize } from '../../../utils/units';
import { supabase } from '../../../lib/supabase';
import { productsService } from '../../../services/products.service';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';

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
    const { t } = useLanguage();
    const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null);

    if (!selectedJob || !isDetailsOpen || ['PICK', 'PACK', 'DISPATCH'].includes(selectedJob.type)) return null;

    const isManager = MANAGER_ROLES.includes(user?.role || '');
    const transferStatus = selectedJob.transferStatus || 'Requested';

    const handleApprove = async () => {
        setLoading('approve');
        try {
            const sourceSiteId = selectedJob.sourceSiteId || selectedJob.siteId;
            if (!sourceSiteId) throw new Error('Missing source');
            const lineItems = selectedJob.lineItems || (selectedJob as any).line_items || [];
            if (lineItems.length === 0) throw new Error('No items');
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
                orderRef: selectedJob.id,
                createdBy: user,
                createdAt: new Date().toISOString(),
                jobNumber: selectedJob.jobNumber
            };
            await wmsJobsService.create(pickJob);
            await wmsJobsService.update(selectedJob.id, { transferStatus: 'Picking', approvedBy: user?.name } as any);
            addNotification('success', 'Transfer approved');
            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            addNotification('alert', e.message);
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        setLoading('reject');
        try {
            await wmsJobsService.update(selectedJob.id, { transferStatus: 'Rejected', approvedBy: user?.name } as any);
            addNotification('success', 'Rejected');
            await refreshData();
            setSelectedJob(null);
        } catch (e: any) {
            addNotification('alert', e.message);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this transfer manifest?')) return;
        setLoading('delete');
        try {
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

            const { error: deleteChildrenError } = await supabase
                .from('wms_jobs')
                .delete()
                .or(`order_ref.eq.${selectedJob.id},order_ref.eq.${selectedJob.jobNumber}`);

            if (deleteChildrenError) {
                logger.error('TransferJobDetails', 'Failed to delete child jobs:', deleteChildrenError);
            }

            await wmsJobsService.delete(selectedJob.id);
            addNotification('success', 'Manifest deleted successfully');

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

    const resolvedLineItems = (selectedJob.lineItems && selectedJob.lineItems.length > 0)
        ? selectedJob.lineItems
        : Array.isArray((selectedJob as any).items)
            ? (selectedJob as any).items.map((it: any) => ({
                productId: it.productId || it.product_id || it.id,
                sku: it.sku || it.barcode || '',
                name: it.name || it.productName || it.product_name || 'Item',
                expectedQty: it.quantity ?? it.qty ?? it.expectedQty ?? 0,
                deliveredQty: it.deliveredQty ?? it.quantity ?? 0,
                receivedQty: it.receivedQty,
                unit: it.unit,
                size: it.size,
                status: it.status || 'Pending'
            }))
            : Array.isArray((selectedJob as any).line_items)
                ? (selectedJob as any).line_items
                : [];

    const totalItems = resolvedLineItems.length || selectedJob.items || 0;

    const getLocalizedStatus = (status: string) => {
        switch (status) {
            case 'Requested': return t('warehouse.requested');
            case 'Approved': return t('warehouse.putaway.confirmLocation');
            case 'Picking': return t('warehouse.picking');
            case 'Picked': return t('warehouse.picking') + ' (OK)';
            case 'Packed': return t('warehouse.packed');
            case 'Shipped': return t('warehouse.inTransitLabel').split(' ')[0];
            case 'In-Transit': return t('warehouse.inTransitLabel');
            case 'Delivered': return t('warehouse.delivered');
            case 'Received': return t('warehouse.received');
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10">
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                                <Truck size={20} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate">
                                        {t('warehouse.transferDetails')}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-accent)] uppercase">
                                        #{formatJobId(selectedJob)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                    <span className="flex items-center gap-1.5 text-[var(--theme-text-primary)] font-semibold">
                                        <span className={`w-2 h-2 rounded-full ${transferStatus === 'Received' ? 'bg-green-500' : 'bg-amber-400'}`} />
                                        {getLocalizedStatus(transferStatus)}
                                    </span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                                        selectedJob.priority === 'Critical'
                                            ? 'border-red-500/20 text-red-500 bg-red-500/10'
                                            : selectedJob.priority === 'High'
                                                ? 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                                : 'border-[var(--theme-border)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]'
                                    }`}>
                                        {selectedJob.priority || 'Normal'}
                                    </span>
                                    <span>•</span>
                                    <span>Req: <strong className="text-[var(--theme-text-primary)]">{selectedJob.requestedBy || 'System'}</strong></span>
                                    {selectedJob.approvedBy && (
                                        <>
                                            <span>•</span>
                                            <span>Appr: <strong className="text-[var(--theme-text-primary)]">{selectedJob.approvedBy}</strong></span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-1 font-mono tabular-nums">
                                        <Clock size={12} className="text-[var(--theme-text-secondary)]" />
                                        {new Date(selectedJob.createdAt || (selectedJob as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedJob(null)}
                            aria-label={t('warehouse.dismiss')}
                            className="p-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3 custom-scrollbar z-10">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                        <h3 className="font-semibold text-[var(--theme-accent)] flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Package size={14} /> {t('warehouse.transferRequest')}
                        </h3>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2.5 py-0.5 rounded-lg border border-[var(--theme-border)] uppercase">
                            {totalItems} {t('warehouse.itemPlural')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {resolvedLineItems.map((item: any, idx: number) => {
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
                                <div
                                    key={idx}
                                    className={`bg-[var(--theme-bg-card)] border ${isDone ? 'border-green-500/30' : 'border-[var(--theme-border)]'} rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-10 h-10 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                            {product?.image ? (
                                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Box size={18} className="text-[var(--theme-text-secondary)]/50" />
                                            )}
                                            {isDone && (
                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                                </div>
                                            )}
                                            {hasDiscrepancy && (
                                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                    <XCircle size={16} className="text-red-600 dark:text-red-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[var(--theme-text-primary)] font-semibold tracking-tight truncate uppercase text-xs leading-snug">
                                                {item.name || item.productName || product?.name || 'Unknown'}
                                            </h4>
                                            <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-1.5 py-0.5 rounded border border-[var(--theme-border)] uppercase">
                                                {itemSku}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                        <div className="text-right">
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider block">
                                                {t('warehouse.expected')}
                                            </span>
                                            <QtyDisplay qty={itemQty} size={product?.size || item.size} unit={itemUnit} t={t} />
                                        </div>

                                        {showReceived && (
                                            <div className="text-right">
                                                <span className={`text-[11px] font-medium uppercase tracking-wider block ${hasDiscrepancy ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                                    {t('warehouse.received')}
                                                </span>
                                                <QtyDisplay qty={item.receivedQty} size={product?.size || item.size} unit={itemUnit} color={hasDiscrepancy ? 'red' : 'green'} t={t} />
                                            </div>
                                        )}

                                        {hasDiscrepancy && onResolveDiscrepancy && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onResolveDiscrepancy(selectedJob, item, idx); }}
                                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[11px] uppercase font-semibold tracking-wider rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                                            >
                                                <AlertTriangle size={12} />
                                                <span>Resolve</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--theme-text-secondary)]">
                        <span className="text-[11px] text-[var(--theme-accent)] font-semibold uppercase tracking-wider">Route:</span>
                        {(() => {
                            const srcSite = sites.find(x => x.id === selectedJob.sourceSiteId);
                            const destSite = sites.find(x => x.id === selectedJob.destSiteId);
                            return (
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium text-[11px]">
                                        {srcSite?.name || selectedJob.sourceSiteId}
                                    </span>
                                    <ArrowRight size={12} className="text-[var(--theme-accent)] shrink-0" />
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium text-[11px]">
                                        {destSite?.name || selectedJob.destSiteId}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {['Requested', 'Draft'].includes(transferStatus) && isManager && (
                            <button
                                onClick={handleApprove}
                                disabled={loading !== null}
                                className="px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider bg-green-600 hover:bg-green-700 text-white shadow-sm transition-opacity flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                            >
                                {loading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                <span>Approve</span>
                            </button>
                        )}
                        {['Requested', 'Draft', 'Picking'].includes(transferStatus) && isManager && (
                            <button
                                onClick={handleReject}
                                disabled={loading !== null}
                                className="px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-colors flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                            >
                                {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                <span>Reject</span>
                            </button>
                        )}
                        {['Requested', 'Draft', 'Approved', 'Picking', 'Rejected'].includes(transferStatus) && isManager && (
                            <button
                                onClick={handleDelete}
                                disabled={loading !== null}
                                className="px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[var(--theme-bg-subtle)] hover:bg-red-500 hover:text-white border border-[var(--theme-border)] text-[var(--theme-text-secondary)] transition-colors flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                            >
                                {loading === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                <span>Delete Manifest</span>
                            </button>
                        )}
                        {['In-Transit', 'Shipped', 'Delivered', 'Partially Delivered'].includes(transferStatus) && (selectedJob.destSiteId === activeSite?.id || ['super_admin', 'admin', 'warehouse_manager', 'inventory_specialist', 'stock_clerk', 'receiver', 'store_manager'].includes(user?.role || '')) && (
                            <button
                                onClick={() => {
                                    const itemsToReceive: ReceivingItem[] = resolvedLineItems.map((item: any) => ({
                                        id: item.id,
                                        productId: item.productId || item.product_id || item.id,
                                        productName: item.name || item.productName || item.product_name,
                                        expectedQty: item.expectedQty ?? item.quantity ?? 0,
                                        receivedQty: item.deliveredQty !== undefined ? item.deliveredQty : (item.receivedQty !== undefined ? item.receivedQty : (item.expectedQty ?? item.quantity ?? 0)),
                                        condition: (item.condition as any) || 'Good'
                                    }));
                                    setActiveTransferJob(selectedJob);
                                    setTransferReceiveItems(itemsToReceive);
                                    setTransferReceiveMode(true);
                                    setSelectedJob(null);
                                }}
                                className="px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[var(--theme-accent)] hover:opacity-90 text-white shadow-sm transition-opacity flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                            >
                                <Package size={14} />
                                <span>{t('warehouse.received')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedJob(null)}
                            className="px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] transition-colors min-h-[44px]"
                        >
                            {t('warehouse.dismiss')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QtyDisplay = ({ qty, size, unit, color, t }: any) => {
    const textColor = color === 'red' ? 'text-red-600 dark:text-red-400' : color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-[var(--theme-text-primary)]';
    const isWeightVol = unit && (unit.category === 'weight' || unit.category === 'volume');

    let unitLabel = unit?.code !== 'UNIT' ? unit?.shortLabel : (qty === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural'));
    if (isWeightVol && size) {
        unitLabel = `packs (${size}${unit.shortLabel})`;
    } else if (isWeightVol) {
        unitLabel = `packs (${unit.shortLabel})`;
    }

    return (
        <span className={`text-sm font-mono tabular-nums font-bold ${textColor}`}>
            {qty.toLocaleString()} <span className="text-[11px] opacity-75 font-normal uppercase">{unitLabel}</span>
        </span>
    );
};

export default TransferJobDetails;
