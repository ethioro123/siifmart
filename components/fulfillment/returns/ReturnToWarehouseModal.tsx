import React, { useState } from 'react';
import { X, Package, Undo2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCreateInventoryRequestMutation } from '../../../hooks/useInventoryRequestMutations';
import { logger } from '../../../utils/logger';

interface ReturnToWarehouseModalProps {
    job: WMSJob;
    products: Product[];
    user: any;
    onClose: () => void;
    addNotification: (type: string, message: string) => void;
    inventoryRequestsService?: any;
    wmsJobsService?: any;
    jobs?: WMSJob[];
    returnType?: 'warehouse' | 'procurement';
}

const RETURN_REASONS = [
    'Wrong Item Picked',
    'Damaged',
    'Overstock',
    'Customer Refused',
    'Quality Issue',
    'Expired'
];

const RETURN_CONDITIONS = ['Good', 'Damaged', 'Expired'];

const getReasonLabel = (reason: string, t: any) => {
    switch (reason) {
        case 'Wrong Item Picked': return t('warehouse.reasonWrongItemPicked');
        case 'Damaged': return t('warehouse.conditionDamaged');
        case 'Overstock': return t('warehouse.reasonOverstock');
        case 'Customer Refused': return t('warehouse.reasonCustomerRefused');
        case 'Quality Issue': return t('warehouse.reasonQualityIssue');
        case 'Expired': return t('warehouse.conditionExpired');
        default: return reason;
    }
};

const getConditionLabel = (condition: string, t: any) => {
    switch (condition) {
        case 'Good': return t('warehouse.conditionGood');
        case 'Damaged': return t('warehouse.conditionDamaged');
        case 'Expired': return t('warehouse.conditionExpired');
        default: return condition;
    }
};

interface ReturnItem {
    productId: string;
    name: string;
    sku: string;
    maxQty: number;
    returnQty: number;
    reason: string;
    condition: string;
    selected: boolean;
}

