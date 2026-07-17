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

            if (['received', 'completed'].includes(transferStatus)) return false;

            // Needs to be in-transit, dispatched, pending, delivered or in-progress
            return (
                ['intransit', 'dispatched', 'pending', 'pendingdispatch', 'delivered', 'partiallydelivered'].includes(transferStatus) ||
                ['inprogress', 'pending', 'staged', 'delivered'].includes(jobStatus)
            );
        }).sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
    }, [transfers, wmsTransferJobs, activeSite]);

    return (
        <>
            {/* Order Ref Scanner */}
            <div className="bg-[#FAF8F5] dark:bg-[#2C5E3B]/5 border border-[#E2DCCE] dark:border-[#2C5E3B]/30 rounded-2xl p-4 mb-2 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase flex items-center gap-2">
                        <Scan size={14} />
                        {t('posCommand.quickScanHandover')}
                    </label>
                    <span className="text-[10px] text-stone-550 dark:text-gray-500 italic">{t('posCommand.scanPackingLabel')}</span>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={orderRefScanInput}
                        onChange={(e) => setOrderRefScanInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleScanOrderRef(orderRefScanInput);
                        }}
                        placeholder={t('posCommand.scanBarcodePlaceholder')}
                        className="w-full bg-white dark:bg-black/45 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white font-mono outline-none transition-all placeholder:text-[#4D6E56]/40 dark:placeholder:text-gray-600 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-1 focus:ring-[#2C5E3B]"
                    />
                    <button
                        onClick={() => handleScanOrderRef(orderRefScanInput)}
                        className="absolute right-2 top-2 px-4 py-1.5 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                    >
                        {t('common.verify') || 'Verify'}
                    </button>
                </div>
            </div>

            {/* Inbound Shipment List */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest pl-1">{t('posCommand.inboundShipments')}</h3>
                
                {pendingItems.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 dark:bg-black/10 border border-[#E2DCCE] dark:border-white/5 rounded-3xl">
                        <Truck size={40} className="mx-auto mb-4 opacity-30 text-stone-400 dark:text-gray-600" />
                        <p className="text-sm font-bold text-stone-500 dark:text-gray-400">{t('posCommand.noInboundTransfers')}</p>
                        <p className="text-xs text-stone-400 dark:text-gray-500 mt-1">{t('posCommand.inboundAppear')}</p>
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
                                    className={`bg-white dark:bg-white/5 border rounded-3xl overflow-hidden transition-all duration-300 ${
                                        isExpanded
                                            ? 'border-[#2C5E3B]/40 dark:border-[#A9CBA2]/40 shadow-md ring-4 ring-[#2C5E3B]/5'
                                            : 'border-[#E2DCCE] dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20 shadow-sm'
                                    }`}
                                >
                                    {/* Main Header summary clickable row */}
                                    <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-black text-sm text-[#1E3F27] dark:text-white uppercase tracking-tight">
                                                    {formatJobId({ ...item, type: 'TRANSFER' } as any)}
                                                </span>
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-wider">
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
                                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                                                                    Driver In-Transit (Awaiting Arrival)
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="px-2 py-0.5 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 rounded text-[9px] font-black uppercase tracking-wider">
                                                                Driver Delivered — Ready to Receive
                                                            </span>
                                                        );
                                                    } else {
                                                        if (!isDeparted) {
                                                            return (
                                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                                                                    EXT Carrier (Awaiting Departure)
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="px-2 py-0.5 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 rounded text-[9px] font-black uppercase tracking-wider">
                                                                EXT Carrier — Departure Confirmed
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-stone-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                    {originName}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                    {formatDateTime(item.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedTransferId(isExpanded ? null : item.id)}
                                                className="p-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-xl text-stone-600 dark:text-gray-400 transition-colors"
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
                                                    'operations_manager', 'regional_manager', 'dispatcher',
                                                    'store_manager', 'inventory_manager', 'supervisor'
                                                ];
                                                const userRole = (user?.role || '').toLowerCase();
                                                const hasAuthority = WAREHOUSE_AUTHORITY_ROLES.includes(userRole);

                                                if (!isExt && !isDone) {
                                                    return (
                                                        <button
                                                            onClick={() => handleSelectTransferForReceiving(item.id)}
                                                            className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
                                                                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
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
                                                            className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
                                                        className="px-4 py-2.5 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#3a7a4d] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
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
                                        <div className="bg-[#FAF8F5] dark:bg-black/10 border-t border-[#E2DCCE]/60 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-300">
                                            <p className="text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest mb-2 pl-0.5">{t('posCommand.manifestItems')} ({(item as any).items?.length || 0})</p>
                                            <div className="max-h-[220px] overflow-y-auto custom-scrollbar border border-[#E2DCCE] dark:border-white/10 rounded-2xl bg-white dark:bg-transparent divide-y divide-[#E2DCCE]/60 dark:divide-white/5">
                                                {((item as any).items || []).map((lineItem: any, idx: number) => (
                                                    <div key={idx} className="p-3 flex justify-between items-center text-xs font-bold hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-stone-700 dark:text-gray-300 truncate">{lineItem.name}</p>
                                                            <p className="text-[10px] text-stone-400 dark:text-gray-500 font-mono">SKU: {lineItem.sku}</p>
                                                        </div>
                                                        <span className="text-stone-600 dark:text-gray-400 font-mono pl-3">
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
