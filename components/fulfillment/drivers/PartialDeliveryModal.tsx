import React, { useState, useEffect, useRef } from 'react';
import {
    X, Truck, CheckCircle, Loader2,
    Package, ArrowRight, ArrowLeft
} from 'lucide-react';
import { WMSJob, User, Product, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useShipmentWorkflow } from '../../../hooks/useShipmentWorkflow';
import { resolvePickProduct } from '../../../utils/pickProgress';
import { getShipmentQuantity } from '../../../utils/shipmentWorkflow';

type RejectReason = 'customer_refused' | 'damaged_in_transit' | 'address_not_found' | 'partial_acceptance' | 'other';

interface DeliveryLine {
    index: number;
    name: string;
    sku: string;
    productId: string;
    dispatched: number;       // qty that left warehouse
    delivered: string;        // what driver actually delivered (controlled input)
    unit?: string;
}

interface PartialDeliveryModalProps {
    t: (key: string) => string;
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    products: Product[];
    sites: Site[];
    addNotification: (type: 'success' | 'alert' | 'info', msg: string) => void;
    refreshData: () => Promise<void>;
    refreshJobs?: () => void;
}

const REJECT_REASONS: { id: RejectReason; label: string; desc: string }[] = [
    { id: 'customer_refused', label: 'Customer Refused', desc: 'Store manager declined full delivery' },
    { id: 'damaged_in_transit', label: 'Damaged in Transit', desc: 'Items damaged before delivery' },
    { id: 'address_not_found', label: 'Address / Access Issue', desc: 'Could not access the delivery point' },
    { id: 'partial_acceptance', label: 'Partial Acceptance', desc: 'Store accepted only some items' },
    { id: 'other', label: 'Other', desc: 'See notes field' },
];

