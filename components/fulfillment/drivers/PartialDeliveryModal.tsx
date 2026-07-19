import React, { useState, useEffect } from 'react';
import {
    X, Truck, AlertTriangle, CheckCircle, Loader2,
    Package, ArrowRight, ShieldAlert
} from 'lucide-react';
import { WMSJob, User, Product, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { isWeightBased, isVolumeBased } from '../../../utils/units';

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
    wmsJobsService: any;
    adjustStockMutation: any;
    addProduct: any;
    addNotification: (type: 'success' | 'alert' | 'info', msg: string) => void;
    refreshData: () => Promise<void>;
    refreshJobs?: () => void;
    jobs: WMSJob[];
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
    wmsJobsService,
    adjustStockMutation,
    addProduct,
    addNotification,
    refreshData,
    refreshJobs,
    jobs,
}) => {
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
        if (!isOpen || !job?.lineItems) return;
        setStep('QUANTITIES');
        setNotes('');
        setRejectReason('partial_acceptance');
        setLines(
            (job.lineItems as any[]).map((item: any, idx: number) => {
                const templateProduct = products.find(p => p.sku === item.sku || p.id === item.productId);
                const qty = item.receivedQty ?? item.pickedQty ?? item.expectedQty ?? item.quantity ?? 0;
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
        const v = parseInt(l.delivered);
        return !isNaN(v) && v < l.dispatched;
    });

    const totalDelivered = lines.reduce((sum, l) => sum + (parseInt(l.delivered) || 0), 0);
    const totalDispatched = lines.reduce((sum, l) => sum + l.dispatched, 0);

    const setLineDelivered = (idx: number, val: string) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, delivered: val } : l));
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const destSiteId = job.destSiteId || (job as any).dest_site_id;
            const hasUndelivered = lines.some(l => {
                const v = parseInt(l.delivered);
                return !isNaN(v) && v < l.dispatched;
            });

            const auditNote = hasUndelivered
                ? `[PARTIAL DELIVERY by ${user?.name || 'Driver'} at ${new Date().toLocaleString()}] Reason: ${REJECT_REASONS.find(r => r.id === rejectReason)?.label || rejectReason}. ${notes}`
                : `[DELIVERY by ${user?.name || 'Driver'} at ${new Date().toLocaleString()}] ${notes}`;

            const finalStatus = 'In-Progress';
            const finalTransferStatus = hasUndelivered ? 'Partially Delivered' : 'Delivered';

            // Build updated line items
            const updatedLineItems = (job.lineItems as any[]).map((item: any, idx: number) => {
                const line = lines[idx];
                const deliveredQty = parseInt(line.delivered) ?? line.dispatched;
                return {
                    ...item,
                    deliveredQty,
                    undeliveredQty: line.dispatched - deliveredQty,
                };
            });

            // 1. Mark job as Completed and Delivered/Partially Delivered
            await wmsJobsService.update(job.id, {
                status: finalStatus,
                transferStatus: finalTransferStatus,
                deliveredAt: new Date().toISOString(),
                receivedBy: user?.name || 'Driver',
                lineItems: updatedLineItems,
                notes: job.notes ? `${job.notes}\n${auditNote}` : auditNote,
                hasDiscrepancy: hasUndelivered,
            } as any);

            // 2. Update parent Transfer job if linked
            if (job.orderRef) {
                const parentJob = jobs.find(j => j.id === job.orderRef);
                if (parentJob) {
                    await wmsJobsService.update(parentJob.id, {
                        status: 'Completed',
                        transferStatus: finalTransferStatus,
                    } as any);
                }
            }

            await refreshData();
            if (refreshJobs) {
                refreshJobs();
            }
            setStep('DONE');
            addNotification('info', `${hasUndelivered ? 'Partial delivery' : 'Delivery'} logged for ${formatJobId(job)}. ${totalDelivered}/${totalDispatched} units credited to ${destSite?.name || 'store'}.`);
        } catch (err: any) {
            addNotification('alert', 'Delivery failed: ' + (err?.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[400] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[#0e0e10] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 shrink-0">
                            <Truck size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2] sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
                                {hasUndelivered ? t('warehouse.driverHub.partialDelivery') : 'Confirm Delivery'}
                            </h3>
                            <p className="text-[9px] sm:text-[10px] text-gray-550 font-mono uppercase tracking-widest mt-0.5">
                                {formatJobId(job)} → {destSite?.name || t('warehouse.driverHub.localHub')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label={t('warehouse.driverHub.close')} title={t('warehouse.driverHub.close')} className="p-2 hover:bg-white/5 rounded-full transition-colors shrink-0">
                        <X size={16} className="text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    </button>
                </div>

                {step === 'DONE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-y-auto">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/15 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4">
                            <CheckCircle size={28} className="text-emerald-400 sm:w-[32px] sm:h-[32px]" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest mb-2">
                            {hasUndelivered ? t('warehouse.driverHub.partialDeliveryLogged') : 'Delivery Completed Successfully'}
                        </h4>
                        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                            <strong className="text-emerald-400">{totalDelivered}</strong> {t('warehouse.driverHub.to')} <strong className="text-white">{totalDispatched}</strong> {t('warehouse.driverHub.units').toLowerCase()} {t('warehouse.driverHub.delivered').toLowerCase()} {t('warehouse.driverHub.to').toLowerCase()} {destSite?.name || t('warehouse.driverHub.localHub')}.
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-gray-650 mt-2">All inventory levels have been adjusted.</p>
                        <button
                            onClick={onClose}
                            className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#2C5E3B] hover:bg-[#224429] dark:bg-[#A9CBA2] dark:hover:bg-[#8eb886] dark:text-[#1C2620] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                            {t('warehouse.driverHub.done')}
                        </button>
                    </div>
                ) : step === 'QUANTITIES' ? (
                    <>
                        {/* Progress summary */}
                        <div className="mx-4 sm:mx-5 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-[8px] sm:text-[9px] font-black text-amber-400 uppercase tracking-widest">{t('warehouse.driverHub.delivering')}</p>
                                <p className="text-base sm:text-lg font-black text-white font-mono">{totalDelivered} <span className="text-xs text-gray-500 font-normal">/ {totalDispatched}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest">{t('warehouse.driverHub.to')}</p>
                                <p className="text-xs sm:text-sm font-black text-amber-400 uppercase">{destSite?.name || t('warehouse.driverHub.localHub')}</p>
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
                            <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 sm:mb-2">{t('warehouse.driverHub.deliveredQuantities')}</p>
                            {lines.map((line, i) => {
                                const deliveredVal = parseInt(line.delivered);
                                const isShort = !isNaN(deliveredVal) && deliveredVal < line.dispatched;
                                const isFull = !isNaN(deliveredVal) && deliveredVal === line.dispatched;
                                return (
                                    <div key={i} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${isShort ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFull ? 'bg-green-500/15' : isShort ? 'bg-amber-500/15' : 'bg-white/5'}`}>
                                                    <Package size={14} className={isFull ? 'text-green-400' : isShort ? 'text-amber-400' : 'text-gray-505'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-white uppercase truncate">{line.name}</p>
                                                    <p className="text-[9px] font-mono text-gray-500">{line.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                                                <div className="text-left sm:text-center">
                                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{t('warehouse.driverHub.dispatched')}</p>
                                                    <p className="text-xs sm:text-sm font-black text-gray-400 font-mono">{line.dispatched}</p>
                                                </div>
                                                <ArrowRight size={12} className={isShort ? 'text-amber-400' : 'text-gray-600'} />
                                                <div className="text-right sm:text-center flex items-center gap-2 sm:block">
                                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest sm:mb-1">{t('warehouse.driverHub.delivered')}</p>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        pattern="[0-9]*"
                                                        min={0}
                                                        max={line.dispatched}
                                                        value={line.delivered}
                                                        aria-label="Delivered quantity"
                                                        title="Delivered quantity"
                                                        onChange={e => setLineDelivered(i, e.target.value)}
                                                        className={`w-14 text-center text-sm font-black font-mono border rounded-lg px-1.5 py-1 focus:outline-none transition-all ${isShort
                                                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 focus:border-amber-400'
                                                            : 'border-white/10 bg-black/40 text-white focus:border-white/30'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {isShort && (
                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[8px] sm:text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                    {line.dispatched - (deliveredVal || 0)} {t('warehouse.driverHub.undeliveredReturned')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 sm:p-5 border-t border-white/10 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-550 hover:text-white transition-colors">
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
                                className={`px-6 sm:px-8 py-2.5 ${hasUndelivered ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20' : 'bg-[#2C5E3B] hover:bg-[#224429] dark:bg-[#A9CBA2] dark:hover:bg-[#8eb886] dark:text-[#1C2620] shadow-[#2C5E3B]/25'} text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2`}
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={13} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                ) : hasUndelivered ? (
                                    <>{t('warehouse.driverHub.next')} <ArrowRight size={13} /></>
                                ) : (
                                    <>Confirm Delivery <CheckCircle size={13} /></>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* REASON STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                            <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('warehouse.driverHub.whyPartialDelivery')}</p>
                            <div className="space-y-2">
                                {dynamicReasons.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRejectReason(r.id as any)}
                                        className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-left transition-all ${rejectReason === r.id
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${rejectReason === r.id ? 'border-amber-400 bg-amber-400' : 'border-gray-655'}`} />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase">{r.label}</p>
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">{t('warehouse.driverHub.driverNotes')}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t('warehouse.driverHub.driverNotes')}
                                    aria-label="Driver Notes"
                                    title="Driver Notes"
                                    rows={3}
                                    className="w-full text-xs border border-white/10 bg-black/40 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/40 transition-all resize-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 border-t border-white/10 flex justify-between items-center shrink-0">
                            <button onClick={() => setStep('QUANTITIES')} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                ← {t('warehouse.driverHub.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="px-6 sm:px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={13} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                    : <><CheckCircle size={13} /> {t('warehouse.driverHub.confirmPartialDelivery')}</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
