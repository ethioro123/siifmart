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
    jobs,
}) => {
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
            const auditNote = `[PARTIAL DELIVERY by ${user?.name || 'Driver'} at ${new Date().toLocaleString()}] Reason: ${REJECT_REASONS.find(r => r.id === rejectReason)?.label}. ${notes}`;

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

            // 1. Mark job as Partially Delivered
            await wmsJobsService.update(job.id, {
                status: 'Completed',
                transferStatus: 'Partially Delivered',
                deliveredAt: new Date().toISOString(),
                receivedBy: user?.name || 'Driver',
                lineItems: updatedLineItems,
                notes: job.notes ? `${job.notes}\n${auditNote}` : auditNote,
                hasDiscrepancy: true,
            } as any);

            // 2. Update parent Transfer job if linked
            if (job.orderRef) {
                const parentJob = jobs.find(j => j.id === job.orderRef);
                if (parentJob) {
                    await wmsJobsService.update(parentJob.id, {
                        status: 'Completed',
                        transferStatus: 'Partially Delivered',
                    } as any);
                }
            }

            // 3. Credit ONLY the delivered quantity to the destination store's inventory
            for (const line of lines) {
                const deliveredQty = parseInt(line.delivered) || 0;
                if (deliveredQty <= 0 || !destSiteId) continue;

                const templateProduct = products.find(p =>
                    p.sku === line.sku || p.id === line.productId
                );
                const unit = templateProduct?.unit || line.unit;
                const isWeightVol = unit ? isWeightBased(unit) || isVolumeBased(unit) : false;
                const sizeNum = templateProduct?.size ? parseFloat(templateProduct.size as string) : 0;
                const finalQty = (isWeightVol && sizeNum > 0) ? deliveredQty * sizeNum : deliveredQty;

                const destProduct = products.find(p =>
                    (p.sku === line.sku || p.id === line.productId || p.productId === line.productId) &&
                    (p.siteId === destSiteId || (p as any).site_id === destSiteId)
                );

                if (destProduct) {
                    await adjustStockMutation.mutateAsync({
                        productId: destProduct.id,
                        productName: destProduct.name || line.name,
                        productSku: destProduct.sku || line.sku,
                        siteId: destSiteId,
                        quantity: finalQty,
                        type: 'IN',
                        reason: `Partial Delivery: ${formatJobId(job)} (${deliveredQty}/${line.dispatched} units)`,
                        canApprove: true,
                    });
                } else if (templateProduct && deliveredQty > 0) {
                    await addProduct({
                        name: line.name || templateProduct.name,
                        sku: line.sku || templateProduct.sku,
                        price: templateProduct.price || 0,
                        costPrice: (templateProduct as any).costPrice || 0,
                        stock: finalQty,
                        unit: templateProduct.unit || 'pcs',
                        siteId: destSiteId,
                        category: templateProduct.category || 'Uncategorized',
                        productId: templateProduct.productId || templateProduct.id,
                    } as any);
                }
            }

            await refreshData();
            setStep('DONE');
            addNotification('info', `Partial delivery logged for ${formatJobId(job)}. ${totalDelivered}/${totalDispatched} units credited to ${destSite?.name || 'store'}.`);
        } catch (err: any) {
            addNotification('alert', 'Partial delivery failed: ' + (err?.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[400] p-4 animate-in fade-in duration-200">
            <div className="bg-[#0e0e10] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                            <Truck size={18} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Partial Delivery</h3>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">
                                {formatJobId(job)} → {destSite?.name || 'Store'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {step === 'DONE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center border border-amber-500/20 mb-4">
                            <CheckCircle size={32} className="text-amber-400" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Partial Delivery Logged</h4>
                        <p className="text-xs text-gray-500 max-w-xs">
                            <strong className="text-amber-400">{totalDelivered}</strong> of <strong className="text-white">{totalDispatched}</strong> units credited to {destSite?.name || 'destination store'}.
                        </p>
                        <p className="text-[10px] text-gray-600 mt-2">Undelivered stock will be reviewed by the warehouse.</p>
                        <button
                            onClick={onClose}
                            className="mt-8 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                            Done
                        </button>
                    </div>
                ) : step === 'QUANTITIES' ? (
                    <>
                        {/* Progress summary */}
                        <div className="mx-5 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Delivering</p>
                                <p className="text-lg font-black text-white font-mono">{totalDelivered} <span className="text-xs text-gray-500 font-normal">/ {totalDispatched}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">To</p>
                                <p className="text-sm font-black text-amber-400 uppercase">{destSite?.name || 'Store'}</p>
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Delivered Quantities</p>
                            {lines.map((line, i) => {
                                const deliveredVal = parseInt(line.delivered);
                                const isShort = !isNaN(deliveredVal) && deliveredVal < line.dispatched;
                                const isFull = !isNaN(deliveredVal) && deliveredVal === line.dispatched;
                                return (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all ${isShort ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFull ? 'bg-green-500/15' : isShort ? 'bg-amber-500/15' : 'bg-white/5'}`}>
                                                    <Package size={14} className={isFull ? 'text-green-400' : isShort ? 'text-amber-400' : 'text-gray-500'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-white uppercase truncate">{line.name}</p>
                                                    <p className="text-[9px] font-mono text-gray-500">{line.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dispatched</p>
                                                    <p className="text-sm font-black text-gray-400 font-mono">{line.dispatched}</p>
                                                </div>
                                                <ArrowRight size={12} className={isShort ? 'text-amber-400' : 'text-gray-600'} />
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Delivered</p>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={line.dispatched}
                                                        value={line.delivered}
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
                                                <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                    {line.dispatched - (deliveredVal || 0)} undelivered — will be returned to warehouse
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-5 border-t border-white/10 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep('REASON')}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                Next <ArrowRight size={13} />
                            </button>
                        </div>
                    </>
                ) : (
                    /* REASON STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Why Partial Delivery?</p>
                            <div className="space-y-2">
                                {REJECT_REASONS.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRejectReason(r.id)}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${rejectReason === r.id
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${rejectReason === r.id ? 'border-amber-400 bg-amber-400' : 'border-gray-600'}`} />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase">{r.label}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Driver Notes (optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="e.g. Store manager signed for 5 of 8 crates. Remaining loaded back onto truck..."
                                    rows={3}
                                    className="w-full text-xs border border-white/10 bg-black/40 rounded-xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/40 transition-all resize-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/10 flex justify-between items-center shrink-0">
                            <button onClick={() => setStep('QUANTITIES')} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                ← Back
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                                    : <><CheckCircle size={13} /> Confirm Partial Delivery</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
