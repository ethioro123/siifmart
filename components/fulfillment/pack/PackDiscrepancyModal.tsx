import React, { useState, useEffect } from 'react';
import {
    X, AlertTriangle, CheckCircle, Loader2, ShieldAlert,
    Package, Minus, Plus, ArrowRight, ClipboardList, ShieldCheck, KeyRound, UserCheck
} from 'lucide-react';
import { WMSJob, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { getCachedAuditLocation } from '../../../utils/geolocationHelper';
import { matchStaffPin } from '../../../utils/employeeIdGenerator';

type ReasonCode = 'underpack' | 'overpack' | 'wrong_item' | 'damaged' | 'short_picked';

const SUPERVISORY_ROLES = [
    'super_admin',
    'ceo',
    'operations_manager',
    'warehouse_manager',
    'inventory_manager',
    'store_manager',
    'shift_supervisor',
    'inventory_specialist'
];

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
    const { employees, logSystemEvent } = useData();
    
    const reasonOptions = [
        { id: 'short_picked' as const, label: t('warehouse.packing.shortPicked'), desc: t('warehouse.packing.shortPickedDesc'), color: 'text-amber-500' },
        { id: 'underpack' as const, label: t('warehouse.packing.underpack'), desc: t('warehouse.packing.underpackDesc'), color: 'text-orange-500' },
        { id: 'overpack' as const, label: t('warehouse.packing.overpack'), desc: t('warehouse.packing.overpackDesc'), color: 'text-blue-500' },
        { id: 'wrong_item' as const, label: t('warehouse.packing.wrongItem'), desc: t('warehouse.packing.wrongItemDesc'), color: 'text-purple-500' },
        { id: 'damaged' as const, label: t('warehouse.packing.damaged') || 'Damaged', desc: t('warehouse.packing.damagedDesc'), color: 'text-red-500' },
    ];

    const [lines, setLines] = useState<PackDiscrepLine[]>([]);
    const [reasonCode, setReasonCode] = useState<ReasonCode>('short_picked');
    const [notes, setNotes] = useState('');
    const [supervisorPin, setSupervisorPin] = useState('');
    const [authError, setAuthError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'COUNT' | 'REASON' | 'DONE'>('COUNT');

    useEffect(() => {
        if (!isOpen || !job?.lineItems) return;
        setStep('COUNT');
        setNotes('');
        setReasonCode('short_picked');
        setSupervisorPin('');
        setAuthError('');
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

    const linkedPicker = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo || e.code === job.assignedTo);
    const linkedPickerName = linkedPicker?.name || job.assignedTo || 'Unassigned Picker';

    const handleSubmit = async () => {
        setAuthError('');

        if (!supervisorPin.trim()) {
            setAuthError('Supervisor PIN or Employee ID is required for pack discrepancy authorization.');
            return;
        }

        const supervisor = employees.find(emp => {
            const matchesPin = matchStaffPin(emp.code || emp.id, supervisorPin) || supervisorPin === emp.code || supervisorPin === emp.id;
            const isDifferentUser = emp.id !== currentUser?.id && emp.name !== currentUser?.name;
            const hasRole = SUPERVISORY_ROLES.includes((emp.role || '').toLowerCase());
            return matchesPin && isDifferentUser && hasRole;
        });

        if (!supervisor) {
            const isSelf = employees.find(emp => matchStaffPin(emp.code || emp.id, supervisorPin) && (emp.id === currentUser?.id || emp.name === currentUser?.name));
            if (isSelf) {
                setAuthError('Dual-control violation: Packer cannot self-authorize a pack discrepancy.');
            } else {
                setAuthError('Invalid credentials. Authorized supervisor PIN required.');
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const gpsLocation = await getCachedAuditLocation();

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
                        supervisorId: supervisor.id,
                        supervisorName: supervisor.name,
                        supervisorRole: supervisor.role,
                        linkedPicker: job.assignedTo || 'Unassigned',
                        gpsLocation,
                        reportedAt: new Date().toISOString(),
                    } : undefined,
                };
            });

            const auditNote = `[PACK DISCREPANCY by ${currentUser?.name || 'Packer'} | Co-Signed by ${supervisor.name} (${supervisor.role}) at ${new Date().toLocaleString()}] Reason: ${reasonOptions.find((r: any) => r.id === reasonCode)?.label}. Picker: ${linkedPickerName}. ${notes}`;

            await wmsJobsService.update(job.id, {
                lineItems: updatedLineItems,
                hasDiscrepancy: true,
                notes: job.notes ? `${job.notes}\n${auditNote}` : auditNote,
            } as any);

            await logSystemEvent(
                'PACK_DISCREPANCY_ATTRIBUTED',
                {
                    jobId: job.id,
                    orderRef: job.orderRef,
                    reasonCode,
                    notes,
                    reportedBy: currentUser?.name || 'Packer',
                    supervisorId: supervisor.id,
                    supervisorName: supervisor.name,
                    supervisorRole: supervisor.role,
                    linkedPicker: linkedPickerName,
                    discrepancies: lines
                        .filter(l => {
                            const val = parseInt(l.actualCount);
                            return !isNaN(val) && val !== l.expected;
                        })
                        .map(l => ({
                            sku: l.sku,
                            name: l.name,
                            expected: l.expected,
                            actual: parseInt(l.actualCount),
                            variance: parseInt(l.actualCount) - l.expected,
                        })),
                },
                currentUser?.name || 'Packer',
                'Warehouse',
                {
                    employeeId: currentUser?.id,
                    siteId: job.siteId || job.site_id,
                    gpsLocation,
                    entityType: 'WMSJob',
                    entityId: job.id,
                    metadata: {
                        supervisorId: supervisor.id,
                        supervisorName: supervisor.name,
                        supervisorRole: supervisor.role,
                        linkedPicker: linkedPickerName,
                    }
                }
            );

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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">{t('warehouse.packing.flagDiscrepancy')}</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono uppercase tracking-wider mt-0.5">{formatJobId(job)} · {t('warehouse.packing.packerCountVsManifest')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 min-w-[44px] min-h-[44px] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors flex items-center justify-center"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {step === 'DONE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 mb-4 text-green-500">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider mb-2">{t('warehouse.packing.discrepancyLogged')}</h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] max-w-xs">{t('warehouse.packing.discrepancySuccessDesc')}</p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-8 py-3 min-h-[44px] bg-[var(--theme-text-primary)] text-[var(--theme-bg-app)] font-semibold text-xs uppercase tracking-wider rounded-xl transition-opacity hover:opacity-90 cursor-pointer"
                        >
                            {t('warehouse.dismiss')}
                        </button>
                    </div>
                ) : step === 'COUNT' ? (
                    <>
                        {/* Instructions */}
                        <div className="mx-4 sm:mx-5 mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-2.5 shrink-0">
                            <AlertTriangle size={15} className="text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium leading-relaxed">
                                {t('warehouse.packing.discrepancyInstructions')}
                            </p>
                        </div>
                        {/* Line items count */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">{t('warehouse.packing.physicalCount')}</p>
                            {lines.map((line, i) => {
                                const actual = parseInt(line.actualCount);
                                const isDiff = !isNaN(actual) && actual !== line.expected;
                                const isShort = isDiff && actual < line.expected;
                                return (
                                    <div key={i} className={`p-4 rounded-2xl border transition-colors ${
                                        isDiff
                                            ? isShort
                                                ? 'bg-red-500/5 border-red-500/30'
                                                : 'bg-blue-500/5 border-blue-500/30'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                    }`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] flex items-center justify-center shrink-0 text-[var(--theme-text-secondary)]">
                                                    <Package size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase truncate">{line.name}</p>
                                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)]">{line.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Manifest count */}
                                                <div className="text-center">
                                                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase">{t('warehouse.expected')}</p>
                                                    <p className="text-sm font-semibold font-mono text-[var(--theme-text-secondary)]">{line.expected}</p>
                                                </div>
                                                {isDiff && <ArrowRight size={14} className={isShort ? 'text-red-500' : 'text-blue-500'} />}
                                                {/* Actual count stepper */}
                                                <div className="text-center">
                                                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase">{t('warehouse.picking')}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <button
                                                            onClick={() => adjustLine(i, -1)}
                                                            className="w-8 h-8 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] transition-colors"
                                                            aria-label={t('warehouse.packing.decreaseQuantity')}
                                                            title={t('warehouse.packing.decreaseQuantity')}
                                                        >
                                                            <Minus size={12} />
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
                                                            className={`w-12 text-center text-sm font-semibold font-mono border rounded-xl px-1 py-1 focus:outline-none transition-colors ${
                                                                isDiff
                                                                    ? isShort
                                                                        ? 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400'
                                                                        : 'border-blue-400 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                    : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]'
                                                            }`}
                                                        />
                                                        <button
                                                            onClick={() => adjustLine(i, 1)}
                                                            className="w-8 h-8 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] transition-colors"
                                                            aria-label={t('warehouse.packing.increaseQuantity')}
                                                            title={t('warehouse.packing.increaseQuantity')}
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {isDiff && (
                                            <div className={`mt-2 text-[11px] font-semibold text-right ${isShort ? 'text-red-500' : 'text-blue-500'}`}>
                                                {isShort ? `▼ ${line.expected - (actual || 0)} ${t('warehouse.packing.missing')}` : `▲ ${(actual || 0) - line.expected} ${t('warehouse.packing.extra')}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                            >
                                {t('warehouse.dismiss')}
                            </button>
                            <button
                                disabled={!hasDiscrepancy}
                                onClick={() => setStep('REASON')}
                                className="px-6 py-2.5 min-h-[44px] bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:grayscale text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                                <AlertTriangle size={15} /> {t('warehouse.packing.logDiscrepancy')}
                            </button>
                        </div>
                    </>
                ) : (
                    /* REASON STEP */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.packing.selectReasonCode')}</p>
                            <div className="space-y-2">
                                {reasonOptions.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setReasonCode(r.id)}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                                            reasonCode === r.id
                                                ? 'bg-orange-500/10 border-orange-500/30'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${reasonCode === r.id ? 'border-orange-500 bg-orange-500' : 'border-[var(--theme-border)]'}`} />
                                        <div>
                                            <p className={`text-xs font-semibold uppercase tracking-wide ${r.color}`}>{r.label}</p>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">{r.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">{t('warehouse.packing.additionalNotes')}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t('warehouse.packing.additionalNotesPlaceholder')}
                                    rows={2}
                                    className="w-full text-xs border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-orange-400 transition-colors resize-none"
                                />
                            </div>

                            {/* Linked Order Picker Card */}
                            <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <UserCheck size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.packing.linkedPicker') || 'Linked Order Picker'}</p>
                                        <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{linkedPickerName}</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] px-2.5 py-1 rounded-lg border border-[var(--theme-border)]">
                                    {job.assignedTo || 'Unassigned'}
                                </span>
                            </div>

                            {/* Mandatory Supervisor Co-Attribution Card */}
                            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck size={18} className="text-orange-600 dark:text-orange-400 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-semibold text-orange-900 dark:text-orange-200 uppercase tracking-wider">
                                            {t('warehouse.packing.supervisorSignOff') || 'Supervisor Co-Attribution (Dual Control)'}
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                            {t('warehouse.packing.supervisorPinDesc') || 'A supervisor PIN or Employee ID is required to authorize and attribute this variance.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="relative">
                                        <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                                        <input
                                            type="password"
                                            value={supervisorPin}
                                            onChange={e => {
                                                setSupervisorPin(e.target.value);
                                                if (authError) setAuthError('');
                                            }}
                                            placeholder="Enter Supervisor PIN / Employee ID..."
                                            className="w-full text-xs font-mono pl-10 pr-4 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl focus:outline-none focus:border-orange-500 text-[var(--theme-text-primary)] min-h-[44px]"
                                        />
                                    </div>
                                    {authError && (
                                        <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                                            <AlertTriangle size={12} className="shrink-0" /> {authError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('COUNT')}
                                className="px-5 py-2.5 min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                            >
                                &larr; {t('warehouse.driverHub.back')}
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="px-6 py-2.5 min-h-[44px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={15} className="animate-spin" /> {t('warehouse.driverHub.saving')}</>
                                    : <><CheckCircle size={15} /> {t('warehouse.packing.confirmAndLog')}</>
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
