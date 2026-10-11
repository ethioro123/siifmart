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
                    approvalRole: returnType === 'procurement' ? 'procurement_manager' : 'warehouse_manager'
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
                        addNotification('info', `${activeDownstream.length} active job(s) cancelled due to return`);
                    }
                } catch (markErr: any) {
                    logger.error('ReturnToWarehouseModal', 'Failed to mark job items as returned:', markErr);
                }
            }

            setStep('done');
            addNotification('success', `${selectedItems.length} item(s) submitted for return approval`);
        } catch (err: any) {
            addNotification('alert', 'Failed to submit return: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Undo2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight leading-tight">
                                {returnType === 'procurement' ? 'Return to Supplier / Warehouse' : 'Return to Warehouse'}
                            </h2>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono uppercase mt-0.5">Job {formatJobId(job)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] rounded-xl transition-colors shrink-0 touch-manipulation"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                    {step === 'done' ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-5">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-xs">
                                <CheckCircle className="text-emerald-500" size={36} />
                            </div>
                            <div className="text-center space-y-1.5">
                                <h3 className="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">{t('warehouse.driverHub.jobCompletedSuccess') || 'Return Submitted'}</h3>
                                <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm">
                                    {selectedItems.length} item(s) are now pending {returnType === 'procurement' ? 'procurement manager' : 'warehouse manager'} approval.
                                </p>
                                <p className="text-[var(--theme-text-secondary)] text-[11px]">
                                    Once approved, stock will be added back to the warehouse inventory.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="min-h-[44px] px-8 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-xs touch-manipulation active:scale-[0.99]"
                            >
                                {t('warehouse.driverHub.done') || 'Done'}
                            </button>
                        </div>
                    ) : step === 'confirm' ? (
                        <>
                            {/* Confirm Step */}
                            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
                                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                <p className="text-amber-600 dark:text-amber-300 text-xs sm:text-sm font-semibold leading-snug">
                                    This will create <span className="font-bold text-[var(--theme-text-primary)]">{selectedItems.length}</span> pending stock adjustment(s) requiring {returnType === 'procurement' ? 'procurement manager / super admin' : 'warehouse manager'} approval.
                                </p>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl overflow-x-auto custom-scrollbar">
                                <table className="w-full min-w-[500px] text-left text-sm">
                                    <thead className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] uppercase font-semibold tracking-wider border-b border-[var(--theme-border)]">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3">Reason</th>
                                            <th className="px-4 py-3">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--theme-border)]">
                                        {selectedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--theme-bg-card)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="text-[var(--theme-text-primary)] font-bold text-sm">{item.name}</p>
                                                    <p className="text-[var(--theme-text-secondary)] text-[11px] font-mono">{item.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs tabular-nums">
                                                        {item.returnQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[var(--theme-text-secondary)] text-xs">{item.reason}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${item.condition === 'Good' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                        item.condition === 'Damaged' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                                                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                        {item.condition}
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
                            <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm">Select items to return to warehouse inventory. A stock adjustment will be created pending manager approval.</p>

                            <div className="space-y-3">
                                {returnItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`border rounded-xl p-3 sm:p-4 transition-all ${item.selected
                                            ? 'bg-primary/5 border-primary/40'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:border-[var(--theme-text-secondary)]/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => handleToggle(idx)}
                                                className="w-5 h-5 accent-primary cursor-pointer shrink-0 touch-manipulation"
                                                aria-label={`Select ${item.name}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[var(--theme-text-primary)] font-bold truncate">{item.name}</p>
                                                <p className="text-[var(--theme-text-secondary)] text-[11px] font-mono">{item.sku}</p>
                                            </div>
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums whitespace-nowrap">
                                                {returnType === 'procurement' ? 'Received' : 'Picked'}: {item.maxQty}
                                            </span>
                                        </div>

                                        {item.selected && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--theme-border)]">
                                                <div>
                                                    <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1 tracking-wider">Return Qty</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={item.maxQty}
                                                        value={item.returnQty}
                                                        onChange={(e) => {
                                                            const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.maxQty);
                                                            handleFieldChange(idx, 'returnQty', val);
                                                        }}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm font-mono font-bold focus:border-primary focus:outline-none transition-colors touch-manipulation tabular-nums"
                                                        aria-label="Return Quantity"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1 tracking-wider">Reason</label>
                                                    <select
                                                        value={item.reason}
                                                        onChange={(e) => handleFieldChange(idx, 'reason', e.target.value)}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary focus:outline-none transition-colors touch-manipulation"
                                                        aria-label="Return Reason"
                                                    >
                                                        {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1 tracking-wider">Condition</label>
                                                    <select
                                                        value={item.condition}
                                                        onChange={(e) => handleFieldChange(idx, 'condition', e.target.value)}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary focus:outline-none transition-colors touch-manipulation"
                                                        aria-label="Item Condition"
                                                    >
                                                        {RETURN_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
                            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] font-semibold text-xs uppercase tracking-wider transition-all touch-manipulation"
                        >
                            {step === 'confirm' ? 'Back' : 'Cancel'}
                        </button>

                        {step === 'select' ? (
                            <button
                                disabled={selectedItems.length === 0}
                                onClick={() => setStep('confirm')}
                                className={`min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 touch-manipulation ${selectedItems.length > 0
                                    ? 'bg-primary hover:opacity-90 text-white shadow-xs active:scale-[0.99] cursor-pointer'
                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                                    }`}
                            >
                                <Package size={16} />
                                Review ({selectedItems.length})
                            </button>
                        ) : (
                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 touch-manipulation active:scale-[0.99] cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
