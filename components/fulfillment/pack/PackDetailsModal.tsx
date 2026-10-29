import { PackHandoffRecovery } from './components/PackHandoffRecovery';
import { FloorAuditTimeline } from '../discrepancies/FloorAuditTimeline';
import React from 'react';
import { X, Calendar, User, Package, Archive, Box, MapPin, Printer, ArrowRight, Undo2, Trash2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, formatPackagingDescription, getSellUnit, isWeightBased, isVolumeBased } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface PackDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites: any[];
    products: Product[];
    onReturn?: (job: WMSJob) => void;
    onReprintLabel?: (job: WMSJob, labelSize: string) => void;
    onDeleteJob?: (jobId: string) => void;
}

export const PackDetailsModal: React.FC<PackDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites,
    products,
    onReturn,
    onReprintLabel,
    onDeleteJob
}) => {
    const { t } = useLanguage();
    const { user } = useStore();
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
                const expected = item.expectedQty || (item as any).quantity || item.packedQty || item.pickedQty || 0;
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
        userName: resolvedWorker.name,
        userDisplayId: resolvedWorker.code || resolvedWorker.displayId,
        sourceSite: sourceSite,
        destSite: destSite,
        trackingNumber: trackingNum,
        items: itemsArray,
    };

    return (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] flex items-center justify-center z-[200] p-0 md:p-4 overflow-x-hidden animate-in fade-in duration-200">
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
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${data.status === 'Completed' ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--theme-border)] border-b border-[var(--theme-border)] shrink-0">
                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.completed')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight break-words leading-tight">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shadow-xs">
                            <span className="text-xs font-semibold">{(data.userName || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{workerLabel}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold break-words leading-tight">
                                {data.userName} {data.userDisplayId && <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.userDisplayId})</span>}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2.5 md:gap-3 col-span-2 sm:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <Printer size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.packing.trackingNumber') || 'Tracking #'}</p>
                            <p className="text-xs text-[var(--theme-accent)] font-mono tracking-tight font-semibold break-words leading-tight">{data.trackingNumber}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.from')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold break-words leading-tight">
                                {data.sourceSite ? (
                                    <>
                                        {data.sourceSite.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({data.sourceSite.code || data.sourceSite.id})</span>
                                    </>
                                ) : t('warehouse.packing.unknownSource')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] p-3 md:p-4 flex items-center gap-2.5 md:gap-3 col-span-2 sm:col-span-1">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                            <ArrowRight size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1">{t('warehouse.to')}</p>
                            <p className="text-xs text-[var(--theme-text-primary)] font-semibold break-words leading-tight">
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
                    <PackHandoffRecovery job={selectedItem}/>
                    <FloorAuditTimeline scope={{kind:'job',id:selectedItem.id,siteId:selectedItem.siteId,country:selectedItem.countryCode||selectedItem.country_code||sites.find(s=>s.id===selectedItem.siteId)?.country||''}}/>
                    <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-3">{t('warehouse.packing.itemsToPack') || 'Items to Pack'}</h4>
                    <div className="space-y-2.5">
                        {itemsArray.map((item: any, idx: number) => {
                            const isJobCompleted = (data.status || '').toLowerCase() === 'completed';
                            const isItemPacked = isJobCompleted || (item as any).packed === true;

                            // Resolve expected (required) quantity with robust fallbacks
                            const expected = item.expectedQty || (item as any).quantity || item.orderedQty ||
                                (item.packedQty ? item.packedQty : (item.pickedQty || 0));

                            // Resolve packed quantity: prioritize packedQty, then if completed/packed use expected, then fall back to pickedQty
                            const packed = (item.packedQty !== undefined && item.packedQty !== null)
                                ? item.packedQty
                                : (isItemPacked ? expected : (item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0));

                            const isShortPicked = item.orderedQty && item.orderedQty > expected;
                            const isUnderpacked = isJobCompleted && packed < expected;

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

                                    <div className="flex items-center gap-3 sm:gap-6 ml-0 sm:ml-0 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--theme-border)]/60 justify-between sm:justify-end">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] md:text-[11px] text-[var(--theme-status-danger-text)] uppercase font-semibold tracking-wider">{t('warehouse.packing.returned')}</p>
                                                <p className="text-sm md:text-lg font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] tabular-nums font-mono leading-none">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[10px] md:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('warehouse.packing.reqPkd')}</p>
                                            <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-semibold text-[var(--theme-status-danger-text)] line-through opacity-80 leading-none" title={t('warehouse.packing.shortPicked')}>{item.orderedQty}</span>
                                                )}
                                                <div className="text-sm md:text-lg font-bold text-[var(--theme-text-primary)] tabular-nums font-mono leading-none">
                                                    {(() => {
                                                        const packDesc = formatPackagingDescription(productInfo, expected);
                                                        const unitDef = getSellUnit(productInfo?.unit || item.unit);
                                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-sm md:text-lg font-mono font-bold ${isUnderpacked ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-accent)]'}`}>
                                                                    {packed} / {expected} <span className="text-[10px] md:text-[11px] font-semibold uppercase">{unitLabel}</span>
                                                                </span>
                                                                {packDesc && (
                                                                    <span className="text-[10px] md:text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] uppercase">
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
                <div className="p-3 sm:p-4 md:p-6 pb-[max(env(safe-area-inset-bottom),0.75rem)] border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {data.status === 'Completed' && (
                            <button
                                onClick={() => onReturn?.(selectedItem)}
                                className="flex items-center gap-1.5 px-3 md:px-4 py-2 min-h-[44px] bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors active:scale-95 touch-manipulation"
                            >
                                <Undo2 size={14} />
                                <span className="hidden sm:inline">{t('warehouse.packing.returnItems') || 'Return Items'}</span>
                                <span className="sm:hidden">{t('warehouse.driverHub.return') || 'Return'}</span>
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                                className="flex items-center gap-1.5 px-3 md:px-4 py-2 min-h-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors active:scale-95 touch-manipulation"
                            >
                                <Printer size={14} className="text-[var(--theme-accent)]" />
                                <span className="hidden sm:inline">{t('warehouse.reprintPackLabel') || 'Reprint Label'}</span>
                                <span className="sm:hidden">{t('warehouse.print') || 'Print'}</span>
                            </button>

                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-40 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl overflow-hidden p-1.5 z-50 animate-in slide-in-from-bottom-2 duration-150">
                                    <div className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider px-2 py-1 border-b border-[var(--theme-border)]">
                                        {t('warehouse.labelSize') || 'Label Size'}
                                    </div>
                                    {(['XL', 'LARGE', 'MEDIUM', 'SMALL'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                onReprintLabel?.(selectedItem, size);
                                                setIsPrintMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors min-h-[36px] flex items-center justify-between"
                                        >
                                            <span>{size} {size === 'XL' ? '(4×6)' : ''}</span>
                                            <Printer size={12} className="text-[var(--theme-accent)] opacity-70" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {canDelete && onDeleteJob && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1.5 px-3 md:px-4 py-2 min-h-[44px] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors active:scale-95 touch-manipulation"
                                title={t('common.delete') || 'Delete Job'}
                            >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">{t('common.delete') || 'Delete'}</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-5 sm:px-8 py-2 min-h-[44px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-app)] font-semibold uppercase tracking-wider text-xs rounded-xl transition-colors border border-[var(--theme-border)] active:scale-95 touch-manipulation"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>

            </div>
        </div>
    );
};
