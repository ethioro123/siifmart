import React, { useState } from 'react';
import { X, Calendar, User, Package, Box, MapPin, ArrowRight, Undo2, FileEdit } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, formatPackagingDescription, getSellUnit } from '../../../utils/units';
import { PickAmendModal } from './PickAmendModal';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PickDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    products?: Product[];
    sites?: any[];
    onReturn?: (job: WMSJob) => void;
}

export const PickDetailsModal: React.FC<PickDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    products,
    sites = [],
    onReturn
}) => {
    const { t } = useLanguage();
    const { user, jobs, wmsJobsService, addNotification, refreshData } = useFulfillment();
    const [amendModalOpen, setAmendModalOpen] = useState(false);

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
    const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
    const userName = userObj ? userObj.name : (userId ? t('warehouse.picking.unknownUser') : t('warehouse.picking.systemUser'));
    const userDisplayId = displayId;

    let rawItems = selectedItem.lineItems || selectedItem.items || [];
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
        title: t('warehouse.pickJobs'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: itemsArray,
        sourceSite: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id)),
        destSite: sites.find(s => s.id === (selectedItem.destSiteId || (selectedItem as any).dest_site_id)),
        userDisplay: (
            <>
                {userName} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({userDisplayId})</span>
            </>
        )
    };

    const sourceDisplay = data.sourceSite ? (
        <>
            {data.sourceSite.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.sourceSite.code || data.sourceSite.id})</span>
        </>
    ) : t('warehouse.unknownSite');

    const destDisplay = data.destSite ? (
        <>
            {data.destSite.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.destSite.code || data.destSite.id})</span>
        </>
    ) : t('warehouse.picking.internalOrUnknown');

    return (
        <>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-card)] shrink-0 z-10">
                    <div className="flex gap-4 items-start">
                        <div className="p-3 rounded-2xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] shrink-0">
                            <Package size={24} strokeWidth={1.75} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight font-mono">{data.reference}</h3>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                                        isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border bg-red-500/10 border-red-500/20 text-red-500">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} {t('warehouse.packing.returned').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[var(--theme-accent)] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Box size={13} />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--theme-border)] border-b border-[var(--theme-border)] shrink-0">
                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.timeSort')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-mono truncate">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/10 flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                            <span className="text-[11px] font-bold text-[var(--theme-accent)] font-mono">{(data.user || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{workerLabel}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase truncate">{data.userDisplay}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-emerald-500 border border-[var(--theme-border)] shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.from')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase truncate">{sourceDisplay}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <ArrowRight size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.to')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase truncate">{destDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--theme-bg-subtle)]">
                    <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-3">{t('warehouse.itemsToPick')}</h4>
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || 1);
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] font-mono text-xs font-semibold shrink-0">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--theme-text-primary)] font-semibold uppercase tracking-tight">{item.name || item.product?.name || productInfo?.name || t('warehouse.picking.unknownItem')}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className="text-[11px] text-[var(--theme-accent)] font-mono tracking-wider bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md uppercase border border-[var(--theme-accent)]/20">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {productInfo?.size && (
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                        {formatProductSize(productInfo)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Source Location */}
                                            {item.location && item.location !== 'Unknown' && (
                                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--theme-border)]">
                                                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.selectedStorageLocation')}:</span>
                                                    <span className="text-[11px] font-mono font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[var(--theme-accent)]/20">
                                                        <MapPin size={11} /> {item.location}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--theme-border)]">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[11px] text-red-500 uppercase font-semibold tracking-wider">{t('warehouse.packing.returned')}</p>
                                                <p className="text-base font-bold text-red-500 tabular-nums font-mono">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('warehouse.picking.reqPkd')}</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-bold text-red-500 line-through opacity-80" title="Short Picked">{item.orderedQty}</span>
                                                )}
                                                <div>
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                        const packDesc = formatPackagingDescription(productInfo, expected);
                                                        const unitDef = getSellUnit(productInfo?.unit || item.unit);
                                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base font-mono font-bold text-emerald-500 tabular-nums">
                                                                    {picked} / {expected} <span className="text-xs uppercase font-semibold text-emerald-500/70">{unitLabel}</span>
                                                                </span>
                                                                {packDesc && (
                                                                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] uppercase">
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
                <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {isCompleted && (
                            <button
                                onClick={() => onReturn?.(selectedItem)}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors min-h-[44px]"
                            >
                                <Undo2 size={14} />
                                {t('warehouse.picking.returnItems')}
                            </button>
                        )}
                        {/* Amend Pick — manager only */}
                        {isCompleted && (
                            <button
                                onClick={() => setAmendModalOpen(true)}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors min-h-[44px]"
                            >
                                <FileEdit size={14} />
                                {t('warehouse.picking.amendQuantities')}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider text-xs rounded-xl border border-[var(--theme-border)] min-h-[44px] transition-colors"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>
        </div>

        {/* Pick Amendment Modal — supervisor only */}
        <PickAmendModal
            isOpen={amendModalOpen}
            onClose={() => setAmendModalOpen(false)}
            job={selectedItem}
            currentUser={user}
            allJobs={jobs}
            wmsJobsService={wmsJobsService}
            addNotification={addNotification}
            refreshData={refreshData}
        />
        </>
    );
};
