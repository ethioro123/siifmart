import React, { useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { PurchaseOrder, WMSJob } from '../../../types';
import { useFulfillment } from '../../fulfillment/FulfillmentContext';
import { convertToSellableUnits } from '../useReceiving';
import { formatPackBadge, formatPOItemDescription } from '../../procurement/utils';
import { buildPOJobsReceivedMap, resolvePOLineItemProgress } from './receiveQuantityResolver';
import { ItemAttributeBadges } from '../ItemAttributeBadges';

interface ReceiveReviewModalProps {
    po: PurchaseOrder;
    jobs: WMSJob[];
    onClose: () => void;
    onFinalize: () => void;
    isSubmitting: boolean;
    t: (key: string) => string;
}

export const ReceiveReviewModal: React.FC<ReceiveReviewModalProps> = ({
    po,
    jobs,
    onClose,
    onFinalize,
    isSubmitting,
    t
}) => {
    const { allProducts } = useFulfillment();

    // Calculate stats
    const stats = useMemo(() => {
        const poJobs = jobs.filter(j => (j.orderRef === po.id || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
        const receivedMaps = buildPOJobsReceivedMap(poJobs);

        let totalExpectedSellable = 0;
        let totalReceivedSellable = 0;
        let totalOrderedCases = 0;

        const details = (po.lineItems || []).map(item => {
            const progress = resolvePOLineItemProgress(item, receivedMaps, allProducts);
            const unitsPerOrderUnit = convertToSellableUnits(1, item);

            totalOrderedCases += item.quantity;
            totalExpectedSellable += progress.expectedSellable;
            totalReceivedSellable += progress.effectiveReceived;

            return {
                ...item,
                expectedSellable: progress.expectedSellable,
                received: progress.effectiveReceived,
                unitsPerOrderUnit,
                status: progress.isComplete ? 'Complete' : progress.effectiveReceived > 0 ? 'Partial' : 'Pending'
            };
        });

        return { totalOrderedCases, totalExpectedSellable, totalReceivedSellable, details };
    }, [po, jobs, allProducts]);

    const isFullyReceived = stats.totalReceivedSellable >= stats.totalExpectedSellable;

    return (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_70%,transparent)] flex items-center justify-center p-2 sm:p-4 z-[150] overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative shadow-2xl">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-subtle)]">
                    <div>
                        <h3 className="text-base md:text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2 md:gap-3 tracking-tight">
                            <FileText className="text-[var(--theme-text-primary)]" size={20} />
                            {t('warehouse.finalizeManifest')}
                        </h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-1.5 font-mono">
                            Manifest #{po.poNumber} • <span className="text-[var(--theme-text-primary)] font-semibold">{po.supplierName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-[var(--theme-bg-app)]">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-4 md:p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-center shadow-sm">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1.5">{t('warehouse.totalOrdered')}</p>
                            <p className="text-xl md:text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums font-mono leading-none">
                                {stats.totalExpectedSellable} <span className="text-xs text-[var(--theme-text-secondary)] font-normal">{t('warehouse.unitsLabel')}</span>
                            </p>
                            {stats.totalExpectedSellable !== stats.totalOrderedCases && (
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-1">
                                    ({stats.totalOrderedCases} {stats.totalOrderedCases === 1 ? (t('warehouse.package') || 'package') : (t('warehouse.packages') || 'packages')})
                                </p>
                            )}
                        </div>
                        <div className={`p-4 md:p-5 rounded-2xl border text-center transition-all shadow-sm ${isFullyReceived ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'}`}>
                            <p className="text-[11px] uppercase font-semibold tracking-wider mb-1.5 text-[var(--theme-text-secondary)]">{t('warehouse.totalReceived')}</p>
                            <p className="text-xl md:text-2xl font-bold tabular-nums font-mono leading-none">
                                {stats.totalReceivedSellable} <span className="text-xs opacity-75 font-normal">{t('warehouse.unitsLabel')}</span>
                            </p>
                        </div>
                    </div>

                    {!isFullyReceived && (
                        <div className="p-4 md:p-5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex gap-3 shadow-sm border-l-4 border-l-[var(--theme-status-warning-border)]">
                            <AlertTriangle className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] tracking-tight">{t('warehouse.discrepancyDetected')}</h4>
                                <p className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-1 font-medium leading-relaxed">
                                    Finalizing with {stats.totalExpectedSellable - stats.totalReceivedSellable} {t('warehouse.missingItems')}.
                                    Marked as <span className="font-semibold underline decoration-[color-mix(in_srgb,var(--theme-status-warning-text)_30%,transparent)]">{t('warehouse.partialReceipt')}</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-bg-card)] shadow-sm relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider text-[11px] border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="p-3 md:p-4">{t('warehouse.productAttributes')}</th>
                                    <th className="p-3 md:p-4 text-center">{t('warehouse.req')}</th>
                                    <th className="p-3 md:p-4 text-center">{t('warehouse.rec')}</th>
                                    <th className="p-3 md:p-4 text-right">{t('warehouse.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {stats.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                        <td className="p-3 md:p-4">
                                            <p className="text-[var(--theme-text-primary)] font-semibold tracking-tight truncate max-w-[140px] md:max-w-[200px] text-xs md:text-sm">{formatPOItemDescription(item) || item.productName}</p>
                                            {(() => {
                                                const badge = formatPackBadge(item);
                                                return badge ? (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[11px] font-medium">
                                                        {badge}
                                                    </span>
                                                ) : null;
                                            })()}
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-1">{item.sku}</p>
                                            <ItemAttributeBadges item={item} allProducts={allProducts} className="mt-1" compact />
                                        </td>
                                        <td className="p-3 md:p-4 text-center text-[var(--theme-text-secondary)] font-medium tabular-nums font-mono text-xs md:text-sm">
                                            {item.expectedSellable}
                                            {item.expectedSellable !== item.quantity && (
                                                <div className="text-[11px] text-[var(--theme-text-secondary)] font-normal">({item.quantity} {t('warehouse.pkgs') || 'pkgs'})</div>
                                            )}
                                        </td>
                                        <td className="p-3 md:p-4 text-center font-semibold text-[var(--theme-text-primary)] tabular-nums font-mono text-xs md:text-sm">
                                            {item.received}
                                            {(item.unitsPerOrderUnit || 1) > 1 && (
                                                <div className="text-[11px] text-[var(--theme-text-secondary)] font-normal">
                                                    ({Math.round((item.received / item.unitsPerOrderUnit) * 10) / 10} {t('warehouse.pkgs') || 'pkgs'})
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 md:p-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${item.status === 'Complete' ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]' :
                                                item.status === 'Partial' ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]' :
                                                    'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                                }`}>
                                                {item.status === 'Complete' ? (t('warehouse.statusComplete') || 'Complete') : item.status === 'Partial' ? (t('warehouse.statusPartial') || 'Partial') : (t('warehouse.statusPending') || item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-col md:flex-row gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs uppercase tracking-wider font-semibold min-h-[44px] transition-colors order-2 md:order-1"
                        disabled={isSubmitting}
                    >
                        {t('warehouse.dismiss')}
                    </button>
                    <button
                        onClick={onFinalize}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-8 py-3 rounded-xl bg-[var(--theme-status-info-bg)] bg-[var(--theme-status-info-bg)] active:scale-95 text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-2 transition-all order-1 md:order-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{t('warehouse.processingStatus')}...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                {isFullyReceived ? t('warehouse.finalizeManifest') : t('warehouse.confirmPartialReceipt')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
