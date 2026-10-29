import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckSquare, Square, FileText } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';
import type { TerminationReasonCode } from '../../../types/hr-zero-trust';

interface TerminateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    terminateInput?: string;
    setTerminateInput?: (val: string) => void;
    handleConfirmTermination?: (details?: any) => void;
    input?: string;
    setInput?: (val: string) => void;
    onConfirm?: (details?: any) => void;
}

const TERMINATION_REASONS: Array<{ code: TerminationReasonCode; label: string; desc: string }> = [
    {
        code: 'gross_misconduct',
        label: 'Gross Misconduct / Theft / Fraud',
        desc: 'Unauthorized cash withdrawal, inventory theft, or serious violence.'
    },
    {
        code: 'job_abandonment',
        label: 'Job Abandonment (Absence > 5 Days)',
        desc: 'Unexcused consecutive absence without operational notice.'
    },
    {
        code: 'voluntary_resignation',
        label: 'Voluntary Resignation',
        desc: 'Employee submitted formal letter of departure with notice.'
    },
    {
        code: 'performance_incompetence',
        label: 'Performance Incompetence (PIP Exhausted)',
        desc: 'Failed structured performance improvement plan milestones.'
    },
    {
        code: 'contract_expiration',
        label: 'Fixed-Term Contract Expiration',
        desc: 'Fixed-term agreement reached conclusion without extension.'
    },
    {
        code: 'redundancy_downsizing',
        label: 'Redundancy / Structural Downsizing',
        desc: 'Facility re-alignment or corporate operational optimization.'
    },
    {
        code: 'medical_incapacity',
        label: 'Medical Incapacity',
        desc: 'Certified medical practitioner report of fitness incapacity.'
    }
];

export default function TerminateEmployeeModal({
    isOpen,
    onClose,
    employee,
    terminateInput,
    setTerminateInput,
    handleConfirmTermination,
    input,
    setInput,
    onConfirm
}: TerminateEmployeeModalProps) {
    const today = new Date().toISOString().split('T')[0];

    const currentInput = terminateInput ?? input ?? '';
    const updateInput = setTerminateInput ?? setInput ?? (() => {});
    const triggerConfirm = onConfirm ?? handleConfirmTermination ?? (() => {});

    // Zero-Trust Form States
    const [reasonCode, setReasonCode] = useState<TerminationReasonCode>('gross_misconduct');
    const [reasonDetails, setReasonDetails] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(today);

    // Asset & Access Revocation Checklist
    const [posAccessRevoked, setPosAccessRevoked] = useState(false);
    const [wmsBadgeDeactivated, setWmsBadgeDeactivated] = useState(false);
    const [keysSurrendered, setKeysSurrendered] = useState(false);
    const [cashDrawerReconciled, setCashDrawerReconciled] = useState(false);
    const [assetsReturned, setAssetsReturned] = useState(false);

    const handleSubmit = () => {
        if (currentInput !== 'TERMINATE') return;
        triggerConfirm({
            reasonCode,
            reasonDetails: reasonDetails.trim() || 'Structured offboarding action under Zero-Trust dual control.',
            effectiveDate,
            posAccessRevoked,
            wmsBadgeDeactivated,
            keysSurrendered,
            cashDrawerReconciled,
            assetsReturned
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Operational Action: Dual-Control Termination" size="lg">
            <div className="p-6 space-y-5">
                {/* 4-Eyes & Zero-Trust Notice */}
                <div className="flex items-start gap-3 p-4 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl">
                    <AlertTriangle className="text-[var(--theme-status-danger-text)] shrink-0 mt-0.5" size={22} />
                    <div className="space-y-1">
                        <h4 className="font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] text-sm">
                            4-Eyes Dual-Control & Rule 18 Supervisory Action
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                            You are initiating formal offboarding for <strong className="font-bold">{employee?.name}</strong> ({employee?.code || employee?.id}).
                            Under Zero-Trust Rule 18, this action requires a mandatory structured reason code, checklist sign-off, and secondary manager approval.
                        </p>
                    </div>
                </div>

                {/* Structured Reason Code Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                        Mandatory Reason Code <span className="text-[var(--theme-status-danger-text)]">*</span>
                    </label>
                    <select
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value as TerminationReasonCode)}
                        className="w-full bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 dark:text-white border-[var(--theme-status-danger-border)] outline-none"
                    >
                        {TERMINATION_REASONS.map(r => (
                            <option key={r.code} value={r.code}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-stone-500 italic">
                        {TERMINATION_REASONS.find(r => r.code === reasonCode)?.desc}
                    </p>
                </div>

                {/* Reason Details & Investigation Summary */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                        Reason Details & Incident Summary <span className="text-[var(--theme-status-danger-text)]">*</span>
                    </label>
                    <textarea
                        value={reasonDetails}
                        onChange={(e) => setReasonDetails(e.target.value)}
                        placeholder="Document the exact circumstances, incident reports, or departure terms..."
                        rows={2}
                        className="w-full bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white border-[var(--theme-status-danger-border)] outline-none resize-none"
                        required
                    />
                </div>

                {/* Effective Date */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                        Effective Termination Date
                    </label>
                    <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-stone-900 dark:text-white border-[var(--theme-status-danger-border)] outline-none"
                    />
                </div>

                {/* Zero-Trust Asset & Access Revocation Checklist */}
                <div className="space-y-2 p-4 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl">
                    <h5 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" />
                        Asset Revocation & Security Handshake Checklist
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={posAccessRevoked}
                                onChange={(e) => setPosAccessRevoked(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-0"
                            />
                            <span className="text-stone-700 dark:text-stone-300">POS Register PIN Revoked</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={wmsBadgeDeactivated}
                                onChange={(e) => setWmsBadgeDeactivated(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-0"
                            />
                            <span className="text-stone-700 dark:text-stone-300">WMS Scanner Access Revoked</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={keysSurrendered}
                                onChange={(e) => setKeysSurrendered(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-0"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Physical Facility Keys Returned</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={cashDrawerReconciled}
                                onChange={(e) => setCashDrawerReconciled(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-0"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Cash Till Reconciled (No Float)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={assetsReturned}
                                onChange={(e) => setAssetsReturned(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-0"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Hardware, ID Badges & Uniforms Returned</span>
                        </label>
                    </div>
                </div>

                {/* Confirmation Typing */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase block text-center">
                        Type "TERMINATE" to confirm action
                    </label>
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => updateInput(e.target.value)}
                        className="w-full bg-black/5 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-stone-900 dark:text-white border-[var(--theme-status-danger-border)] outline-none uppercase transition-colors"
                        placeholder="TERMINATE"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={currentInput !== 'TERMINATE'}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            currentInput === 'TERMINATE'
                                ? 'bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-white shadow-lg shadow-red-600/20'
                                : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                    >
                        Submit Dual-Control Offboarding
                    </button>
                </div>
            </div>
        </Modal>
    );
}
