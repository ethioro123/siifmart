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

const AUTHORIZED_SUPERVISORY_ROLES = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'store_manager', 'inventory_manager', 'regional_supply_chain_manager', 'assistant_store_manager', 'shift_supervisor', 'dispatch_supervisor', 'country_commercial_director', 'country_supply_chain_director'];

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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[var(--theme-status-warning-bg)] rounded-2xl border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]">
                            <FileEdit size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                    {t('warehouse.picking.amendPickQuantities')}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                    Zero-Trust
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                <span>{formatJobId(job)}</span>
                                <span className="opacity-40">/</span>
                                <span className="flex items-center gap-1 text-[var(--theme-accent)]">
                                    <MapPin size={11} /> {gpsLocation}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Auth guard */}
                {!isManager ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 text-center">
                        <div className="p-4 bg-[var(--theme-status-danger-bg)] rounded-2xl border border-[var(--theme-status-danger-border)] mb-4 text-[var(--theme-status-danger-text)]">
                            <ShieldAlert size={32} />
                        </div>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            {t('warehouse.picking.supervisorRequired') || 'Supervisory Authority Required'}
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 max-w-md">
                            Zero-Trust Rule 18: Pick amendments are managerial overrides that affect stock balances and require authenticated supervisor credentials.
                        </p>
                    </div>
                ) : step === 'EDIT' ? (
                    <>
                        {/* Info Banner */}
                        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex items-start gap-2.5 shrink-0">
                            <AlertTriangle size={15} className="text-[var(--theme-status-warning-text)] mt-0.5 shrink-0" />
                            <div className="text-[11px] text-[var(--theme-text-primary)] leading-relaxed">
                                <span className="font-semibold">Zero-Trust Notice:</span> Amending quantities creates a pending inventory request for Central HQ review and preserves original customer requirement on linked pack jobs.
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar bg-[var(--theme-bg-subtle)]">
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">
                                {t('warehouse.picking.correctQuantities')}
                            </p>
                            {lines.map((line, i) => {
                                const amendedVal = parseInt(line.amended, 10);
                                const isValid = !isNaN(amendedVal) && amendedVal >= 0;
                                const isDiff = isValid && amendedVal !== line.picked;
                                const isOver = isValid && amendedVal > line.required;
                                return (
                                    <div
                                        key={i}
                                        className={`p-4 rounded-2xl border transition-colors ${
                                            isDiff ? 'bg-[var(--theme-bg-card)] border-[var(--theme-status-warning-border)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-tight truncate">{line.name}</p>
                                                <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] uppercase tracking-wider mt-0.5">{line.sku}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                                <div className="text-center">
                                                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.expected')}</p>
                                                    <p className="text-sm font-bold text-[var(--theme-text-primary)] font-mono">{line.required}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.picking')}</p>
                                                    <p className={`text-sm font-bold font-mono ${isDiff ? 'line-through text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'}`}>{line.picked}</p>
                                                </div>
                                                {isDiff && <ArrowRight size={14} className="text-[var(--theme-status-warning-text)]" />}
                                                <div className="text-center">
                                                    <p className="text-[11px] font-semibold text-[var(--theme-status-warning-text)] uppercase tracking-wider">{t('warehouse.picking.correctTo')}</p>
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
                                                        className={`w-16 text-center text-sm font-bold font-mono border rounded-xl px-2 py-1.5 focus:outline-none transition-colors min-h-[36px] ${
                                                            isOver
                                                                ? 'border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)]'
                                                                : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-status-warning-border)]'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {isOver && (
                                            <p className="text-[11px] text-[var(--theme-status-danger-text)] font-semibold mt-1 text-right">{t('warehouse.picking.exceedsExpectedWarning')}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Structured Reason Code & Explanatory Note */}
                        <div className="p-4 sm:p-6 bg-[var(--theme-bg-card)] border-t border-[var(--theme-border)] space-y-3 shrink-0">
                            <div>
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                                    Structured Reason Code (Rule 18 Mandatory)
                                </label>
                                <select
                                    value={reasonCode}
                                    onChange={e => setReasonCode(e.target.value as PickAmendReasonCode)}
                                    className="w-full text-xs font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] rounded-xl px-3 py-2.5 text-[var(--theme-text-primary)] focus:outline-none border-[var(--theme-status-warning-border)] min-h-[44px]"
                                >
                                    {PICK_AMEND_REASON_CODES.map(rc => (
                                        <option key={rc.code} value={rc.code}>
                                            {rc.label} ({rc.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                                    {t('warehouse.picking.reasonForAmendment') || 'Explanatory Note'}
                                </label>
                                <textarea
                                    value={reasonNotes}
                                    onChange={e => setReasonNotes(e.target.value)}
                                    placeholder={t('warehouse.picking.reasonPlaceholder') || 'Detail the specific bin condition, item condition, or supervisor finding...'}
                                    rows={2}
                                    className="w-full text-xs border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] rounded-xl px-3 py-2.5 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none border-[var(--theme-status-warning-border)] transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px]"
                            >
                                {t('warehouse.dismiss')}
                            </button>
                            <button
                                disabled={!hasChanges || !reasonNotes.trim()}
                                onClick={() => setStep('CONFIRM')}
                                className="px-6 py-2.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] disabled:opacity-40 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 min-h-[44px]"
                            >
                                <Edit3 size={14} /> {t('warehouse.picking.reviewChanges')}
                            </button>
                        </div>
                    </>
                ) : (
                    /* CONFIRM STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[var(--theme-bg-subtle)]">
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                {t('warehouse.picking.confirmTheseCorrections') || 'Confirm Supervisory Overrides'}
                            </p>
                            {lines.filter(l => {
                                const v = parseInt(l.amended, 10);
                                return !isNaN(v) && v !== l.picked;
                            }).map((line, i) => {
                                const delta = parseInt(line.amended, 10) - line.picked;
                                return (
                                    <div key={i} className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase">{line.name}</p>
                                            <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5">{line.sku}</p>
                                            <span className="inline-block mt-1 text-[11px] font-semibold font-mono text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                                Stock Request: {delta < 0 ? `+${Math.abs(delta)} Return to Stock (IN)` : `-${delta} Deduct from Stock (OUT)`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold font-mono text-[var(--theme-text-secondary)] line-through">{line.picked}</span>
                                            <ArrowRight size={14} className="text-[var(--theme-status-warning-text)]" />
                                            <span className="text-sm font-bold font-mono text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">{line.amended}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {linkedPackJob && (
                                <div className="p-3.5 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-2xl flex items-start gap-2">
                                    <CheckCircle size={14} className="text-[var(--theme-status-info-text)] mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] font-medium">
                                        Linked PACK job ({formatJobId(linkedPackJob)}) will record shortage variance while strictly preserving original customer demand.
                                    </p>
                                </div>
                            )}

                            <div className="p-3.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl space-y-1 font-mono text-[11px]">
                                <div className="flex justify-between text-[var(--theme-text-secondary)]">
                                    <span>Supervisor: {currentUser?.name} ({currentUser?.role})</span>
                                    <span>{gpsLocation}</span>
                                </div>
                                <p className="text-[var(--theme-text-secondary)] font-semibold uppercase">
                                    Reason: {reasonCode}
                                </p>
                                <p className="text-[var(--theme-text-primary)] italic font-sans">{reasonNotes}</p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('EDIT')}
                                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px]"
                            >
                                {t('warehouse.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                className="px-6 py-2.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 min-h-[44px]"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={14} className="animate-spin" /> {t('warehouse.saving')}</>
                                    : <><Send size={14} /> {t('warehouse.picking.submitAmendmentAndStockRequests') || 'Submit Amendment & Stock Requests'}</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
