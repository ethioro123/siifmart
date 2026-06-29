import React, { useState, useEffect } from 'react';
import {
    X, AlertTriangle, CheckCircle, Loader2, ShieldAlert,
    Package, Minus, Plus, ArrowRight, ClipboardList
} from 'lucide-react';
import { WMSJob, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';

type ReasonCode = 'underpack' | 'overpack' | 'wrong_item' | 'damaged' | 'short_picked';

interface PackDiscrepLine {
    index: number;
    name: string;
    sku: string;
    expected: number;   // from pick manifest
    actualCount: string; // what packer physically counted
}

export const PackDiscrepancyModal: React.FC<PackDiscrepancyModalProps> = ({
    isOpen,
    onClose,
    job,
    currentUser,
    wmsJobsService,
    addNotification,
    refreshData,
    onAcceptCount,
}) => {
    const { t } = useLanguage();
    
    const reasonOptions = [
        { id: 'short_picked' as const, label: t('warehouse.packing.shortPicked'), desc: t('warehouse.packing.shortPickedDesc'), color: 'text-amber-500' },
        { id: 'underpack' as const, label: t('warehouse.packing.underpack'), desc: t('warehouse.packing.underpackDesc'), color: 'text-orange-500' },
        { id: 'overpack' as const, label: t('warehouse.packing.overpack'), desc: t('warehouse.packing.overpackDesc'), color: 'text-blue-500' },
        { id: 'wrong_item' as const, label: t('warehouse.packing.wrongItem'), desc: t('warehouse.packing.wrongItemDesc'), color: 'text-purple-500' },
        { id: 'damaged' as const, label: t('warehouse.picking.damaged') || 'Damaged', desc: t('warehouse.packing.damagedDesc'), color: 'text-red-500' },
    ];

    const [lines, setLines] = useState<PackDiscrepLine[]>([]);
    const [reasonCode, setReasonCode] = useState<ReasonCode>('short_picked');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'COUNT' | 'REASON' | 'DONE'>('COUNT');

    useEffect(() => {
        if (!isOpen || !job?.lineItems) return;
        setStep('COUNT');
        setNotes('');
        setReasonCode('short_picked');
        setLines(
            (job.lineItems as any[]).map((item: any, idx: number) => ({
                index: idx,
                name: item.name || item.productName || 'Unknown',
                sku: item.sku || '',
                expected: item.pickedQty ?? item.expectedQty ?? 0,
                actualCount: String(item.pickedQty ?? item.expectedQty ?? 0),
            }))
        );
    }, [isOpen, job]);

    if (!isOpen || !job) return null;

    const hasDiscrepancy = lines.some(l => {
        const v = parseInt(l.actualCount);
        return !isNaN(v) && v !== l.expected;
    });

    const adjustLine = (idx: number, delta: number) => {
        setLines(prev => prev.map((l, i) => {
            if (i !== idx) return l;
            const current = parseInt(l.actualCount) || 0;
            const next = Math.max(0, current + delta);
            return { ...l, actualCount: String(next) };
        }));
    };

    const setLineVal = (idx: number, val: string) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, actualCount: val } : l));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const updatedLineItems = (job.lineItems as any[]).map((item: any, idx: number) => {
                const line = lines[idx];
                const actualVal = parseInt(line.actualCount);
                const actual = !isNaN(actualVal) ? actualVal : line.expected;
                return {
                    ...item,
                    pickedQty: actual,
                    packDiscrepancy: actual !== line.expected ? {
                        expected: line.expected,
                        actual,
                        variance: actual - line.expected,
                        reasonCode,
                        reportedBy: currentUser?.name || 'Packer',
                        reportedAt: new Date().toISOString(),
                    } : undefined,
                };
            });

            const auditNote = `[PACK DISCREPANCY by ${currentUser?.name || 'Packer'} at ${new Date().toLocaleString()}] Reason: ${reasonOptions.find((r: any) => r.id === reasonCode)?.label}. ${notes}`;

            await wmsJobsService.update(job.id, {
                lineItems: updatedLineItems,
                hasDiscrepancy: true,
                notes: job.notes ? `${job.notes}\n${auditNote}` : auditNote,
            } as any);

            onAcceptCount?.(updatedLineItems);
            await refreshData();
            setStep('DONE');
            addNotification('info', t('warehouse.packing.packDiscrepancyLogged').replace('{jobId}', formatJobId(job)));
        } catch (err: any) {
            addNotification('alert', t('warehouse.packing.failedToLogDiscrepancy') + (err?.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 border-2 border-orange-500/30 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Ambient glow */}
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-5 border-b border-zinc-200 dark:border-white/10 bg-orange-50/60 dark:bg-orange-900/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/15 rounded-xl border border-orange-500/30">
                            <ClipboardList size={18} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{t('warehouse.packing.flagDiscrepancy')}</h3>
                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">{formatJobId(job)} · {t('warehouse.packing.packerCountVsManifest')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={18} className="text-zinc-500" />
                    </button>
                </div>

                {step === 'DONE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center border border-green-500/20 mb-4">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-2">{t('warehouse.packing.discrepancyLogged')}</h4>
                        <p className="text-xs text-zinc-500 max-w-xs">{t('warehouse.packing.discrepancySuccessDesc')}</p>
                        <button
                            onClick={onClose}
                            className="mt-8 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:opacity-80"
                        >
                            {t('warehouse.dismiss')}
                        </button>
                    </div>
                ) : step === 'COUNT' ? (
                    <>
                        {/* Instructions */}
                        <div className="mx-5 mt-4 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-xl flex items-start gap-2 shrink-0">
                            <AlertTriangle size={13} className="text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-orange-700 dark:text-orange-400 font-bold leading-relaxed">
                                {t('warehouse.packing.discrepancyInstructions')}
                            </p>
                        </div>
                        {/* Line items count */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{t('warehouse.packing.physicalCount')}</p>
                            {lines.map((line, i) => {
                                const actual = parseInt(line.actualCount);
                                const isDiff = !isNaN(actual) && actual !== line.expected;
                                const isShort = isDiff && actual < line.expected;
                                const isOver = isDiff && actual > line.expected;
                                return (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all ${isDiff ? (isShort ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-500/30' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-500/30') : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10'}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 bg-zinc-100 dark:bg-black/40 rounded-lg flex items-center justify-center shrink-0">
                                                    <Package size={14} className="text-zinc-505" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase truncate">{line.name}</p>
                                                    <p className="text-[9px] font-mono text-zinc-400">{line.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Manifest count */}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.expected')}</p>
                                                    <p className="text-sm font-black font-mono text-zinc-500">{line.expected}</p>
                                                </div>
                                                {isDiff && <ArrowRight size={13} className={isShort ? 'text-red-400' : 'text-blue-400'} />}
                                                {/* Actual count stepper */}
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{t('warehouse.picking')}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <button
                                                            onClick={() => adjustLine(i, -1)}
                                                            className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-white/10 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors"
                                                            aria-label={t('warehouse.packing.decreaseQuantity')}
                                                            title={t('warehouse.packing.decreaseQuantity')}
                                                        >
                                                            <Minus size={10} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            pattern="[0-9]*"
                                                            min={0}
                                                            value={line.actualCount}
                                                            onChange={e => setLineVal(i, e.target.value)}
                                                            aria-label="Counted quantity"
                                                            title="Counted quantity"
                                                            placeholder="0"
                                                            className={`w-12 text-center text-sm font-black font-mono border rounded-lg px-1 py-0.5 focus:outline-none transition-all ${isDiff
                                                                ? isShort
                                                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-300'
                                                                    : 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300'
                                                                : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-black/40 text-zinc-800 dark:text-zinc-200'
                                                            }`}
                                                        />
                                                        <button
                                                            onClick={() => adjustLine(i, 1)}
                                                            className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-white/10 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors"
                                                            aria-label={t('warehouse.packing.increaseQuantity')}
                                                            title={t('warehouse.packing.increaseQuantity')}
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {isDiff && (
                                            <div className={`mt-2 text-[9px] font-black text-right ${isShort ? 'text-red-500' : 'text-blue-500'}`}>
                                                {isShort ? `▼ ${line.expected - (actual || 0)} ${t('warehouse.packing.missing')}` : `▲ ${(actual || 0) - line.expected} ${t('warehouse.packing.extra')}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button onClick={onClose} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                                {t('warehouse.dismiss')}
                            </button>
                            <button
                                disabled={!hasDiscrepancy}
                                onClick={() => setStep('REASON')}
                                className="px-8 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:grayscale text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                            >
                                <AlertTriangle size={13} /> {t('warehouse.packing.logDiscrepancy')}
                            </button>
                        </div>
                    </>
                ) : (
                    /* REASON STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            <p className="text-[9px] font-black text-zinc-405 uppercase tracking-[0.2em]">{t('warehouse.packing.selectReasonCode')}</p>
                            <div className="space-y-2">
                                {reasonOptions.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setReasonCode(r.id)}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${reasonCode === r.id
                                            ? 'bg-orange-50 dark:bg-orange-900/15 border-orange-300 dark:border-orange-500/30'
                                            : 'bg-zinc-55 dark:bg-white/5 border-zinc-200 dark:border-white/10 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${reasonCode === r.id ? 'border-orange-500 bg-orange-500' : 'border-zinc-400'}`} />
                                        <div>
                                            <p className={`text-xs font-black uppercase tracking-wide ${r.color}`}>{r.label}</p>
                                            <p className="text-[10px] text-zinc-405 mt-0.5">{r.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">{t('warehouse.packing.additionalNotes')}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t('warehouse.packing.additionalNotesPlaceholder')}
                                    rows={2}
                                    className="w-full text-xs border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 rounded-xl px-4 py-3 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-450 dark:placeholder:text-zinc-700 focus:outline-none focus:border-orange-400 transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center shrink-0">
                            <button onClick={() => setStep('COUNT')} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                                &larr; {t('warehouse.driverHub.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="px-8 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={13} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                    : <><CheckCircle size={13} /> {t('warehouse.packing.confirmAndLog')}</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

interface PackDiscrepancyModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    currentUser: User | null;
    wmsJobsService: any;
    addNotification: (type: 'success' | 'alert' | 'info', msg: string) => void;
    refreshData: () => Promise<void>;
    /** Called when packer accepts count — updates job line items */
    onAcceptCount?: (updatedLineItems: any[]) => void;
}
