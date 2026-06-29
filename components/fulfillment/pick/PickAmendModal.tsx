import React, { useState, useEffect } from 'react';
import {
    X, Edit3, AlertTriangle, CheckCircle, Loader2, FileEdit, ShieldAlert, ArrowRight
} from 'lucide-react';
import { WMSJob, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AmendLine {
    index: number;
    name: string;
    sku: string;
    required: number;
    picked: number;
    amended: string; // controlled input
}

interface PickAmendModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    currentUser: User | null;
    /** All jobs — needed to find the linked PACK job */
    allJobs: WMSJob[];
    wmsJobsService: any;
    addNotification: (type: 'success' | 'alert' | 'info', msg: string) => void;
    refreshData: () => Promise<void>;
}

export const PickAmendModal: React.FC<PickAmendModalProps> = ({
    isOpen,
    onClose,
    job,
    currentUser,
    allJobs,
    wmsJobsService,
    addNotification,
    refreshData,
}) => {
    const { t } = useLanguage();
    const [lines, setLines] = useState<AmendLine[]>([]);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'EDIT' | 'CONFIRM'>('EDIT');

    // Populate line items from job
    useEffect(() => {
        if (!isOpen || !job?.lineItems) return;
        setStep('EDIT');
        setReason('');
        setLines(
            (job.lineItems as any[]).map((item: any, idx: number) => ({
                index: idx,
                name: item.name || item.productName || 'Unknown',
                sku: item.sku || '',
                required: item.expectedQty || (item as any).quantity || 0,
                picked: item.pickedQty ?? item.expectedQty ?? 0,
                amended: String(item.pickedQty ?? item.expectedQty ?? 0),
            }))
        );
    }, [isOpen, job]);

    if (!isOpen || !job) return null;

    const hasChanges = lines.some(l => {
        const val = parseInt(l.amended);
        return !isNaN(val) && val !== l.picked;
    });

    const linkedPackJob = allJobs.find(j =>
        j.type === 'PACK' &&
        (j.orderRef === job.id || j.orderRef === job.jobNumber) &&
        j.status !== 'Completed'
    );

    const handleAmendChange = (idx: number, val: string) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, amended: val } : l));
    };

    const handleConfirm = async () => {
        if (!reason.trim()) {
            addNotification('alert', 'Please enter a reason for the amendment.');
            return;
        }
        setIsSubmitting(true);
        try {
            // Build updated line items
            const updatedLineItems = (job.lineItems as any[]).map((item: any, idx: number) => {
                const line = lines[idx];
                const amendedVal = parseInt(line.amended);
                const newPicked = !isNaN(amendedVal) ? amendedVal : line.picked;
                return {
                    ...item,
                    pickedQty: newPicked,
                    // Mark amended items with a flag for audit trail display
                    amended: newPicked !== line.picked ? true : (item.amended || false),
                    amendedFrom: newPicked !== line.picked ? line.picked : (item.amendedFrom ?? undefined),
                };
            });

            const auditNote = `[PICK AMENDED by ${currentUser?.name || 'Manager'} at ${new Date().toLocaleString()}] Reason: ${reason}`;

            // 1. Update Pick job
            await wmsJobsService.update(job.id, {
                lineItems: updatedLineItems,
                notes: job.notes ? `${job.notes}\n${auditNote}` : auditNote,
                hasAmendment: true,
            } as any);

            // 2. Cascade to linked PACK job (update expectedQty to match corrected pickedQty)
            if (linkedPackJob) {
                const updatedPackLineItems = (linkedPackJob.lineItems as any[] || []).map((packItem: any) => {
                    const matchedLine = lines.find(l =>
                        l.sku === packItem.sku || l.index === packItem.sourceItemIndex
                    );
                    if (matchedLine) {
                        const amendedVal = parseInt(matchedLine.amended);
                        const newExpected = !isNaN(amendedVal) ? amendedVal : matchedLine.picked;
                        return { ...packItem, expectedQty: newExpected };
                    }
                    return packItem;
                });
                await wmsJobsService.update(linkedPackJob.id, {
                    lineItems: updatedPackLineItems,
                    notes: linkedPackJob.notes
                        ? `${linkedPackJob.notes}\n${auditNote}`
                        : auditNote,
                } as any);
            }

            await refreshData();
            addNotification('success', `Pick #${formatJobId(job)} amended successfully.${linkedPackJob ? ' Pack job updated.' : ''}`);
            onClose();
        } catch (err: any) {
            addNotification('alert', 'Amendment failed: ' + (err?.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const MANAGER_ROLES = ['super_admin', 'admin', 'warehouse_manager', 'manager', 'operations_manager'];
    const isManager = MANAGER_ROLES.includes(currentUser?.role || '');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 border-2 border-amber-500/30 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-amber-50/60 dark:bg-amber-900/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                            <FileEdit size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                                Amend Pick Quantities
                            </h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
                                {formatJobId(job)} · Supervisor Correction
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={18} className="text-zinc-550" />
                    </button>
                </div>

                {/* Auth guard */}
                {!isManager ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
                            <ShieldAlert size={32} className="text-red-500" />
                        </div>
                        <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Supervisor Required</p>
                        <p className="text-xs text-zinc-500 mt-2">Only warehouse managers and above can amend completed picks.</p>
                    </div>
                ) : step === 'EDIT' ? (
                    <>
                        {/* Info Banner */}
                        <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-2 shrink-0">
                            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                                This will update the picked quantities and automatically cascade changes to the linked Pack job
                                {linkedPackJob ? ` (${formatJobId(linkedPackJob)})` : ''}.
                                All changes are logged with your name and reason.
                            </p>
                        </div>

                        {/* Line Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Correct Quantities</p>
                            {lines.map((line, i) => {
                                const amendedVal = parseInt(line.amended);
                                const isValid = !isNaN(amendedVal) && amendedVal >= 0;
                                const isDiff = isValid && amendedVal !== line.picked;
                                const isOver = isValid && amendedVal > line.required;
                                return (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all ${isDiff ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-500/30' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10'}`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{line.name}</p>
                                                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">{line.sku}</p>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                {/* Required */}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.expected')}</p>
                                                    <p className="text-sm font-black text-zinc-600 dark:text-zinc-400 font-mono">{line.required}</p>
                                                </div>
                                                {/* Picked */}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.picking')}</p>
                                                    <p className={`text-sm font-black font-mono ${isDiff ? 'line-through text-zinc-400 dark:text-zinc-650' : 'text-zinc-800 dark:text-zinc-200'}`}>{line.picked}</p>
                                                </div>
                                                {/* Arrow */}
                                                {isDiff && <ArrowRight size={14} className="text-amber-500" />}
                                                {/* Amended Input */}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Correct To</p>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={line.required * 2}
                                                        value={line.amended}
                                                        onChange={e => handleAmendChange(i, e.target.value)}
                                                        aria-label="Amended quantity"
                                                        title="Amended quantity"
                                                        placeholder="0"
                                                        className={`w-16 text-center text-sm font-black font-mono border rounded-lg px-2 py-1 focus:outline-none transition-all ${isOver
                                                            ? 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                                                            : 'border-amber-300 dark:border-amber-500/30 bg-white dark:bg-black/40 text-amber-700 dark:text-amber-300 focus:border-amber-500'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {isOver && (
                                            <p className="text-[9px] text-red-500 font-bold mt-1.5 text-right">⚠ Exceeds required quantity — confirm this is correct</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reason input */}
                        <div className="px-6 pb-2 shrink-0">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Reason for Amendment *</label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g. Worker entered 12 instead of 37 during manual short-pick..."
                                rows={2}
                                className="w-full text-xs border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 rounded-xl px-4 py-3 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-amber-400 transition-all resize-none"
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors">
                                {t('warehouse.dismiss')}
                            </button>
                            <button
                                disabled={!hasChanges || !reason.trim()}
                                onClick={() => setStep('CONFIRM')}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:grayscale text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                <Edit3 size={13} /> Review Changes
                            </button>
                        </div>
                    </>
                ) : (
                    /* CONFIRM STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Confirm These Corrections</p>
                            {lines.filter(l => {
                                const v = parseInt(l.amended);
                                return !isNaN(v) && v !== l.picked;
                            }).map((line, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase">{line.name}</p>
                                        <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{line.sku}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black font-mono text-zinc-400 line-through">{line.picked}</span>
                                        <ArrowRight size={14} className="text-amber-500" />
                                        <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-300">{line.amended}</span>
                                    </div>
                                </div>
                            ))}

                            {linkedPackJob && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-start gap-2">
                                    <CheckCircle size={13} className="text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
                                        Pack job <strong>{formatJobId(linkedPackJob)}</strong> will also be updated to match corrected quantities.
                                    </p>
                                </div>
                            )}

                            <div className="p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Reason on Record</p>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">{reason}</p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('EDIT')}
                                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                            >
                                &larr; Back
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                                    : <><CheckCircle size={13} /> Confirm Amendment</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
