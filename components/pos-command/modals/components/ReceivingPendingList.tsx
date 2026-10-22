import React, { useState } from 'react';
import { Scan, MapPin, Clock, ChevronDown, ChevronUp, Truck, ChevronRight } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useData } from '../../../../contexts/DataContext';
import { useStore } from '../../../../contexts/CentralStore';
import { useFulfillmentData } from '../../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatDateTime } from '../../../../utils/formatting';
import { formatJobId } from '../../../../utils/jobIdFormatter';

export const ReceivingPendingList: React.FC = () => {
    const { t } = useLanguage();
    const { activeSite, sites } = useData();
    const { user } = useStore();
    const { jobs, transfers } = useFulfillmentData();
    
    const {
        orderRefScanInput,
        setOrderRefScanInput,
        handleScanOrderRef,
        handleSelectTransferForReceiving
    } = usePOSCommand();

    const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null);

    const wmsTransferJobs = React.useMemo(() => {
        return jobs
            .filter(j => j.type === 'TRANSFER' || j.type === 'DISPATCH')
            .filter(j => {
                // Ignore duplicates
                if (j.type === 'TRANSFER') return true;
                return !jobs.some(p => p.type === 'TRANSFER' && (p.id === j.orderRef || p.jobNumber === j.orderRef));
            })
            .map(j => ({
                id: j.id,
                type: j.type,
                sourceSiteId: (j as any).sourceSiteId || (j as any).source_site_id || j.siteId,
                destSiteId: (j as any).destSiteId || (j as any).dest_site_id,
                status: j.status,
                transferStatus: (j as any).transferStatus || j.status,
                items: j.lineItems || (j as any).line_items || [],
                orderRef: j.orderRef,
                jobNumber: j.jobNumber,
                createdAt: j.createdAt,
                assignedTo: j.assignedTo
            }));
    }, [jobs]);

    const pendingItems = React.useMemo(() => {
        const allTransferSources = [
            ...(transfers || []),
            ...wmsTransferJobs.filter(wj =>
                !(transfers || []).some(t => t.id === wj.id)
            )
        ];

        return allTransferSources.filter(t => {
            if (String(t.destSiteId) !== String(activeSite?.id)) return false;
            
            const transferStatus = String((t as any).transferStatus || '').toLowerCase().replace(/[-_]/g, '');
            const jobStatus = String((t as any).status || '').toLowerCase().replace(/[-_]/g, '');

            // Exclude already received or completed transfers
            if (['received', 'completed'].includes(transferStatus)) return false;

            // Exclude rejected, cancelled, draft, or unapproved transfers
            if (['rejected', 'cancelled', 'draft'].includes(transferStatus)) return false;
            if (['cancelled', 'rejected', 'completed'].includes(jobStatus)) return false;

            // Only shipments that are ready or in-transit/delivered should appear in store receiving
            return (
                ['intransit', 'dispatched', 'delivered', 'partiallydelivered', 'shipped'].includes(transferStatus) ||
                (jobStatus === 'pending' && ['intransit', 'dispatched', 'shipped', 'delivered'].includes(transferStatus)) ||
                ['staged', 'delivered'].includes(jobStatus)
            );
        }).sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
    }, [transfers, wmsTransferJobs, activeSite]);

    return (
        <>
            {/* Order Ref Scanner */}
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 mb-2">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Scan size={13} />
                        </div>
                        {t('posCommand.quickScanHandover')}
                    </label>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] italic">{t('posCommand.scanPackingLabel')}</span>
                </div>
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={orderRefScanInput}
                        onPaste={(e) => e.preventDefault()}
                        onChange={(e) => setOrderRefScanInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleScanOrderRef(orderRefScanInput);
                        }}
                        placeholder={t('posCommand.scanBarcodePlaceholder')}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-2xl px-4 py-3 pr-24 text-[var(--theme-text-primary)] font-mono text-xs outline-none transition-all placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-border-focus)] shadow-2xs"
                    />
                    <button
                        onClick={() => handleScanOrderRef(orderRefScanInput)}
                        className="absolute right-2 px-4 py-1.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-semibold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                        {t('common.verify') || 'Verify'}
                    </button>
                </div>
            </div>

            {/* Inbound Shipment List */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-1">{t('posCommand.inboundShipments')}</h3>
                
                {pendingItems.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <Truck size={40} className="mx-auto mb-4 opacity-30 text-[var(--theme-text-secondary)]" />
                        <p className="text-sm font-bold text-[var(--theme-text-primary)]">{t('posCommand.noInboundTransfers')}</p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{t('posCommand.inboundAppear')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingItems.map((item) => {
                            const isExpanded = expandedTransferId === item.id;
                            const sourceSite = sites.find(s => String(s.id) === String(item.sourceSiteId));
                            const originName = sourceSite ? sourceSite.name : `Site #${item.sourceSiteId}`;
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`bg-[var(--theme-bg-card)] border rounded-2xl overflow-hidden transition-all duration-150 isolate ${
                                        isExpanded
                                            ? 'border-[var(--theme-border-focus)] ring-2 ring-[var(--theme-primary)]/10'
                                            : 'border-[var(--theme-border)] hover:border-[var(--theme-border-strong)]'
                                    }`}
                                >
                                    {/* Main Header summary clickable row */}
                                    <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)] uppercase tracking-tight">
                                                    {formatJobId({ ...item, type: 'TRANSFER' } as any)}
                                                </span>
                                                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                                    {(() => {
                                                        const stat = ((item as any).transferStatus || item.status || '').toLowerCase();
                                                        return stat === 'in_transit' || stat === 'dispatched' ? t('posCommand.inTransit') : t('posCommand.pending');
                                                    })()}
                                                </span>
                                                {(() => {
                                                    const linkedDispatch = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === item.id || j.orderRef === (item as any).jobNumber || j.jobNumber === (item as any).jobNumber));
                                                    const delMethod = (item as any).deliveryMethod || (linkedDispatch as any)?.deliveryMethod || 'Internal';
                                                    const isExt = delMethod === 'External';
                                                    const shippedAt = (item as any).shippedAt || (linkedDispatch as any)?.shippedAt;
                                                    const effTransferStatus = (item as any).transferStatus || (linkedDispatch as any)?.transferStatus || item.status;
                                                    const rawStat = String(effTransferStatus || '').toLowerCase().replace(/[-_]/g, '');
                                                    const isDone = ['delivered', 'completed', 'received'].includes(rawStat);
                                                    const isDeparted = ['shipped', 'intransit', 'dispatched', 'delivered', 'completed', 'received'].includes(rawStat) || !!shippedAt;

                                                    if (!isExt) {
                                                        if (!isDone) {
                                                            return (
                                                                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                                                    Driver In-Transit (Awaiting Arrival)
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                                                Driver Delivered — Ready to Receive
                                                            </span>
                                                        );
                                                    } else {
                                                        if (!isDeparted) {
                                                            return (
                                                                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                                                    EXT Carrier (Awaiting Departure)
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                                                EXT Carrier — Departure Confirmed
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-[var(--theme-text-secondary)]">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-[var(--theme-text-secondary)]" />
                                                    {originName}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-[var(--theme-text-secondary)]" />
                                                    {formatDateTime(item.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedTransferId(isExpanded ? null : item.id)}
                                                className="p-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-colors cursor-pointer"
                                                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            {(() => {
                                                const linkedDispatch = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === item.id || j.orderRef === (item as any).jobNumber || j.jobNumber === (item as any).jobNumber));
                                                const delMethod = (item as any).deliveryMethod || (linkedDispatch as any)?.deliveryMethod || 'Internal';
                                                const isExt = delMethod === 'External';
                                                const shippedAt = (item as any).shippedAt || (linkedDispatch as any)?.shippedAt;
                                                const effTransferStatus = (item as any).transferStatus || (linkedDispatch as any)?.transferStatus || item.status;
                                                const rawStat = String(effTransferStatus || '').toLowerCase().replace(/[-_]/g, '');
                                                const isDone = ['delivered', 'completed', 'received'].includes(rawStat);
                                                const isDeparted = ['shipped', 'intransit', 'dispatched', 'delivered', 'completed', 'received'].includes(rawStat) || !!shippedAt;

                                                const WAREHOUSE_AUTHORITY_ROLES = [
                                                    'super_admin', 'admin', 'warehouse_manager', 'dispatch_manager',
                                                    'head_of_operations', 'regional_operations_manager', 'dispatcher',
                                                    'store_manager', 'inventory_manager', 'supervisor'
                                                ];
                                                const userRole = (user?.role || '').toLowerCase();
                                                const hasAuthority = WAREHOUSE_AUTHORITY_ROLES.includes(userRole);

                                                if (!isExt && !isDone) {
                                                    return (
                                                        <button
                                                            onClick={() => handleSelectTransferForReceiving(item.id)}
                                                            className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                                            title="Internal driver must mark delivery complete before POS can start receiving"
                                                        >
                                                            <Clock size={13} />
                                                            Awaiting Driver Delivery
                                                        </button>
                                                    );
                                                }

                                                if (isExt && !isDeparted) {
                                                    if (hasAuthority) {
                                                        return (
                                                            <button
                                                                onClick={() => handleSelectTransferForReceiving(item.id)}
                                                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                                title="Warehouse authority: Click to confirm external carrier departure & start receiving"
                                                            >
                                                                <Truck size={14} />
                                                                Confirm Departure & Receive
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            onClick={() => handleSelectTransferForReceiving(item.id)}
                                                            className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                                            title="Warehouse authority must confirm departure before external receiving can begin"
                                                        >
                                                            <Clock size={13} />
                                                            Awaiting Departure
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        onClick={() => handleSelectTransferForReceiving(item.id)}
                                                        className="px-4 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        {t('posCommand.startReceiving')}
                                                        <ChevronRight size={14} />
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Expanded Line Items Detail */}
                                    {isExpanded && (
                                        <div className="bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)] p-4">
                                            <p className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 pl-0.5">{t('posCommand.manifestItems')} ({(item as any).items?.length || 0})</p>
                                            <div className="max-h-[220px] overflow-y-auto custom-scrollbar border border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-card)] divide-y divide-[var(--theme-border)]">
                                                {((item as any).items || []).map((lineItem: any, idx: number) => (
                                                    <div key={idx} className="p-3 flex justify-between items-center text-xs font-medium hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[var(--theme-text-primary)] truncate font-semibold">{lineItem.name}</p>
                                                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">SKU: {lineItem.sku}</p>
                                                        </div>
                                                        <span className="text-[var(--theme-text-secondary)] font-mono pl-3">
                                                            {lineItem.expectedQty || lineItem.quantity || 0}
                                                            {lineItem.unit ? ` ${lineItem.unit}` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};
export default ReceivingPendingList;
