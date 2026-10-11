import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Search, FileText, RefreshCw, RotateCcw,
    Trash2, Hash, Lock, ChevronRight, Shield, ArrowRight, ArrowDown, ArrowLeft,
    AlertOctagon, X
} from 'lucide-react';
import { WMSJob, User, DiscrepancyType, ResolutionType } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAdjustStockMutation } from '../../hooks/useAdjustStockMutation';
import { wmsJobsService, discrepancyService } from '../../services/supabase.service';
import { formatJobId } from '../../utils/jobIdFormatter';
import Modal from '../../components/Modal';
import Button from '../../components/shared/Button';
import { logger } from '../../utils/logger';

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
    const adjustStockMutation = useAdjustStockMutation();
    const [step, setStep] = useState<'TYPE' | 'ACTION' | 'DETAILS' | 'REVIEW'>('TYPE');
    const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType | null>(null);
    const [resolutionAction, setResolutionAction] = useState<ResolutionType | null>(null);

    const { products } = useData();

    const [notes, setNotes] = useState('');
    const [resolveQty, setResolveQty] = useState('');
    const [reasonCode, setReasonCode] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setStep('TYPE');
            setDiscrepancyType(null);
            setResolutionAction(null);
            setNotes('');
            setResolveQty('');
            setReasonCode('');
            setClaimAmount('');
        }
    }, [isOpen]);

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
        }
    }, [item, step]);

    if (!isOpen || !job || !item) return null;

    const diff = (item.item.receivedQty || 0) - (item.item.expectedQty || 0);
    const productName = item.item.productName || item.item.name || 'Unknown Product';

    const DISCREPANCY_TYPES: { id: DiscrepancyType, label: string, icon: any, color: string }[] = [
        { id: 'shortage', label: 'Shortage (Received Less)', icon: ArrowDown, color: 'text-amber-500' },
        { id: 'overage', label: 'Overage (Received More)', icon: ArrowLeft, color: 'text-primary' },
        { id: 'damaged', label: 'Damaged Items', icon: AlertTriangle, color: 'text-red-500' },
        { id: 'wrong_item', label: 'Wrong Item Sent', icon: AlertOctagon, color: 'text-amber-600 dark:text-amber-400' },
        { id: 'missing', label: 'Completely Missing', icon: X, color: 'text-[var(--theme-text-muted)]' },
    ];

    const RESOLUTION_ACTIONS: { id: ResolutionType, label: string, desc: string, icon: any, color: string, reqAuth: boolean }[] = [
        { id: 'accept', label: 'Accept As-Is', desc: 'Update inventory to match received qty.', icon: CheckCircle, color: 'text-emerald-500', reqAuth: false },
        { id: 'investigate', label: 'Request Investigation', desc: 'Flag for warehouse team to check.', icon: Search, color: 'text-amber-500', reqAuth: false },
        { id: 'replace', label: 'Resend Missing Items', desc: 'Generate a new transfer from warehouse.', icon: FileText, color: 'text-primary', reqAuth: true },
        { id: 'adjust', label: 'Adjust Inventory', desc: 'Accept with manual adjustment record.', icon: RefreshCw, color: 'text-primary', reqAuth: false },
        { id: 'reject', label: 'Reject & Return', desc: 'Send items back to source.', icon: RotateCcw, color: 'text-red-500', reqAuth: true },
        { id: 'dispose', label: 'Dispose / Destroy', desc: 'Remove from inventory (Waste).', icon: Trash2, color: 'text-red-500', reqAuth: true },
        { id: 'recount', label: 'Request Recount', desc: 'Ask source to count again.', icon: Hash, color: 'text-primary', reqAuth: false },
    ];

    const canDoAction = (action: ResolutionType) => {
        if (action === 'claim' || action === 'reject') {
            return ['store_manager', 'warehouse_manager', 'super_admin', 'regional_manager', 'operations_manager'].includes(currentUser?.role || '');
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!discrepancyType || !resolutionAction) return;
        setIsSubmitting(true);
        try {
            const qty = resolveQty ? parseInt(resolveQty) : 0;
            let replacementJobId: string | undefined = undefined;
            const isHqApprover = ['super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'].includes((currentUser?.role || '').toLowerCase());

            const reasons = {
                overage: `Resolution: Reject Overage (Trf: ${formatJobId(job)})`,
                damaged: `Resolution: Damaged/Defective (Trf: ${formatJobId(job)})`,
                waste: `Resolution: Disposed (Trf: ${formatJobId(job)})`,
                shortage: `Resolution: Found Shortage (Trf: ${formatJobId(job)})`
            };

            if (qty > 0) {
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
                        canApprove: isHqApprover
                    });
                }
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
                        canApprove: isHqApprover
                    });
                }
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
                        canApprove: isHqApprover
                    });
                }
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

            if (['accept', 'reject', 'adjust', 'dispose', 'replace'].includes(resolutionAction)) {
                const updatedLineItems = (job.lineItems || []).map((li: any, i: number) =>
                    i === item.index ? { ...li, status: 'Resolved' } : li
                );
                const allDone = updatedLineItems.every((li: any) => ['Completed', 'Resolved'].includes(li.status));

                await wmsJobsService.update(job.id, {
                    lineItems: updatedLineItems,
                    transferStatus: job.transferStatus,
                    status: allDone ? 'Completed' : 'In-Progress'
                } as any);
            }

            await refreshData();
            onClose();
        } catch (err) {
            logger.error('DiscrepancyResolutionModal', 'caught error', err as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resolve Discrepancy">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-2xl flex items-center justify-between border border-[var(--theme-border)]">
                    <div>
                        <h4 className="text-base font-bold text-[var(--theme-text-primary)] mb-1">{productName}</h4>
                        <div className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                            Expected: <span className="text-[var(--theme-text-primary)] font-semibold">{item.item.expectedQty}</span> &nbsp;|&nbsp;
                            Received: <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.item.receivedQty || 0}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-red-500 font-mono tabular-nums">
                            {diff > 0 ? '+' : ''}{diff}
                        </div>
                        <div className="text-[11px] uppercase tracking-wider text-red-500 font-semibold">Variance</div>
                    </div>
                </div>

                {/* STEPS PREVIEW */}
                <div className="flex items-center gap-2 mb-6">
                    {(['TYPE', 'ACTION', 'DETAILS', 'REVIEW'] as const).map((s, i) => {
                        const isCurrent = step === s;
                        const isPast = ['TYPE', 'ACTION', 'DETAILS', 'REVIEW'].indexOf(step) > i;
                        return (
                            <div key={s} className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-full h-1.5 rounded-full ${isPast || isCurrent ? 'bg-primary' : 'bg-[var(--theme-border)]'}`} />
                                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isCurrent ? 'text-primary' : 'text-[var(--theme-text-muted)]'}`}>{s}</span>
                            </div>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div className="min-h-[280px]">
                    {step === 'TYPE' && (
                        <div className="grid grid-cols-1 gap-3">
                            {DISCREPANCY_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setDiscrepancyType(t.id);
                                        setStep('ACTION');
                                    }}
                                    className={`p-4 min-h-[48px] rounded-xl border flex items-center gap-4 transition-colors group text-left touch-manipulation
                                        ${discrepancyType === t.id
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'}`}
                                >
                                    <div className={`p-2.5 rounded-xl bg-[var(--theme-bg-card)] ${t.color}`}>
                                        <t.icon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[var(--theme-text-primary)] text-sm">{t.label}</div>
                                        <div className="text-[var(--theme-text-secondary)] text-xs mt-0.5">Select if this best describes the issue.</div>
                                    </div>
                                    <ChevronRight className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${discrepancyType === t.id ? 'opacity-100 text-primary' : 'text-[var(--theme-text-muted)]'}`} size={16} />
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
                                        className={`p-4 min-h-[48px] rounded-xl border flex flex-col gap-2 transition-colors text-left relative overflow-hidden touch-manipulation
                                            ${!allowed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--theme-bg-subtle)]'}
                                            ${resolutionAction === a.id
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`p-2 rounded-xl bg-[var(--theme-bg-subtle)] ${a.color}`}>
                                                <a.icon size={18} />
                                            </div>
                                            {a.id === resolutionAction && <div className="bg-primary text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">SELECTED</div>}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[var(--theme-text-primary)] text-xs">{a.label}</div>
                                            <div className="text-[var(--theme-text-secondary)] text-[11px] mt-1 leading-relaxed">{a.desc}</div>
                                        </div>
                                        {!allowed && <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                                            <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-semibold uppercase flex items-center gap-1">
                                                <Lock size={12} /> Locked
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
                                <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-2 uppercase tracking-wider">Quantity to Resolve</label>
                                <input
                                    type="number"
                                    value={resolveQty}
                                    onChange={e => setResolveQty(e.target.value)}
                                    className="woody-input font-mono tabular-nums text-xs min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] px-3 py-2 w-full"
                                    placeholder="Enter quantity..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-2 uppercase tracking-wider">Resolution Notes / Explanation</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Please describe why this resolution was chosen..."
                                    className="woody-input h-28 resize-none text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] p-3 w-full"
                                />
                            </div>

                            {['claim', 'adjust', 'reject'].includes(resolutionAction || '') && (
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-2 uppercase tracking-wider">Internal Reason Code</label>
                                    <select
                                        value={reasonCode}
                                        onChange={e => setReasonCode(e.target.value)}
                                        title="Reason Code"
                                        className="woody-input text-xs min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] px-3 py-2 w-full"
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
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-2 uppercase tracking-wider">Estimated Claim Amount</label>
                                    <input
                                        type="number"
                                        value={claimAmount}
                                        onChange={e => setClaimAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="woody-input text-xs min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] px-3 py-2 w-full font-mono tabular-nums"
                                    />
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
                            <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl space-y-4">
                                <h3 className="text-[var(--theme-text-primary)] font-semibold flex items-center gap-2 text-sm">
                                    <Shield className="text-primary" size={18} /> Confirm Resolution
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <div className="text-[var(--theme-text-muted)] mb-1">Discrepancy Type</div>
                                        <div className="text-[var(--theme-text-primary)] font-semibold capitalize">{DISCREPANCY_TYPES.find(t => t.id === discrepancyType)?.label}</div>
                                    </div>
                                    <div>
                                        <div className="text-[var(--theme-text-muted)] mb-1">Resolution Action</div>
                                        <div className="text-[var(--theme-text-primary)] font-semibold capitalize">{RESOLUTION_ACTIONS.find(a => a.id === resolutionAction)?.label}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[var(--theme-text-muted)] mb-1">Notes</div>
                                        <div className="text-[var(--theme-text-primary)] italic bg-[var(--theme-bg-subtle)] p-2.5 rounded-xl border border-[var(--theme-border)]">{notes}</div>
                                    </div>
                                    {claimAmount && (
                                        <div>
                                            <div className="text-[var(--theme-text-muted)] mb-1">Claim Value</div>
                                            <div className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-semibold">${claimAmount}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep('DETAILS')} className="flex-1">Back</Button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-[2] min-h-[44px] bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all touch-manipulation text-xs"
                                    disabled={isSubmitting}
                                >
                                    <CheckCircle size={16} /> Confirm & Submit
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Nav (Back) */}
                {step !== 'TYPE' && step !== 'REVIEW' && (
                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'ACTION') setStep('TYPE');
                                if (step === 'DETAILS') setStep('ACTION');
                            }}
                            className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-2 text-xs font-semibold transition-colors min-h-[44px] touch-manipulation"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