export const ReturnToWarehouseModal: React.FC<ReturnToWarehouseModalProps> = ({
    job,
    products,
    user,
    onClose,
    addNotification,
    wmsJobsService,
    jobs = [],
    returnType = 'warehouse'
}) => {
    const { t } = useLanguage();
    const createRequestMutation = useCreateInventoryRequestMutation();
    const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [returnItems, setReturnItems] = useState<ReturnItem[]>(() => {
        return (job.lineItems || []).map((item: any) => ({
            productId: item.productId,
            name: item.name || 'Unknown',
            sku: item.sku || '',
            maxQty: item.pickedQty || item.receivedQty || item.expectedQty || item.quantity || 1,
            returnQty: item.pickedQty || item.receivedQty || item.expectedQty || item.quantity || 1,
            reason: RETURN_REASONS[0],
            condition: RETURN_CONDITIONS[0],
            selected: false
        }));
    });

    const selectedItems = returnItems.filter(i => i.selected);

    const handleToggle = (idx: number) => {
        setReturnItems(prev => prev.map((item, i) =>
            i === idx ? { ...item, selected: !item.selected } : item
        ));
    };

    const handleFieldChange = (idx: number, field: keyof ReturnItem, value: any) => {
        setReturnItems(prev => prev.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item
        ));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;
        setIsSubmitting(true);

        try {
            for (const item of selectedItems) {
                const product = products.find(p => p.id === item.productId || p.sku === item.sku);
                const siteId = job.siteId || (job as any).site_id || product?.siteId || product?.site_id || user?.siteId || '';

                const request: any = {
                    productId: item.productId,
                    productName: item.name,
                    productSku: item.sku,
                    siteId,
                    changeType: 'stock_adjustment',
                    requestedBy: user?.name || 'WMS',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    adjustmentType: 'IN',
                    adjustmentQty: item.returnQty,
                    adjustmentReason: returnType === 'procurement'
                        ? `PO-RTN: ${item.reason} (${item.condition}) — PO ${formatJobId(job)} [REQUIRES PROCUREMENT APPROVAL]`
                        : `RTW: ${item.reason} (${item.condition}) — Job ${formatJobId(job)}`,
                    approvalRole: returnType === 'procurement' ? 'country_commercial_director' : 'warehouse_manager'
                };

                await createRequestMutation.mutateAsync(request);
            }

            // --- MARK SOURCE JOB LINE ITEMS AS RETURNED ---
            if (wmsJobsService) {
                try {
                    const now = new Date().toISOString();
                    const updatedLineItems = (job.lineItems || []).map((li: any) => {
                        const returned = selectedItems.find(si => si.productId === li.productId || si.sku === li.sku);
                        if (returned) {
                            return {
                                ...li,
                                returnedQty: (li.returnedQty || 0) + returned.returnQty,
                                returnedAt: now
                            };
                        }
                        return li;
                    });

                    await wmsJobsService.update(job.id, {
                        lineItems: updatedLineItems,
                        notes: `${job.notes || ''}\n[RTW] ${selectedItems.length} item(s) returned on ${new Date().toLocaleDateString()}`.trim()
                    });

                    // --- CANCEL ACTIVE DOWNSTREAM JOBS ---
                    const returnedProductIds = new Set(selectedItems.map(si => si.productId));
                    const returnedSkus = new Set(selectedItems.map(si => si.sku));
                    const activeDownstream = jobs.filter(j =>
                        j.id !== job.id &&
                        (j.status === 'Pending' || j.status === 'In-Progress') &&
                        j.orderRef === job.orderRef &&
                        (j.lineItems || []).some((li: any) =>
                            returnedProductIds.has(li.productId) || returnedSkus.has(li.sku)
                        )
                    );

                    for (const downstream of activeDownstream) {
                        await wmsJobsService.update(downstream.id, {
                            status: 'Cancelled',
                            notes: `Auto-cancelled: items returned via RTW from ${formatJobId(job)}`
                        });
                    }

                    if (activeDownstream.length > 0) {
                        addNotification('info', t('warehouse.activeJobsCancelledNotice', { count: activeDownstream.length }));
                    }
                } catch (markErr: any) {
                    logger.error('ReturnToWarehouseModal', 'Failed to mark job items as returned:', markErr);
                }
            }

            setStep('done');
            addNotification('success', t('warehouse.itemsSubmittedForReturnApproval', { count: selectedItems.length }));
        } catch (err: any) {
            addNotification('alert', t('warehouse.failedToSubmitReturn') + (err.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-2xl max-h-[90vh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col isolate overflow-hidden">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-center justify-center text-[var(--theme-status-warning-text)] shrink-0">
                            <Undo2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight leading-tight">
                                {returnType === 'procurement' ? t('warehouse.returnToSupplierWarehouseTitle') : t('warehouse.returnToWarehouseTitle')}
                            </h2>
                            <p className="text-xs text-[var(--theme-text-secondary)] font-mono mt-0.5">{t('warehouse.jobPrefix', { id: formatJobId(job) })}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] rounded-full transition-colors shrink-0 touch-manipulation cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                    {step === 'done' ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-5">
                            <div className="w-16 h-16 bg-[var(--theme-status-success-bg)] rounded-2xl flex items-center justify-center border border-[var(--theme-status-success-border)]">
                                <CheckCircle className="text-[var(--theme-status-success-text)]" size={32} />
                            </div>
                            <div className="text-center space-y-1.5">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">{t('warehouse.returnSubmittedTitle')}</h3>
                                <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm">
                                    {t('warehouse.itemsPendingApprovalNotice', { count: selectedItems.length, role: returnType === 'procurement' ? t('warehouse.procurementManagerRole') : t('warehouse.warehouseManagerRole') })}
                                </p>
                                <p className="text-[var(--theme-text-muted)] text-xs">
                                    {t('warehouse.onceApprovedStockAddedNotice')}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="min-h-[44px] px-8 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-xl font-semibold text-xs transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                            >
                                {t('warehouse.doneWord')}
                            </button>
                        </div>
                    ) : step === 'confirm' ? (
                        <>
                            {/* Confirm Step */}
                            <div className="flex items-center gap-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl p-3.5">
                                <AlertTriangle className="text-[var(--theme-status-warning-text)] shrink-0" size={18} />
                                <p className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-xs sm:text-sm font-semibold leading-snug">
                                    {t('warehouse.confirmReturnStockAdjustmentWarning', { count: selectedItems.length, role: returnType === 'procurement' ? t('warehouse.procurementOrSuperAdminRole') : t('warehouse.warehouseManagerRole') })}
                                </p>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl overflow-x-auto custom-scrollbar">
                                <table className="w-full min-w-[500px] text-left text-sm">
                                    <thead className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] uppercase font-semibold tracking-wider border-b border-[var(--theme-border)]">
                                        <tr>
                                            <th className="px-4 py-3">{t('warehouse.productHeader')}</th>
                                            <th className="px-4 py-3 text-center">{t('warehouse.qtyHeader')}</th>
                                            <th className="px-4 py-3">{t('warehouse.reasonHeader')}</th>
                                            <th className="px-4 py-3">{t('warehouse.conditionHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--theme-border)]">
                                        {selectedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--theme-bg-card)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="text-[var(--theme-text-primary)] font-semibold text-xs sm:text-sm">{item.name}</p>
                                                    <p className="text-[var(--theme-text-secondary)] text-[11px] font-mono">{item.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-mono font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] px-2 py-0.5 rounded-full border border-[var(--theme-status-warning-border)] text-xs tabular-nums">
                                                        {item.returnQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[var(--theme-text-secondary)] text-xs">{getReasonLabel(item.reason, t)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${item.condition === 'Good' ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]' :
                                                        item.condition === 'Damaged' ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' :
                                                            'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'
                                                        }`}>
                                                        {getConditionLabel(item.condition, t)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Select Step */}
                            <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm">{t('warehouse.returnModalInstructions')}</p>

                            <div className="space-y-3">
                                {returnItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`border rounded-2xl p-3 sm:p-4 transition-all ${item.selected
                                            ? 'bg-[var(--theme-primary)]/5 border-[var(--theme-primary)]/40 ring-1 ring-[var(--theme-primary)]/20'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:border-[var(--theme-border)]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => handleToggle(idx)}
                                                className="w-5 h-5 accent-[var(--theme-primary)] cursor-pointer shrink-0 touch-manipulation"
                                                aria-label={`Select ${item.name}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[var(--theme-text-primary)] font-semibold truncate">{item.name}</p>
                                                <p className="text-[var(--theme-text-secondary)] text-[11px] font-mono">{item.sku}</p>
                                            </div>
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums whitespace-nowrap">
                                                {returnType === 'procurement' ? t('warehouse.receivedQtyPrefix', { qty: item.maxQty }) : t('warehouse.pickedQtyPrefix', { qty: item.maxQty })}
                                            </span>
                                        </div>

                                        {item.selected && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--theme-border)]">
                                                <div>
                                                    <label className="text-xs text-[var(--theme-text-secondary)] font-medium block mb-1">{t('warehouse.returnQtyLabel')}</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={item.maxQty}
                                                        value={item.returnQty}
                                                        onChange={(e) => {
                                                            const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.maxQty);
                                                            handleFieldChange(idx, 'returnQty', val);
                                                        }}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm font-mono font-bold focus:border-[var(--theme-primary)] focus:outline-none transition-colors touch-manipulation tabular-nums"
                                                        aria-label={t('warehouse.returnQtyLabel')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-[var(--theme-text-secondary)] font-medium block mb-1">{t('warehouse.reasonLabel')}</label>
                                                    <select
                                                        value={item.reason}
                                                        onChange={(e) => handleFieldChange(idx, 'reason', e.target.value)}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-[var(--theme-primary)] focus:outline-none transition-colors touch-manipulation"
                                                        aria-label={t('warehouse.reasonLabel')}
                                                    >
                                                        {RETURN_REASONS.map(r => <option key={r} value={r}>{getReasonLabel(r, t)}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-[var(--theme-text-secondary)] font-medium block mb-1">{t('warehouse.conditionLabel')}</label>
                                                    <select
                                                        value={item.condition}
                                                        onChange={(e) => handleFieldChange(idx, 'condition', e.target.value)}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-[var(--theme-primary)] focus:outline-none transition-colors touch-manipulation"
                                                        aria-label={t('warehouse.conditionLabel')}
                                                    >
                                                        {RETURN_CONDITIONS.map(c => <option key={c} value={c}>{getConditionLabel(c, t)}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {step !== 'done' && (
                    <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-between shrink-0">
                        <button
                            onClick={step === 'confirm' ? () => setStep('select') : onClose}
                            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] font-semibold text-xs transition-all touch-manipulation cursor-pointer"
                        >
                            {step === 'confirm' ? t('warehouse.backWord') : t('warehouse.cancelWord')}
                        </button>

                        {step === 'select' ? (
                            <button
                                disabled={selectedItems.length === 0}
                                onClick={() => setStep('confirm')}
                                className={`min-h-[44px] px-6 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 touch-manipulation ${selectedItems.length > 0
                                    ? 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] shadow-sm active:scale-[0.98] cursor-pointer'
                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                                    }`}
                            >
                                <Package size={16} />
                                {t('warehouse.reviewCountButton', { count: selectedItems.length })}
                            </button>
                        ) : (
                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] font-semibold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                                {isSubmitting ? t('warehouse.submittingWord') : t('warehouse.submitForApprovalButton')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
