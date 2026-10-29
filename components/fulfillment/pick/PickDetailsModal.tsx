import { FloorAuditTimeline } from '../discrepancies/FloorAuditTimeline';
import React, { useState } from 'react';
import { X, Calendar, User, Package, Box, MapPin, ArrowRight, Undo2, FileEdit, Trash2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, formatPackagingDescription, getSellUnit } from '../../../utils/units';
import { PickAmendModal } from './PickAmendModal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface PickDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    products?: Product[];
    sites?: any[];
    onReturn?: (job: WMSJob) => void;
    onDeleteJob?: (jobId: string) => void;
}

export const PickDetailsModal: React.FC<PickDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    products,
    sites = [],
    onReturn,
    onDeleteJob
}) => {
    const { t } = useLanguage();
    const { user, jobs, wmsJobsService, addNotification, refreshData } = useFulfillment();
    const [amendModalOpen, setAmendModalOpen] = useState(false);

    const canDelete = ['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager'].includes(user?.role || '');

    const handleDelete = () => {
        if (!window.confirm(t('warehouse.confirmDeleteJob') || 'Are you sure you want to delete this job? This action cannot be undone.')) return;
        onDeleteJob?.(selectedItem.id);
        onClose();
    };

    // Resolve User Name: prioritize completion author for completed jobs
    const isCompleted = (selectedItem.status || '').toLowerCase() === 'completed';
    const completedUserId = selectedItem.completedBy || (selectedItem as any).completed_by;
    const assignedUserId = selectedItem.assignedTo || (selectedItem as any).assigned_to;
    const rawTargetUserId = (isCompleted || completedUserId) ? (completedUserId || assignedUserId) : (assignedUserId || completedUserId);
    const workerLabel = (isCompleted || Boolean(completedUserId))
        ? (t('warehouse.completedBy') || 'Completed By')
        : (t('warehouse.assignedTo') || 'Assigned To');

    const resolvedWorker = resolveFulfillmentWorker({
        userId: rawTargetUserId,
        job: selectedItem,
        employees,
        sites,
        currentUser: user,
        siteId: selectedItem.siteId || (selectedItem as any).site_id
    });

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
        user: resolvedWorker.name,
        items: itemsArray,
        sourceSite: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id)),
        destSite: sites.find(s => s.id === (selectedItem.destSiteId || (selectedItem as any).dest_site_id)),
        userDisplay: (
            <>
                {resolvedWorker.name} {resolvedWorker.code && (
                    <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({resolvedWorker.code})</span>
                )}
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
                                        isCompleted ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)]'
                                    }`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)]">
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
                        className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0 cursor-pointer"
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
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.timeSort')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-mono break-words leading-tight">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/10 flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                            <span className="text-[11px] font-bold text-[var(--theme-accent)] font-mono">{resolvedWorker.initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{workerLabel}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase break-words leading-tight">{data.userDisplay}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-status-success-text)] border border-[var(--theme-border)] shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.from')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase break-words leading-tight">{sourceDisplay}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <ArrowRight size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.to')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase break-words leading-tight">{destDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--theme-bg-subtle)]">
                    <FloorAuditTimeline scope={{kind:'job',id:selectedItem.id,siteId:selectedItem.siteId,country:selectedItem.countryCode||selectedItem.country_code||sites.find(s=>s.id===selectedItem.siteId)?.country||''}}/>
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
                                                <p className="text-[11px] text-[var(--theme-status-danger-text)] uppercase font-semibold tracking-wider">{t('warehouse.packing.returned')}</p>
                                                <p className="text-base font-bold text-[var(--theme-status-danger-text)] tabular-nums font-mono">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('warehouse.picking.reqPkd')}</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-bold text-[var(--theme-status-danger-text)] line-through opacity-80" title="Short Picked">{item.orderedQty}</span>
                                                )}
                                                <div>
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || item.orderedQty || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null
                                                            ? item.pickedQty
                                                            : ((data.status === 'Completed' || item.status === 'Picked' || item.status === 'Completed') ? expected : 0);
                                                        const packDesc = formatPackagingDescription(productInfo, expected);
                                                        const unitDef = getSellUnit(productInfo?.unit || item.unit);
                                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base font-mono font-bold text-[var(--theme-status-success-text)] tabular-nums">
                                                                    {picked} / {expected} <span className="text-xs uppercase font-semibold text-[var(--theme-status-success-text)]">{unitLabel}</span>
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
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors min-h-[44px]"
                            >
                                <Undo2 size={14} />
                                {t('warehouse.picking.returnItems')}
                            </button>
                        )}
                        {/* Amend Pick — manager only */}
                        {isCompleted && (
                            <button
                                onClick={() => setAmendModalOpen(true)}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors min-h-[44px]"
                            >
                                <FileEdit size={14} />
                                {t('warehouse.picking.amendQuantities')}
                            </button>
                        )}
                        {canDelete && onDeleteJob && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors min-h-[44px]"
                                title={t('common.delete') || 'Delete Job'}
                            >
                                <Trash2 size={14} />
                                {t('common.delete') || 'Delete'}
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
