import React, { useState, useEffect } from 'react';
import {
    X, Edit3, AlertTriangle, CheckCircle, Loader2, FileEdit, ShieldAlert, ArrowRight, MapPin, Send
} from 'lucide-react';
import { WMSJob, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
    pickAmendmentService,
    PICK_AMEND_REASON_CODES,
    PickAmendReasonCode
} from '../../../services/pick-amendment.service';
import { fetchLoginLocation } from '../../../utils/geolocationHelper';

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

const AUTHORIZED_SUPERVISORY_ROLES = [
    'super_admin',
    'admin',
    'ceo',
    'regional_manager',
    'operations_manager',
    'warehouse_manager',
    'store_manager',
    'inventory_manager',
    'logistics_manager',
    'assistant_manager',
    'shift_lead',
    'store_supervisor',
    'dispatch_manager',
    'merchandising_manager',
    'supply_chain_manager',
];

export const PickAmendModal: React.FC<PickAmendModalProps> = ({
    isOpen,
    onClose,
    job,
    currentUser,
    allJobs,
    addNotification,
    refreshData,
}) => {
    const { t } = useLanguage();
    const [lines, setLines] = useState<AmendLine[]>([]);
    const [reasonCode, setReasonCode] = useState<PickAmendReasonCode>('BIN_SHORTAGE');
    const [reasonNotes, setReasonNotes] = useState('');
    const [gpsLocation, setGpsLocation] = useState<string>('Fetching GPS...');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'EDIT' | 'CONFIRM'>('EDIT');

    // Populate line items and capture GPS on open
    useEffect(() => {
        if (!isOpen || !job?.lineItems) return;
        setStep('EDIT');
        setReasonNotes('');
        setReasonCode('BIN_SHORTAGE');
        setGpsLocation('Locating terminal...');

        // Async GPS capture
        let isMounted = true;
        fetchLoginLocation().then(loc => {
            if (isMounted) setGpsLocation(loc || 'GPS: Undefined');
        }).catch(() => {
            if (isMounted) setGpsLocation('GPS: Fallback');
        });

        setLines(
            (job.lineItems as any[]).map((item: any, idx: number) => ({
                index: idx,
                name: item.name || item.productName || t('warehouse.picking.unknownUser'),
                sku: item.sku || '',
                required: item.expectedQty || (item as any).quantity || 0,
                picked: item.pickedQty ?? item.expectedQty ?? 0,
                amended: String(item.pickedQty ?? item.expectedQty ?? 0),
            }))
        );

        return () => {
            isMounted = false;
        };
    }, [isOpen, job, t]);

    if (!isOpen || !job) return null;

    const userRole = (currentUser?.role || '').trim().toLowerCase();
    const isManager = AUTHORIZED_SUPERVISORY_ROLES.includes(userRole);

    const hasChanges = lines.some(l => {
        const val = parseInt(l.amended, 10);
        return !isNaN(val) && val !== l.picked;
    });

    const linkedPackJob = allJobs.find(j =>
        j.type === 'PACK' &&
        (j.orderRef === job.id || j.orderRef === String(job.jobNumber)) &&
        j.status !== 'Completed'
    );

    const handleAmendChange = (idx: number, val: string) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, amended: val } : l));
    };

    const handleConfirm = async () => {
        if (!reasonNotes.trim()) {
            addNotification('alert', t('warehouse.picking.pleaseEnterReason') || 'Please enter an explanatory reason for the amendment.');
            return;
        }
        if (!currentUser?.id) {
            addNotification('alert', 'Zero-Trust Error: Missing authenticated supervisor identity.');
            return;
        }

        setIsSubmitting(true);
        try {
            const amendLines = lines.map(l => {
                const val = parseInt(l.amended, 10);
                return {
                    index: l.index,
                    sku: l.sku,
                    name: l.name,
                    productId: (job.lineItems as any[])?.[l.index]?.productId,
                    originalPicked: l.picked,
                    amendedPicked: !isNaN(val) ? val : l.picked,
                };
            });

            const result = await pickAmendmentService.executeAmendment({
                job,
                lines: amendLines,
                reasonCode,
                reasonNotes,
                currentUser: {
                    id: currentUser.id,
                    name: currentUser.name || 'Supervisor',
                    role: currentUser.role || 'warehouse_manager',
                },
                gpsLocation,
                linkedPackJob,
            });

            await refreshData();
            addNotification(
                'success',
                `Pick amended (${result.amendedLinesCount} item(s)). ${result.inventoryRequestsSubmitted} stock adjustment request(s) routed to Central HQ.`
            );
            onClose();
        } catch (err: any) {
            addNotification('alert', t('warehouse.picking.amendmentFailed') + (err?.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
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
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                                    {t('warehouse.picking.amendPickQuantities')}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    Zero-Trust
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
                                <span>{formatJobId(job)}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <MapPin size={10} /> {gpsLocation}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={18} className="text-zinc-500" />
                    </button>
                </div>

                {/* Auth guard */}
                {!isManager ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
                            <ShieldAlert size={32} className="text-red-500" />
                        </div>
                        <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
                            {t('warehouse.picking.supervisorRequired') || 'Supervisory Authority Required'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2 max-w-md">
                            Zero-Trust Rule 18: Pick amendments are managerial overrides that affect stock balances and require authenticated supervisor credentials.
                        </p>
                    </div>
                ) : step === 'EDIT' ? (
                    <>
                        {/* Info Banner */}
                        <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-2 shrink-0">
                            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                <span className="font-bold">Zero-Trust Notice:</span> Amending quantities creates a pending inventory request for Central HQ review and preserves original customer requirement on linked pack jobs.
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">
                                {t('warehouse.picking.correctQuantities')}
                            </p>
                            {lines.map((line, i) => {
                                const amendedVal = parseInt(line.amended, 10);
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
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.expected')}</p>
                                                    <p className="text-sm font-black text-zinc-600 dark:text-zinc-400 font-mono">{line.required}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.picking')}</p>
                                                    <p className={`text-sm font-black font-mono ${isDiff ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>{line.picked}</p>
                                                </div>
                                                {isDiff && <ArrowRight size={14} className="text-amber-500" />}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{t('warehouse.picking.correctTo')}</p>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        pattern="[0-9]*"
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
                                            <p className="text-[9px] text-red-500 font-bold mt-1.5 text-right">{t('warehouse.picking.exceedsExpectedWarning')}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Structured Reason Code & Explanatory Note */}
                        <div className="px-6 pb-4 space-y-3 shrink-0">
                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                                    Structured Reason Code (Rule 18 Mandatory)
                                </label>
                                <select
                                    value={reasonCode}
                                    onChange={e => setReasonCode(e.target.value as PickAmendReasonCode)}
                                    className="w-full text-xs font-bold border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-400"
                                >
                                    {PICK_AMEND_REASON_CODES.map(rc => (
                                        <option key={rc.code} value={rc.code}>
                                            {rc.label} ({rc.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                                    {t('warehouse.picking.reasonForAmendment') || 'Explanatory Note'}
                                </label>
                                <textarea
                                    value={reasonNotes}
                                    onChange={e => setReasonNotes(e.target.value)}
                                    placeholder={t('warehouse.picking.reasonPlaceholder') || 'Detail the specific bin condition, item condition, or supervisor finding...'}
                                    rows={2}
                                    className="w-full text-xs border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-amber-400 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                                {t('warehouse.dismiss')}
                            </button>
                            <button
                                disabled={!hasChanges || !reasonNotes.trim()}
                                onClick={() => setStep('CONFIRM')}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:grayscale text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                <Edit3 size={13} /> {t('warehouse.picking.reviewChanges')}
                            </button>
                        </div>
                    </>
                ) : (
                    /* CONFIRM STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                {t('warehouse.picking.confirmTheseCorrections') || 'Confirm Supervisory Overrides'}
                            </p>
                            {lines.filter(l => {
                                const v = parseInt(l.amended, 10);
                                return !isNaN(v) && v !== l.picked;
                            }).map((line, i) => {
                                const delta = parseInt(line.amended, 10) - line.picked;
                                return (
                                    <div key={i} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase">{line.name}</p>
                                            <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{line.sku}</p>
                                            <span className="inline-block mt-1 text-[9px] font-black font-mono text-amber-700 dark:text-amber-400">
                                                Stock Request: {delta < 0 ? `+${Math.abs(delta)} Return to Stock (IN)` : `-${delta} Deduct from Stock (OUT)`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black font-mono text-zinc-400 line-through">{line.picked}</span>
                                            <ArrowRight size={14} className="text-amber-500" />
                                            <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-300">{line.amended}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {linkedPackJob && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-start gap-2">
                                    <CheckCircle size={13} className="text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                                        Linked PACK job ({formatJobId(linkedPackJob)}) will record shortage variance while strictly preserving original customer demand.
                                    </p>
                                </div>
                            )}

                            <div className="p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                                    <span>Supervisor: {currentUser?.name} ({currentUser?.role})</span>
                                    <span>{gpsLocation}</span>
                                </div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    Reason: {reasonCode}
                                </p>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">{reasonNotes}</p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('EDIT')}
                                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                            >
                                &larr; {t('warehouse.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={13} className="animate-spin" /> {t('warehouse.saving')}</>
                                    : <><Send size={13} /> Submit Amendment & Stock Requests</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
