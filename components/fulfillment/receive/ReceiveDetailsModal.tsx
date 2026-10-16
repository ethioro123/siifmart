import React, { useState } from 'react';
import { X, Calendar, User, Box, Printer, FileText, Package, Truck, ArrowRight, ScanBarcode } from 'lucide-react';
import { PurchaseOrder, WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import Badge from '../../shared/Badge';
import { formatDateTime } from '../../../utils/formatting';
import { getSellUnit } from '../../../utils/units';
import { parseBatchNumber, getBatchExpiryStatus } from '../../../utils/batchNumber';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { formatPOItemDescription, formatPackBadge } from '../../procurement/utils';
import { ItemAttributeBadges } from '../ItemAttributeBadges';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface ReceiveDetailsModalProps {
    selectedItem: WMSJob | PurchaseOrder;
    onClose: () => void;
    resolveOrderRef: (ref: string) => string;
    setReprintItem: (item: any) => void;
    sites: any[];
    t: (key: string) => string;
}

export const ReceiveDetailsModal: React.FC<ReceiveDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    setReprintItem,
    sites,
    t
}) => {
    const { addNotification, isSubmitting, setIsSubmitting, employees, user, jobs, historicalJobs, allProducts } = useFulfillment();
    const { settings, effectiveCountry } = useData();
    const [printingId, setPrintingId] = useState<string | null>(null);
    const isBlindReceiving = resolveReceivingPolicy(settings, effectiveCountry).blind;

    const isPO = (item: any): item is PurchaseOrder => {
        return (item as PurchaseOrder).poNumber !== undefined || (item as PurchaseOrder).supplierName !== undefined;
    };

    const matchingJob = isPO(selectedItem)
        ? (jobs?.find(j => j.type === 'RECEIVE' && (j.orderRef === selectedItem.id || (selectedItem.poNumber && j.jobNumber === selectedItem.poNumber))) ||
           historicalJobs?.find(j => j.type === 'RECEIVE' && (j.orderRef === selectedItem.id || (selectedItem.poNumber && j.jobNumber === selectedItem.poNumber))))
        : null;

    const rawTargetUserId = isPO(selectedItem)
        ? ((selectedItem as any).receivedBy || (selectedItem as any).received_by || matchingJob?.completedBy || (matchingJob as any)?.completed_by || (selectedItem as any).completedBy || selectedItem.createdBy)
        : (selectedItem.completedBy || (selectedItem as any).completed_by || (selectedItem as any).receivedBy || (selectedItem as any).received_by || selectedItem.assignedTo || selectedItem.createdBy);

    const resolvedWorker = resolveFulfillmentWorker({
        userId: rawTargetUserId,
        job: isPO(selectedItem) ? matchingJob : selectedItem,
        employees,
        sites,
        currentUser: user,
        siteId: selectedItem.siteId || (selectedItem as any).site_id
    });

    const data = isPO(selectedItem) ? {
        type: 'PO',
        id: selectedItem.id,
        reference: selectedItem.poNumber || selectedItem.id.slice(0, 8),
        title: selectedItem.supplierName || 'Unknown Supplier',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt,
        user: {
            name: resolvedWorker.name,
            displayId: resolvedWorker.code || resolvedWorker.displayId
        },
        items: selectedItem.lineItems || []
    } : {
        type: 'JOB',
        id: selectedItem.id,
        reference: resolveOrderRef(selectedItem.orderRef) || selectedItem.jobNumber,
        title: selectedItem.type === 'PUTAWAY' ? 'Item Receipt' : selectedItem.type,
        status: selectedItem.status,
        date: selectedItem.completedAt || selectedItem.updatedAt || selectedItem.createdAt,
        user: {
            name: resolvedWorker.name,
            displayId: resolvedWorker.code || resolvedWorker.displayId
        },
        items: selectedItem.lineItems || [],
        destination: sites.find(s => s.id === (selectedItem as any).siteId)?.name || 'Unknown'
    };

    const destSite = isPO(selectedItem) ? sites.find(s => s.id === selectedItem.siteId) : sites.find(s => s.id === (selectedItem as any).siteId);
    const destDisplay = destSite ? (
        <>
            {destSite.name} <span className="text-[var(--theme-text-secondary)] font-normal lowercase">({destSite.code || destSite.id})</span>
        </>
    ) : 'Unknown Site';

    const handleOpenReprint = (item: any) => {
        setReprintItem({
            sku: item.sku,
            name: item.name || item.productName || 'Unknown Item',
            qty: item.quantity || item.expectedQty || 1,
            price: item.retailPrice || item.price || 0,
            category: item.category || 'General',
            batchNumber: item.batchNumber || item.batch_number,
            expiry: item.expiryDate || item.expiry_date,
            targetLocation: item.location || item.suggestedLocation || (selectedItem as any)?.location,
            poNumber: isPO(selectedItem) ? (selectedItem.poNumber || (selectedItem as any).po_number) : undefined,
            packQuantity: item.packQuantity || 1
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative shadow-2xl">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-subtle)]">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className="hidden md:flex p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] items-center justify-center shadow-sm">
                            {data.type === 'PO' ? <FileText size={22} /> : <Box size={22} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base md:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight font-mono">{data.reference}</h3>
                                <Badge variant="neutral" className="border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[11px] font-mono text-[var(--theme-text-secondary)] rounded-full px-2 py-0.5">
                                    {data.status}
                                </Badge>
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 mt-1">
                                {data.type === 'PO' ? <Truck size={14} className="text-[var(--theme-text-secondary)]" /> : <Package size={14} className="text-[var(--theme-text-secondary)]" />}
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
                        aria-label="Close details"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-px bg-[var(--theme-border)] border-b border-[var(--theme-border)]">
                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1.5">{t('warehouse.date')}</p>
                            <p className="text-xs md:text-sm text-[var(--theme-text-primary)] font-mono tracking-tight font-medium">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1.5">
                                {t('warehouse.receivedBy') || 'Received By'}
                            </p>
                            <p className="text-xs md:text-sm text-[var(--theme-text-primary)] font-semibold break-words leading-tight">
                                {data.user.name} {data.user.displayId && <span className="text-[var(--theme-text-secondary)] font-normal">({data.user.displayId})</span>}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2 md:gap-3 col-span-2">
                        <div className="hidden md:flex p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                            <ArrowRight size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1.5">{t('warehouse.destinationSite')}</p>
                            <p className="text-xs md:text-sm text-[var(--theme-text-primary)] font-semibold break-words leading-tight">{destDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[var(--theme-bg-app)]">
                    <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package size={14} className="text-[var(--theme-text-secondary)]" /> {t('warehouse.itemsReceived')}
                    </h4>
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="group p-3 md:p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between transition-colors shadow-sm">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className="hidden md:flex w-10 h-10 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] items-center justify-center text-[var(--theme-text-secondary)] font-semibold text-xs font-mono">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[var(--theme-text-primary)] font-semibold tracking-tight text-xs md:text-sm break-words">{formatPOItemDescription(item) || item.name || item.productName || 'Unknown Item'}</p>
                                        {(() => {
                                             const badge = formatPackBadge(item);
                                             return badge ? (
                                                 <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[11px] font-medium tracking-wide">
                                                     {badge}
                                                 </span>
                                             ) : null;
                                        })()}
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-[11px] text-[var(--theme-text-primary)] font-semibold font-mono tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                {item.sku}
                                            </span>
                                            {item.barcode && (
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium font-mono flex items-center gap-1">
                                                    <ScanBarcode size={12} /> {item.barcode}
                                                </span>
                                            )}
                                            {item.condition && (
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${item.condition === 'Good' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                                    item.condition === 'Damaged' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {item.condition}
                                                </span>
                                            )}
                                        </div>

                                        {/* Dynamic Logistics, Packaging & Inbound QC Directives */}
                                        <ItemAttributeBadges item={item} allProducts={allProducts} className="mt-2" />

                                        {/* Granular Metadata (Batch / Expiry) */}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {item.batchNumber && (() => {
                                                const parsed = parseBatchNumber(item.batchNumber);
                                                return (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-md">
                                                        <Box size={12} className="text-[var(--theme-text-secondary)]" />
                                                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase">Lot:</span>
                                                        <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] font-mono">{item.batchNumber}</span>
                                                        {parsed.isStandard && parsed.formattedDate && (
                                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono ml-1 border-l border-[var(--theme-border)] pl-1.5">
                                                                Rcvd {parsed.formattedDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            {item.expiryDate && (() => {
                                                const exp = getBatchExpiryStatus(item.expiryDate);
                                                return (
                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${exp.badgeColor}`}>
                                                        {exp.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* Extra Barcodes */}
                                        {item.barcodes && item.barcodes.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.barcodes.map((code: string, cIdx: number) => (
                                                    <span key={cIdx} className="text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-5 flex-shrink-0 ml-2">
                                    <div className="text-right">
                                        <p className={`text-[11px] uppercase font-semibold tracking-wider mb-1 ${isBlindReceiving && data.status !== 'Completed' && data.status !== 'Received' ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--theme-text-secondary)]'}`}>
                                            {t('warehouse.quantityToReceive')}{isBlindReceiving && data.status !== 'Completed' && data.status !== 'Received' ? ' (Blind)' : ''}
                                        </p>
                                        {isBlindReceiving && data.status !== 'Completed' && data.status !== 'Received' ? (
                                            <p className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums font-mono leading-none tracking-widest">
                                                ***
                                            </p>
                                        ) : (
                                            <p className="text-base md:text-lg font-bold text-[var(--theme-text-primary)] tabular-nums font-mono leading-none">
                                                {(() => {
                                                    const baseQty = item.receivedQty || item.quantity || item.expectedQty || 0;
                                                    const itemUnit = getSellUnit(item.unit);
                                                    const sizeNum = parseFloat(item.size || '') || 0;
                                                    const isWeightOrVolume = itemUnit.category === 'weight' || itemUnit.category === 'volume';

                                                    if (isWeightOrVolume && sizeNum > 0) {
                                                        return (
                                                            <>
                                                                {baseQty}
                                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium ml-1 uppercase">× {sizeNum}{itemUnit.shortLabel.toLowerCase()}</span>
                                                            </>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            {baseQty}
                                                            {itemUnit.code !== 'UNIT' && (
                                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium ml-1 uppercase">{itemUnit.shortLabel}</span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="hidden md:block w-px h-8 bg-[var(--theme-border)]" />

                                    <button
                                        onClick={() => handleOpenReprint(item)}
                                        className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] active:scale-95 transition-all flex items-center justify-center p-2.5"
                                        title={t('warehouse.reprintLabel')}
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs uppercase tracking-wider font-semibold min-h-[44px] transition-colors"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};

