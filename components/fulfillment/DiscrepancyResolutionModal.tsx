
import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Search, FileText, RefreshCw, RotateCcw,
    Trash2, Hash, Lock, ChevronRight, Shield, ArrowRight, ArrowDown, ArrowLeft,
    AlertOctagon, X, Package
} from 'lucide-react';
import { WMSJob, User, DiscrepancyType, ResolutionType, Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAdjustStockMutation } from '../../hooks/useAdjustStockMutation';
import { wmsJobsService, discrepancyService } from '../../services/supabase.service';
import { formatJobId } from '../../utils/jobIdFormatter';
import Modal from '../../components/Modal';
import Button from '../../components/shared/Button';

interface DiscrepancyResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    item: { item: any; index: number } | null;
    currentUser: User | null;
    refreshData: () => Promise<void>;
    activeSite: any;
}

export function DiscrepancyResolutionModal({
    isOpen,
    onClose,
    job,
    item,
    currentUser,
    refreshData,
    activeSite
}: DiscrepancyResolutionModalProps) {
    // --- MUTATIONS ---
    const adjustStockMutation = useAdjustStockMutation();
    // --- STATE ---
    const [step, setStep] = useState<'TYPE' | 'ACTION' | 'DETAILS' | 'REVIEW'>('TYPE');
    const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType | null>(null);
    const [resolutionAction, setResolutionAction] = useState<ResolutionType | null>(null);

    // Fix: Access products context for fallback lookups
    const { products } = useData();

    // Details
    const [notes, setNotes] = useState('');
    const [resolveQty, setResolveQty] = useState('');
    const [reasonCode, setReasonCode] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setStep('TYPE');
            setDiscrepancyType(null);
            setResolutionAction(null);
            setNotes('');
            setResolveQty('');
            setReasonCode('');
            setClaimAmount('');

        }
    }, [isOpen]);

    // Auto-detect type if obvious (e.g., Shortage/Overage based on math)
    useEffect(() => {
        if (item && step === 'TYPE') {
            const diff = (item.item.receivedQty || 0) - (item.item.expectedQty || 0);
            if (diff < 0) {
                setDiscrepancyType('shortage');
                setResolveQty(Math.abs(diff).toString());
            }
            if (diff > 0) {
                setDiscrepancyType('overage');
                setResolveQty(diff.toString());
            }
            // 'damaged', 'wrong_item', 'missing' are user selected if math doesn't explain it fully
        }
    }, [item, step]);

    if (!isOpen || !job || !item) return null;

    const diff = (item.item.receivedQty || 0) - (item.item.expectedQty || 0);
    const productName = item.item.productName || item.item.name || 'Unknown Product';

    // Config
    const DISCREPANCY_TYPES: { id: DiscrepancyType, label: string, icon: any, color: string }[] = [
        { id: 'shortage', label: 'Shortage (Received Less)', icon: ArrowDown, color: 'text-orange-400' },
        { id: 'overage', label: 'Overage (Received More)', icon: ArrowLeft, color: 'text-blue-400' },
        { id: 'damaged', label: 'Damaged Items', icon: AlertTriangle, color: 'text-red-400' },
        { id: 'wrong_item', label: 'Wrong Item Sent', icon: AlertOctagon, color: 'text-purple-400' },
        { id: 'missing', label: 'Completely Missing', icon: X, color: 'text-gray-400' },
    ];

    const RESOLUTION_ACTIONS: { id: ResolutionType, label: string, desc: string, icon: any, color: string, reqAuth: boolean }[] = [
        { id: 'accept', label: 'Accept As-Is', desc: 'Update inventory to match received qty.', icon: CheckCircle, color: 'text-green-400', reqAuth: false },
        { id: 'investigate', label: 'Request Investigation', desc: 'Flag for warehouse team to check.', icon: Search, color: 'text-yellow-400', reqAuth: false },
        { id: 'replace', label: 'Resend Missing Items', desc: 'Generate a new transfer from warehouse.', icon: FileText, color: 'text-blue-400', reqAuth: true },
        { id: 'adjust', label: 'Adjust Inventory', desc: 'Accept with manual adjustment record.', icon: RefreshCw, color: 'text-cyan-400', reqAuth: false },
        { id: 'reject', label: 'Reject & Return', desc: 'Send items back to source.', icon: RotateCcw, color: 'text-red-400', reqAuth: true },
        { id: 'dispose', label: 'Dispose / Destroy', desc: 'Remove from inventory (Waste).', icon: Trash2, color: 'text-red-500', reqAuth: true },
        { id: 'recount', label: 'Request Recount', desc: 'Ask source to count again.', icon: Hash, color: 'text-indigo-400', reqAuth: false },
    ];

    // Helper to check permissions (placeholder)
    const canDoAction = (action: ResolutionType) => {
        // Example logic
        if (action === 'claim' || action === 'reject') {
            // Require manager role?
            return ['store_manager', 'warehouse_manager', 'super_admin'].includes(currentUser?.role || '');
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!discrepancyType || !resolutionAction) return;
        setIsSubmitting(true);
        try {
            const qty = resolveQty ? parseInt(resolveQty) : 0;
            let replacementJobId: string | undefined = undefined;

            // --- PHASE 1: SIDE EFFECTS & REPLACEMENTS ---
            const reasons = {
                overage: `Resolution: Reject Overage (Trf: ${formatJobId(job)})`,
                damaged: `Resolution: Damaged/Defective (Trf: ${formatJobId(job)})`,
                waste: `Resolution: Disposed (Trf: ${formatJobId(job)})`,
                shortage: `Resolution: Found Shortage (Trf: ${formatJobId(job)})`
            };

            if (qty > 0) {
                // Reject (Return) - Reduces Stock
                if (resolutionAction === 'reject') {
                    const product = products.find((p: any) => p.id === (item.item.productId || item.item.id));
                    await adjustStockMutation.mutateAsync({
                        productId: item.item.productId || item.item.id,
                        productName: product?.name || item.item.name || 'Unknown',
                        productSku: product?.sku || item.item.sku || 'N/A',
                        siteId: activeSite?.id || '',
                        quantity: qty,
                        type: 'OUT',
                        reason: reasons.overage,
                        canApprove: true
                    });
                }
                // Dispose (Waste) - Reduces Stock
                if (resolutionAction === 'dispose') {
                    const product = products.find((p: any) => p.id === (item.item.productId || item.item.id));
                    await adjustStockMutation.mutateAsync({
                        productId: item.item.productId || item.item.id,
                        productName: product?.name || item.item.name || 'Unknown',
                        productSku: product?.sku || item.item.sku || 'N/A',
                        siteId: activeSite?.id || '',
                        quantity: qty,
                        type: 'OUT',
                        reason: reasons.waste,
                        canApprove: true
                    });
                }
                // Adjust (Shortage Found) - Adds Stock
                if (resolutionAction === 'adjust' && discrepancyType === 'shortage') {
                    const product = products.find((p: any) => p.id === (item.item.productId || item.item.id));
                    await adjustStockMutation.mutateAsync({
                        productId: item.item.productId || item.item.id,
                        productName: product?.name || item.item.name || 'Unknown',
                        productSku: product?.sku || item.item.sku || 'N/A',
                        siteId: activeSite?.id || '',
                        quantity: qty,
                        type: 'IN',
                        reason: reasons.shortage,
                        canApprove: true
                    });
                }
                // Resend Missing Items - Creates new replacement job
                if (resolutionAction === 'replace') {
                    const newJob = await wmsJobsService.create({
                        siteId: job.sourceSiteId || activeSite?.id,
                        type: 'TRANSFER',
                        priority: job.priority || 'Normal',
                        status: 'Pending',
                        items: 1,
                        lineItems: [{
                            productId: item.item.productId || item.item.id,
                            name: item.item.name || 'Unknown',
                            // Fix: Ensure SKU is populated from product registry if missing on item
                            sku: item.item.sku || products.find((p: any) => p.id === (item.item.productId || item.item.id))?.sku || 'N/A',
                            image: item.item.image || '',
                            expectedQty: qty,
                            pickedQty: 0,
                            status: 'Pending',
                            receivedQty: 0
                        }],
                        sourceSiteId: job.sourceSiteId,
                        destSiteId: job.destSiteId,
                        transferStatus: 'Requested',
                        requestedBy: currentUser?.name || 'System',
                        notes: `Replacement for discrepancy in ${job.jobNumber || job.id}`,
                        deliveryMethod: job.deliveryMethod || 'Internal'
                    } as any);
                    replacementJobId = newJob.id;
                }
            }

            // --- PHASE 2: RECORD DISCREPANCY ---
            await discrepancyService.createResolution({
                transferId: job.id,
                lineItemIndex: item.index,
                productId: item.item.productId || item.item.id,
                expectedQty: item.item.expectedQty,
                receivedQty: item.item.receivedQty || 0,
                variance: diff,
                discrepancyType: discrepancyType,
                resolutionType: resolutionAction,
                resolutionStatus: resolutionAction === 'accept' ? 'closed' : 'pending',
                resolutionNotes: notes,
                reasonCode: reasonCode,
                claimAmount: claimAmount ? parseFloat(claimAmount) : undefined,
                reportedBy: currentUser?.id,
                siteId: job.destSiteId,
                resolveQty: qty,
                replacementJobId: replacementJobId
            });

            // 2. UPDATE JOB ITEM STATUS
            // If resolved (Accept, Reject, Adjust), mark item as Resolved
            if (['accept', 'reject', 'adjust', 'dispose', 'replace'].includes(resolutionAction)) {
                const updatedLineItems = (job.lineItems || []).map((li: any, i: number) =>
                    i === item.index ? { ...li, status: 'Resolved' } : li
                );
                // Check if all items are now resolved/completed
                const allDone = updatedLineItems.every((li: any) => ['Completed', 'Resolved'].includes(li.status));

                await wmsJobsService.update(job.id, {
                    lineItems: updatedLineItems,
                    transferStatus: job.transferStatus,
                    status: allDone ? 'Completed' : 'In-Progress'
                } as any);
            }

            await refreshData();
            onClose();
            alert('Discrepancy resolution submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit resolution. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resolve Discrepancy">
            <div className="space-y-6">

                {/* Header Info */}
                <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">{productName}</h4>
                        <div className="text-sm text-gray-400 font-mono">
                            Expected: <span className="text-white">{item.item.expectedQty}</span> &nbsp;|&nbsp;
                            Received: <span className="text-yellow-400">{item.item.receivedQty || 0}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-red-500 font-mono tracking-tighter">
                            {diff > 0 ? '+' : ''}{diff}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-red-400 opacity-70 font-bold">Variance</div>
                    </div>
                </div>

                {/* STEPS PREVIEW */}
                <div className="flex items-center gap-2 mb-6">
                    {['TYPE', 'ACTION', 'DETAILS', 'REVIEW'].map((s, i) => {
                        const isCurrent = step === s;
                        const isPast = ['TYPE', 'ACTION', 'DETAILS', 'REVIEW'].indexOf(step) > i;
                        return (
                            <div key={s} className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-full h-1 rounded-full ${isPast ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-white/10'}`} />
                                <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-blue-400' : 'text-gray-600'}`}>{s}</span>
                            </div>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div className="min-h-[300px]">
                    {step === 'TYPE' && (
                        <div className="grid grid-cols-1 gap-3">
                            {DISCREPANCY_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setDiscrepancyType(t.id);
                                        setStep('ACTION');
                                    }}
                                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all group text-left
                                        ${discrepancyType === t.id
                                            ? 'bg-blue-500/20 border-blue-500/50'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                >
                                    <div className={`p-3 rounded-full bg-black/40 ${t.color}`}>
                                        <t.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{t.label}</div>
                                        <div className="text-gray-400 text-sm">Select if this best describes the issue.</div>
                                    </div>
                                    <ChevronRight className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${discrepancyType === t.id ? 'opacity-100 text-blue-400' : 'text-gray-500'}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'ACTION' && (
                        <div className="grid grid-cols-2 gap-3">
                            {RESOLUTION_ACTIONS.map(a => {
                                const allowed = canDoAction(a.id);
                                return (
                                    <button
                                        key={a.id}
                                        disabled={!allowed}
                                        onClick={() => {
                                            setResolutionAction(a.id);
                                            setStep('DETAILS');
                                        }}
                                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all text-left relative overflow-hidden
                                            ${!allowed ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02]'}
                                            ${resolutionAction === a.id
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`p-2 rounded-lg bg-black/40 ${a.color}`}>
                                                <a.icon size={20} />
                                            </div>
                                            {a.id === resolutionAction && <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">SELECTED</div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{a.label}</div>
                                            <div className="text-gray-400 text-xs mt-1 leading-relaxed">{a.desc}</div>
                                        </div>
                                        {!allowed && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1">
                                                <Lock size={10} /> Locked
                                            </span>
                                        </div>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === 'DETAILS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Quantity to Resolve</label>
                                <input
                                    type="number"
                                    value={resolveQty}
                                    onChange={e => setResolveQty(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none font-mono"
                                    placeholder="Enter quantity..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Resolution Notes / Explanation</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Please describe why this resolution was chosen..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none h-32 resize-none"
                                />
                            </div>

                            {['claim', 'adjust', 'reject'].includes(resolutionAction || '') && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Internal Reason Code</label>
                                    <select
                                        value={reasonCode}
                                        onChange={e => setReasonCode(e.target.value)}
                                        title="Reason Code"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                    >
                                        <option value="">Select a reason code...</option>
                                        <option value="DAMAGED_TRANSIT">Damaged in Transit</option>
                                        <option value="SHRINK_TRANSIT">Shrinkage / Lost in Transit</option>
                                        <option value="PACKING_ERROR">Internal Packing Error</option>
                                        <option value="COUNT_ERROR">Counting Error</option>
                                        <option value="THEFT">Suspected Theft</option>
                                    </select>
                                </div>
                            )}

                            {resolutionAction === 'claim' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Estimated Claim Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            value={claimAmount}
                                            onChange={e => setClaimAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={() => setStep('REVIEW')}
                                    disabled={!notes || (['claim', 'adjust', 'reject'].includes(resolutionAction || '') && !reasonCode)}
                                >
                                    Review Resolution <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'REVIEW' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl space-y-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Shield className="text-blue-400" /> Confirm Resolution
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-400 mb-1">Discrepancy Type</div>
                                        <div className="text-white font-bold capitalize">{DISCREPANCY_TYPES.find(t => t.id === discrepancyType)?.label}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-1">Resolution Action</div>
                                        <div className="text-white font-bold capitalize">{RESOLUTION_ACTIONS.find(a => a.id === resolutionAction)?.label}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-400 mb-1">Notes</div>
                                        <div className="text-white italic bg-black/20 p-2 rounded border border-white/5">{notes}</div>
                                    </div>
                                    {claimAmount && (
                                        <div>
                                            <div className="text-gray-400 mb-1">Claim Value</div>
                                            <div className="text-green-400 font-mono font-bold">${claimAmount}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep('DETAILS')} className="flex-1">Back</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white font-bold"
                                    loading={isSubmitting}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Confirm & Submit
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Nav (Back) */}
                {step !== 'TYPE' && step !== 'REVIEW' && (
                    <div className="pt-6 border-t border-white/5 flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'ACTION') setStep('TYPE');
                                if (step === 'DETAILS') setStep('ACTION');
                            }}
                            className="text-gray-500 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
