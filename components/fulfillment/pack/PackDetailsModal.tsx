import React from 'react';
import { X, Calendar, User, Package, Archive, Box, MapPin, Printer, ArrowRight, Undo2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, formatPackagingDescription, getSellUnit, isWeightBased, isVolumeBased } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';

import { useStore } from '../../../contexts/CentralStore';

interface PackDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites: any[];
    products: Product[];
    onReturn?: (job: WMSJob) => void;
    onReprintLabel?: (job: WMSJob, labelSize: string) => void;
}

export const PackDetailsModal: React.FC<PackDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites,
    products,
    onReturn,
    onReprintLabel
}) => {
    const { t } = useLanguage();
    const { user } = useStore();
    // Resolve User Name: prioritize completion author for completed jobs
    const isCompleted = (selectedItem.status || '').toLowerCase() === 'completed';
    const completedUserId = selectedItem.completedBy || (selectedItem as any).completed_by;
    const assignedUserId = selectedItem.assignedTo || (selectedItem as any).assigned_to;
    const userId = (isCompleted || completedUserId) ? (completedUserId || assignedUserId) : (assignedUserId || completedUserId);
    const workerLabel = (isCompleted || Boolean(completedUserId))
        ? (t('warehouse.completedBy') || 'Completed By')
        : (t('warehouse.assignedTo') || 'Assigned To');
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
    // Use code if available, otherwise fallback to full ID unless it's a UUID
    const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');

    const userName = userObj ? userObj.name : (userId ? 'Unknown' : 'System');
    const userDisplayId = displayId;

    const sourceSite = sites.find(s => s.id === selectedItem.siteId);
    const destSite = sites.find(s => s.id === selectedItem.destSiteId);
    const trackingNum = selectedItem.trackingNumber || 'Not Generated';

    const [isPrintMenuOpen, setIsPrintMenuOpen] = React.useState(false);

    const getItemMeasureQty = (item: any, productInfo?: any) => {
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        if (productInfo) {
            const unit = productInfo.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = productInfo.size ? parseFloat(productInfo.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
        }
        return null;
    };

    // Prioritize array fields. If selectedItem.items is a number, ignore it for the array.
    let rawItems = selectedItem.lineItems || (selectedItem as any).line_items ||
        (Array.isArray(selectedItem.items) ? selectedItem.items : null) || [];

    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems);
        } catch (e) {
            rawItems = [];
        }
    }
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: t('warehouse.packJobTitle'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        userName: userName,
        userDisplayId: displayId,
        sourceSite: sourceSite,
        destSite: destSite,
        trackingNumber: trackingNum,
        items: itemsArray,
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-0 md:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border-0 md:border border-[var(--theme-border)] w-full max-w-4xl h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-card)] shrink-0">
                    <div className="flex gap-3 md:gap-4 items-center">
                        <div className="p-2.5 md:p-3 rounded-2xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] shadow-sm shrink-0">
                            <Archive size={22} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight font-mono leading-none">{data.reference}</h3>
                                <div className="flex gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${data.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} {t('warehouse.packing.ret')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Box size={12} className="text-[var(--theme-accent)]" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-colors flex items-center justify-center shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--theme-border)] border-b border-[var(--theme-border)] shrink-0">
                    <div className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-2.5 md:gap-3 lg:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1 truncate">{t('warehouse.completed')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight truncate">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    
                    <div className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-2.5 md:gap-3 lg:col-span-1">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shadow-xs">
                            <span className="text-xs font-semibold">{(data.userName || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1 truncate">{workerLabel}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold truncate leading-tight">
                                {data.userName} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.userDisplayId})</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-2.5 md:gap-3 col-span-2 lg:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <Printer size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1 truncate">{t('warehouse.labelSize').split(' ')[0]}</p>
                            <p className="text-xs text-[var(--theme-accent)] font-mono tracking-tight font-semibold truncate">{data.trackingNumber}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-2.5 md:gap-3 lg:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1 truncate">{t('warehouse.from')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold truncate leading-tight">
                                {data.sourceSite ? (
                                    <>
                                        {data.sourceSite.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.sourceSite.code || data.sourceSite.id})</span>
                                    </>
                                ) : t('warehouse.packing.unknownSource')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-2.5 md:gap-3 lg:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <ArrowRight size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1 truncate">{t('warehouse.to')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold truncate leading-tight">
                                {data.destSite ? (
                                    <>
                                        {data.destSite.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.destSite.code || data.destSite.id})</span>
                                    </>
                                ) : t('warehouse.packing.unknownDestination')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[var(--theme-bg-app)]">
                    <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-3">{t('warehouse.picking')}</h4>
                    <div className="space-y-2.5">
                        {itemsArray.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || 1);

                            // Resolve full product info
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-[var(--theme-accent)]/30 transition-colors shadow-sm">
                                    <div className="flex flex-row items-center gap-3 md:gap-4 min-w-0">
                                        <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] font-semibold text-xs shrink-0 font-mono">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs md:text-sm text-[var(--theme-text-primary)] font-semibold uppercase tracking-tight break-words leading-tight">{item.name || item.product?.name || productInfo?.name || 'Unknown Item'}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                                                <span className="text-[11px] text-[var(--theme-accent)] font-mono font-medium bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md border border-[var(--theme-accent)]/20 uppercase shrink-0">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] shrink-0 hidden sm:inline-flex">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[11px] text-[var(--theme-text-primary)] font-medium uppercase tracking-wider border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md shrink-0">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {productInfo?.size && (
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] shrink-0">
                                                        {formatProductSize(productInfo)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 ml-11 sm:ml-0 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--theme-border)] justify-end">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[11px] text-red-500 uppercase font-semibold tracking-wider">{t('warehouse.packing.returned')}</p>
                                                <p className="text-base md:text-lg font-bold text-red-600 dark:text-red-400 tabular-nums font-mono leading-none">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('warehouse.packing.reqPkd')}</p>
                                            <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-semibold text-red-500 line-through opacity-80 leading-none" title={t('warehouse.packing.shortPicked')}>{item.orderedQty}</span>
                                                )}
                                                <div className="text-base md:text-lg font-bold text-[var(--theme-text-primary)] tabular-nums font-mono leading-none">
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                        const packDesc = formatPackagingDescription(productInfo, expected);
                                                        const unitDef = getSellUnit(productInfo?.unit || item.unit);
                                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base md:text-lg font-mono font-bold text-[var(--theme-accent)]">
                                                                    {picked} / {expected} <span className="text-[11px] font-semibold uppercase">{unitLabel}</span>
                                                                </span>
                                                                {packDesc && (
                                                                    <span className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] uppercase">
                                                                        ({packDesc})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {data.status === 'Completed' && (
                            <button
                                onClick={() => onReturn?.(selectedItem)}
                                className="flex items-center gap-1.5 md:gap-2 px-3.5 md:px-4 py-2.5 min-h-[44px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors"
                            >
                                <Undo2 size={14} />
                                <span className="hidden sm:inline">{t('warehouse.packing.returnItems')}</span><span className="sm:hidden">{t('warehouse.driverHub.return')}</span>
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                                className="flex items-center gap-1.5 md:gap-2 px-3.5 md:px-4 py-2.5 min-h-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors"
                            >
                                <Printer size={14} />
                                <span className="hidden sm:inline">{t('warehouse.reprintPackLabel')}</span><span className="sm:hidden">{t('warehouse.reprintPackLabel').split(' ').slice(-1)[0]}</span>
                            </button>

                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-36 md:w-44 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl overflow-hidden p-1.5 z-50 animate-in slide-in-from-bottom-2 duration-150">
                                    {(['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                onReprintLabel?.(selectedItem, size);
                                                setIsPrintMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors"
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 md:px-8 py-2.5 min-h-[44px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-app)] font-semibold uppercase tracking-wider text-xs rounded-xl transition-colors border border-[var(--theme-border)]"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>

            </div>
        </div>
    );
};
