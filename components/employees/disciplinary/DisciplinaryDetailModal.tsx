import React, { useEffect } from 'react';
import { 
    X, AlertTriangle, Scale, Clock, CheckCircle2, 
    XCircle, Calendar, Shield, User, FileText, Lock 
} from 'lucide-react';
import type { DisciplinaryRecord } from '../../../types/hr-advanced';

interface DisciplinaryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: DisciplinaryRecord | null;
    onResolveAppeal: (recordId: string, resolution: 'Upheld' | 'Overturned') => void;
    canAdjudicate: boolean;
    isIssuer: boolean;
    onOpenFileAppeal: (record: DisciplinaryRecord) => void;
}

export function DisciplinaryDetailModal({
    isOpen,
    onClose,
    record,
    onResolveAppeal,
    canAdjudicate,
    isIssuer,
    onOpenFileAppeal
}: DisciplinaryDetailModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    const isExpired = record.expires_at ? new Date(record.expires_at) < new Date() : false;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            record.severity === 'Critical' || record.severity === 'High'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                            <Scale size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                    Disciplinary Case File
                                </h3>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                    record.severity === 'Critical'
                                        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                                        : record.severity === 'High'
                                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                }`}>
                                    {record.severity} Severity
                                </span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] font-mono">
                                ID: {record.id.slice(0, 8)} • {record.record_type}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                    {/* Personnel Info */}
                    <div className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Subject Personnel</span>
                            <p className="text-sm font-bold text-[var(--theme-text-primary)] mt-0.5">
                                {record.employee_name}
                            </p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                ID: {record.employee_id}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Jurisdiction</span>
                            <p className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                {record.country_code} Operations {record.site_id ? `• Site: ${record.site_id}` : ''}
                            </p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                Issued: {new Date(record.issued_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Incident Title & Details */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Incident Title</span>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            {record.title}
                        </h4>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Documented Evidence & Findings</span>
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] leading-relaxed whitespace-pre-wrap">
                            {record.description}
                        </div>
                    </div>

                    {/* Mandated Corrective Action */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Mandated Sanction / Corrective Plan</span>
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                            {record.action_taken}
                        </div>
                    </div>

                    {/* Status & Validity */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Appeal Status</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {record.appeal_status === 'Pending Appeal' && (
                                    <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                        <Clock size={13} /> Pending 4-Eyes Adjudication
                                    </span>
                                )}
                                {record.appeal_status === 'Upheld' && (
                                    <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <XCircle size={13} /> Sanction Upheld
                                    </span>
                                )}
                                {record.appeal_status === 'Overturned' && (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Warning Overturned
                                    </span>
                                )}
                                {record.appeal_status === 'None' && (
                                    <span className="text-[var(--theme-text-secondary)]">No Appeal Filed</span>
                                )}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Validity Period</span>
                            <p className="mt-1 font-semibold text-[var(--theme-text-primary)]">
                                {record.expires_at ? (
                                    <span className={isExpired ? 'text-stone-400 line-through' : 'text-emerald-600 dark:text-emerald-400'}>
                                        {isExpired ? `Expired (${record.expires_at})` : `Expires: ${record.expires_at}`}
                                    </span>
                                ) : (
                                    'Indefinite record'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Confidential Notes */}
                    {record.confidential_notes && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <Lock size={11} /> Confidential Case History & Legal Notes
                            </span>
                            <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] whitespace-pre-wrap font-mono text-[11px]">
                                {record.confidential_notes}
                            </div>
                        </div>
                    )}

                    {/* Issuer Attribution */}
                    <div className="pt-2 text-[11px] text-[var(--theme-text-secondary)] flex items-center justify-between border-t border-[var(--theme-border)]">
                        <span>Issued by: <strong className="text-[var(--theme-text-primary)]">{record.issued_by}</strong> ({record.issued_by_role})</span>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                    <div>
                        {record.appeal_status === 'None' && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenFileAppeal(record);
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 border border-purple-500/30 transition-all cursor-pointer"
                            >
                                File Formal Appeal
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {record.appeal_status === 'Pending Appeal' && canAdjudicate && (
                            <>
                                {isIssuer ? (
                                    <span className="text-[11px] text-amber-500 font-semibold px-2">
                                        4-Eyes rule: As notice issuer, you cannot adjudicate
                                    </span>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResolveAppeal(record.id, 'Overturned');
                                                onClose();
                                            }}
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all cursor-pointer"
                                        >
                                            Overturn Sanction
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResolveAppeal(record.id, 'Upheld');
                                                onClose();
                                            }}
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-all cursor-pointer"
                                        >
                                            Uphold Sanction
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
