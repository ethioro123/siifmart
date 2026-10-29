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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-xs animate-in fade-in duration-150"
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
                                ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
                                : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]'
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
                                        ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]'
                                        : record.severity === 'High'
                                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'
                                        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'
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
                        <div className="p-3 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">
                            {record.action_taken}
                        </div>
                    </div>

                    {/* Status & Validity */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Appeal Status</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {record.appeal_status === 'Pending Appeal' && (
                                    <span className="font-bold text-[var(--theme-accent)] text-[var(--theme-accent)] flex items-center gap-1">
                                        <Clock size={13} /> Pending 4-Eyes Adjudication
                                    </span>
                                )}
                                {record.appeal_status === 'Upheld' && (
                                    <span className="font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center gap-1">
                                        <XCircle size={13} /> Sanction Upheld
                                    </span>
                                )}
                                {record.appeal_status === 'Overturned' && (
                                    <span className="font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-1">
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
                                    <span className={isExpired ? 'text-[var(--theme-text-muted)] line-through' : 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'}>
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
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent-muted)] border border-[var(--theme-border-accent)] transition-all cursor-pointer"
                            >
                                File Formal Appeal
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {record.appeal_status === 'Pending Appeal' && canAdjudicate && (
                            <>
                                {isIssuer ? (
                                    <span className="text-[11px] text-[var(--theme-status-warning-text)] font-semibold px-2">
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
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] transition-all cursor-pointer"
                                        >
                                            Overturn Sanction
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResolveAppeal(record.id, 'Upheld');
                                                onClose();
                                            }}
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] shadow-xs transition-all cursor-pointer"
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
