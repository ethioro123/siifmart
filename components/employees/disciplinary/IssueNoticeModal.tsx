import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Calendar, Lock } from 'lucide-react';
import { disciplinaryService } from '../../../services/disciplinary.service';
import type { DisciplinaryType, DisciplinarySeverity } from '../../../types/hr-advanced';
import type { Employee } from '../../../types';
import { useStore } from '../../../contexts/CentralStore';

interface IssueNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    country: string;
    employees: Employee[];
}

export function IssueNoticeModal({
    isOpen,
    onClose,
    onSuccess,
    country,
    employees
}: IssueNoticeModalProps) {
    const { user, showToast } = useStore();

    const [targetEmpId, setTargetEmpId] = useState('');
    const [recordType, setRecordType] = useState<DisciplinaryType>('Written Warning');
    const [severity, setSeverity] = useState<DisciplinarySeverity>('Medium');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [expirationDays, setExpirationDays] = useState<number | 'none'>(90);
    const [customExpiry, setCustomExpiry] = useState('');
    const [confidentialNotes, setConfidentialNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const computeExpiryDate = (): string | undefined => {
        if (customExpiry) return customExpiry;
        if (expirationDays === 'none') return undefined;
        const d = new Date();
        d.setDate(d.getDate() + expirationDays);
        return d.toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emp = employees.find(e => e.id === targetEmpId);
        if (!emp) {
            showToast('Please select a target personnel', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await disciplinaryService.issueDisciplinaryNotice({
                country_code: country,
                site_id: emp.siteId || user?.siteId,
                employee_id: emp.id,
                employee_name: emp.name,
                record_type: recordType,
                severity,
                title: title.trim(),
                description: description.trim(),
                action_taken: actionTaken.trim(),
                issued_by: user?.name || 'Supervisory Manager',
                issued_by_role: user?.role || 'store_manager',
                expires_at: computeExpiryDate(),
                confidential_notes: confidentialNotes.trim() || undefined
            });

            showToast(`Formal notice issued to ${emp.name}`, 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Failed to issue disciplinary notice', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                Issue Disciplinary Notice
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                Formal zero-trust disciplinary sanction with audit logging
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

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                    {/* Target Personnel */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)]">
                            Target Personnel <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={targetEmpId}
                            onChange={(e) => setTargetEmpId(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-medium focus:outline-hidden focus:border-[#0071E3] transition-colors"
                        >
                            <option value="">Select Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.code || emp.id.slice(0, 8)}) — {emp.role} {emp.siteId ? `[${emp.siteId}]` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notice Type & Severity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-[var(--theme-text-primary)]">
                                Notice Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value as DisciplinaryType)}
                                className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-medium focus:outline-hidden focus:border-[#0071E3]"
                            >
                                <option value="Verbal Warning">Verbal Warning</option>
                                <option value="Written Warning">Written Warning</option>
                                <option value="Final Warning">Final Warning</option>
                                <option value="Suspension">Suspension</option>
                                <option value="Formal Investigation">Formal Investigation</option>
                                <option value="Grievance">Grievance</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-semibold text-[var(--theme-text-primary)]">
                                Severity Classification <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as DisciplinarySeverity)}
                                className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-medium focus:outline-hidden focus:border-[#0071E3]"
                            >
                                <option value="Low">Low — Minor Infraction</option>
                                <option value="Medium">Medium — Standard Violation</option>
                                <option value="High">High — Serious Breach</option>
                                <option value="Critical">Critical — Gross Misconduct</option>
                            </select>
                        </div>
                    </div>

                    {/* Incident Subject / Title */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)]">
                            Incident Title / Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Unreconciled Till Variance or Safety Breach"
                            required
                            className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[#0071E3]"
                        />
                    </div>

                    {/* Description & Evidence */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)]">
                            Description & Evidentiary Findings <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Document the specific facts, CCTV timestamps, witness statements, or transaction audit logs..."
                            rows={3}
                            required
                            className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[#0071E3] resize-none"
                        />
                    </div>

                    {/* Mandated Corrective Action */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)]">
                            Mandated Corrective Action / Sanction <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                            placeholder="e.g. 90-day active record, till handling retraining, and loss recovery"
                            required
                            className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[#0071E3]"
                        />
                    </div>

                    {/* Expiration Preset Chips */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                            <Calendar size={13} />
                            <span>Warning Validity Period</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: '30 Days', val: 30 },
                                { label: '90 Days', val: 90 },
                                { label: '180 Days', val: 180 },
                                { label: '1 Year', val: 365 },
                                { label: 'Indefinite', val: 'none' as const }
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setExpirationDays(preset.val);
                                        setCustomExpiry('');
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        expirationDays === preset.val && !customExpiry
                                            ? 'bg-[#0071E3] text-white shadow-xs'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Confidential HR Notes */}
                    <div className="space-y-1.5 pt-1">
                        <label className="font-semibold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <Lock size={12} />
                            <span>Confidential HR / Legal Notes (Optional)</span>
                        </label>
                        <textarea
                            value={confidentialNotes}
                            onChange={(e) => setConfidentialNotes(e.target.value)}
                            placeholder="Internal HR-only notes regarding legal counsel, disciplinary history..."
                            rows={2}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[#0071E3] resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white font-semibold flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                            <ShieldAlert size={14} />
                            <span>{isSubmitting ? 'Issuing...' : 'Issue Formal Notice'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