export const PartialDeliveryModal: React.FC<PartialDeliveryModalProps> = ({
    t,
    isOpen,
    onClose,
    job,
    user,
    products,
    sites,
    addNotification,
    refreshData,
    refreshJobs,
}) => {
    const saveLock = useRef(false);
    const initializedJob = useRef<string | null>(null);
    const workflow = useShipmentWorkflow(refreshData);
    const dynamicReasons = [
        { id: 'customer_refused', label: t('warehouse.driverHub.rejectReasonCustomerRefused'), desc: t('warehouse.driverHub.rejectReasonCustomerRefusedDesc') },
        { id: 'damaged_in_transit', label: t('warehouse.driverHub.rejectReasonDamaged'), desc: t('warehouse.driverHub.rejectReasonDamagedDesc') },
        { id: 'address_not_found', label: t('warehouse.driverHub.rejectReasonAddress'), desc: t('warehouse.driverHub.rejectReasonAddressDesc') },
        { id: 'partial_acceptance', label: t('warehouse.driverHub.rejectReasonPartial'), desc: t('warehouse.driverHub.rejectReasonPartialDesc') },
        { id: 'other', label: t('warehouse.driverHub.other'), desc: t('warehouse.driverHub.notes') }
    ];

    const [lines, setLines] = useState<DeliveryLine[]>([]);
    const [rejectReason, setRejectReason] = useState<RejectReason>('partial_acceptance');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'QUANTITIES' | 'REASON' | 'DONE'>('QUANTITIES');

    const destSite = sites.find(s => s.id === (job?.destSiteId || (job as any)?.dest_site_id));

    useEffect(() => {
        if (!isOpen) { initializedJob.current = null; return; }
        if (!job?.lineItems || initializedJob.current === job.id) return;
        initializedJob.current = job.id;
        setStep('QUANTITIES');
        setNotes('');
        setRejectReason('partial_acceptance');
        setLines(
            (job.lineItems as any[]).map((item: any, idx: number) => {
                const templateProduct = resolvePickProduct(products,item,job.sourceSiteId || job.siteId);
                const qty = getShipmentQuantity(item);
                return {
                    index: idx,
                    name: item.name || templateProduct?.name || 'Unknown',
                    sku: item.sku || templateProduct?.sku || '',
                    productId: item.productId || templateProduct?.id || '',
                    dispatched: qty,
                    delivered: String(qty),
                    unit: templateProduct?.unit || item.unit,
                };
            })
        );
    }, [isOpen, job, products]);

    if (!isOpen || !job) return null;

    const hasUndelivered = lines.some(l => {
        const v = Number(l.delivered);
        return !isNaN(v) && v < l.dispatched;
    });

    const totalDelivered = lines.reduce((sum, l) => sum + (Number(l.delivered) || 0), 0);
    const totalDispatched = lines.reduce((sum, l) => sum + l.dispatched, 0);

    const setLineDelivered = (idx: number, val: string) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, delivered: val } : l));
    };

    const handleConfirm = async () => {
        if (saveLock.current) return;
        saveLock.current = true;
        setIsSubmitting(true);
        try {
            const hasUndelivered = lines.some(l => {
                const v = Number(l.delivered);
                return !isNaN(v) && v < l.dispatched;
            });

            const auditNote = hasUndelivered
                ? `[PARTIAL DELIVERY by ${user?.name || 'Driver'} at ${new Date().toLocaleString()}] Reason: ${REJECT_REASONS.find(r => r.id === rejectReason)?.label || rejectReason}. ${notes}`
                : `[DELIVERY by ${user?.name || 'Driver'} at ${new Date().toLocaleString()}] ${notes}`;

            await workflow.mutateAsync({ job, action: {
                type: 'arrive',
                delivered: lines.map(line => line.delivered.trim() ? Number(line.delivered) : Number.NaN),
                note: auditNote
            } });

            if (refreshJobs) {
                refreshJobs();
            }
            setStep('DONE');
            addNotification('info', t('warehouse.driverHub.arrivalRecordedNotice'));
        } catch (err: any) {
            addNotification('alert', 'Delivery failed: ' + (err?.message || 'Unknown error'));
        } finally {
            saveLock.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] flex items-center justify-center z-[400] p-3 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh] isolate overflow-hidden relative">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                            <Truck size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                {hasUndelivered ? t('warehouse.driverHub.partialDelivery') : t('warehouse.driverHub.confirmArrival')}
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] font-mono mt-0.5">
                                {formatJobId(job)} → {destSite?.name || t('warehouse.driverHub.localHub')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={t('warehouse.driverHub.close')}
                        title={t('warehouse.driverHub.close')}
                        className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--theme-bg-card)] rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0 touch-manipulation"
                    >
                        <X size={18} />
                    </button>
                </div>

                {step === 'DONE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-y-auto custom-scrollbar">
                        <div className="w-14 h-14 bg-[var(--theme-status-success-bg)] rounded-2xl flex items-center justify-center border border-[var(--theme-status-success-border)] mb-4">
                            <CheckCircle size={30} className="text-[var(--theme-status-success-text)]" />
                        </div>
                        <h4 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight mb-2">
                            {hasUndelivered ? t('warehouse.driverHub.arrivalRecordedTitle') : t('warehouse.driverHub.arrivalRecordedTitle')}
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] max-w-xs leading-relaxed">
                            <strong className="text-[var(--theme-status-success-text)] font-mono tabular-nums">{totalDelivered}</strong> {t('warehouse.driverHub.to')} <strong className="text-[var(--theme-text-primary)] font-mono tabular-nums">{totalDispatched}</strong> {t('warehouse.driverHub.units').toLowerCase()} {t('warehouse.driverHub.arrived').toLowerCase()} {t('warehouse.driverHub.to').toLowerCase()} {destSite?.name || t('warehouse.driverHub.localHub')}.
                        </p>
                        <p className="text-[11px] text-[var(--theme-text-muted)] mt-2">{t('warehouse.driverHub.arrivalRecordedNotice')}</p>
                        <button
                            onClick={onClose}
                            className="mt-6 min-h-[44px] px-8 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-semibold text-xs rounded-xl transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                        >
                            {t('warehouse.driverHub.done')}
                        </button>
                    </div>
                ) : step === 'QUANTITIES' ? (
                    <>
                        {/* Progress summary */}
                        <div className="mx-4 sm:mx-5 mt-4 p-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-xs font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">{t('warehouse.driverHub.delivering')}</p>
                                <p className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">{totalDelivered} <span className="text-xs text-[var(--theme-text-muted)] font-normal">/ {totalDispatched}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-[var(--theme-text-secondary)]">{t('warehouse.driverHub.to')}</p>
                                <p className="text-xs sm:text-sm font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] truncate max-w-[180px]">{destSite?.name || t('warehouse.driverHub.localHub')}</p>
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
                            <p className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">{t('warehouse.driverHub.deliveredQuantities')}</p>
                            {lines.map((line, i) => {
                                const deliveredVal = Number(line.delivered);
                                const isShort = !isNaN(deliveredVal) && deliveredVal < line.dispatched;
                                const isFull = !isNaN(deliveredVal) && deliveredVal === line.dispatched;
                                return (
                                    <div key={i} className={`p-3.5 sm:p-4 rounded-2xl border transition-colors ${isShort ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]' : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isFull ? 'bg-[var(--theme-status-success-bg)]' : isShort ? 'bg-[var(--theme-status-warning-bg)]' : 'bg-[var(--theme-bg-card)]'}`}>
                                                    <Package size={16} className={isFull ? 'text-[var(--theme-status-success-text)]' : isShort ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-text-muted)]'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{line.name}</p>
                                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)]">{line.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-[var(--theme-border)] sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                                                <div className="text-left sm:text-center">
                                                    <p className="text-[11px] font-medium text-[var(--theme-text-muted)]">{t('warehouse.driverHub.dispatched')}</p>
                                                    <p className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-[var(--theme-text-secondary)]">{line.dispatched}</p>
                                                </div>
                                                <ArrowRight size={14} className={isShort ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-text-muted)]'} />
                                                <div className="text-right sm:text-center flex items-center gap-2 sm:block">
                                                    <p className="text-[11px] font-medium text-[var(--theme-text-muted)] sm:mb-1">{t('warehouse.driverHub.delivered')}</p>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        pattern="[0-9]*"
                                                        min={0}
                                                        max={line.dispatched}
                                                        value={line.delivered}
                                                        aria-label={t('warehouse.driverHub.deliveredQuantities')}
                                                        title={t('warehouse.driverHub.deliveredQuantities')}
                                                        onChange={e => setLineDelivered(i, e.target.value)}
                                                        className={`w-16 min-h-[38px] text-center text-xs font-bold font-mono tabular-nums border rounded-xl px-2 py-1 focus:outline-none transition-colors ${isShort
                                                            ? 'border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                                            : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] focus:border-[var(--theme-primary)]'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {isShort && (
                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[11px] font-medium text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] px-2.5 py-0.5 rounded-full border border-[var(--theme-status-warning-border)]">
                                                    {line.dispatched - (deliveredVal || 0)} {t('warehouse.driverHub.undeliveredReturned')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] flex justify-between items-center shrink-0">
                            <button
                                onClick={onClose}
                                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors touch-manipulation"
                            >
                                {t('warehouse.driverHub.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (hasUndelivered) {
                                        setStep('REASON');
                                    } else {
                                        handleConfirm();
                                    }
                                }}
                                disabled={isSubmitting}
                                className={`min-h-[44px] px-6 sm:px-8 py-2.5 ${hasUndelivered ? 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)]' : 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)]'} font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-[0.98] touch-manipulation cursor-pointer`}
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={14} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                ) : hasUndelivered ? (
                                    <>{t('warehouse.driverHub.next')} <ArrowRight size={14} /></>
                                ) : (
                                    <>{t('warehouse.driverHub.confirmArrival')} <CheckCircle size={14} /></>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* REASON STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                            <p className="text-xs font-semibold text-[var(--theme-text-secondary)]">{t('warehouse.driverHub.whyPartialDelivery')}</p>
                            <div className="space-y-2">
                                {dynamicReasons.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRejectReason(r.id as any)}
                                        className={`w-full flex items-center gap-3 p-3 min-h-[44px] rounded-xl border text-left transition-all active:scale-[0.98] touch-manipulation ${rejectReason === r.id
                                            ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${rejectReason === r.id ? 'border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)]' : 'border-[var(--theme-border)]'}`} />
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{r.label}</p>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">{r.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1.5">{t('warehouse.driverHub.driverNotes')}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t('warehouse.driverHub.driverNotes')}
                                    aria-label={t('warehouse.driverHub.driverNotes')}
                                    title={t('warehouse.driverHub.driverNotes')}
                                    rows={3}
                                    className="w-full text-xs border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] rounded-xl px-3 sm:px-4 py-2.5 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none border-[var(--theme-status-warning-border)] focus:ring-1 ring-[var(--theme-status-warning-border)] transition-colors resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('QUANTITIES')}
                                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors touch-manipulation flex items-center gap-1.5"
                            >
                                <ArrowLeft size={14} />
                                {t('warehouse.driverHub.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="min-h-[44px] px-6 sm:px-8 py-2.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] disabled:opacity-50 text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-[0.98] touch-manipulation"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={14} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                    : <><CheckCircle size={14} /> {t('warehouse.driverHub.confirmPartialDelivery')}</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
