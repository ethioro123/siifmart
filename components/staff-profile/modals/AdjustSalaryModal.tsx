import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ShieldAlert, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { salaryRequestsService } from '../../../services/salary-requests.service';
import type { Employee } from '../../../types';
import { getEmployeeJobTitle, getRoleHierarchy } from '../../../utils/roles';

interface AdjustSalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    salaryInput?: string;
    setSalaryInput?: (val: string) => void;
    handleConfirmSalary?: () => void;
    onSuccess?: () => void;
}

export default function AdjustSalaryModal({
    isOpen,
    onClose,
    employee,
    salaryInput,
    setSalaryInput,
    handleConfirmSalary,
    onSuccess
}: AdjustSalaryModalProps) {
    const { user } = useStore();
    const { settings, activeSite, sites, effectiveCountry, updateEmployee, addNotification } = useData();

    const initialSalaryStr = salaryInput !== undefined && salaryInput !== ''
        ? salaryInput
        : (employee.salary ? String(employee.salary) : '');

    const [proposedSalaryStr, setProposedSalaryStr] = useState<string>(initialSalaryStr);
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const isExecutive = ['group_ceo'].includes(user?.role || '');
    const [directOverride, setDirectOverride] = useState<boolean>(isExecutive);

    const isTargetCEO = ['group_ceo'].includes(employee.role || '');
    const isSelf = Boolean(user?.id && user.id === employee.id);
    const actorLevel = user?.role ? getRoleHierarchy(user.role) : 0;
    const targetLevel = getRoleHierarchy(employee.role);
    const isSubordinateOrPeer = !isExecutive && actorLevel <= targetLevel;

    const isForbidden = (isTargetCEO && !isExecutive) || isSelf || isSubordinateOrPeer;
    const forbiddenReason = (isTargetCEO && !isExecutive)
        ? 'Access Denied: Subordinate roles (including Country MD) cannot adjust or propose compensation for the Global CEO.'
        : isSelf
        ? 'Zero-Trust Anti-Fraud Violation: You cannot adjust or propose an adjustment for your own salary.'
        : isSubordinateOrPeer
        ? `Hierarchy Violation: Subordinate/peer role "${user?.role}" (Level ${actorLevel}) cannot adjust compensation for "${employee.role}" (Level ${targetLevel}).`
        : null;

    useEffect(() => {
        if (isOpen) {
            const val = salaryInput !== undefined && salaryInput !== ''
                ? salaryInput
                : (employee.salary ? String(employee.salary) : '');
            setProposedSalaryStr(val);
            setReason('');
            setErrorMessage('');
            setDirectOverride(isExecutive);
        }
    }, [isOpen, employee, salaryInput, isExecutive]);

    const employeeSite = sites.find(s => s.id === employee.siteId);
    const currency = employeeSite?.currency || (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;
    const country = (employeeSite?.country || effectiveCountry || 'ET').toUpperCase();
    const currentSalary = Number(employee.salary) || 0;

    const parsedProposed = parseFloat(proposedSalaryStr);
    const isValidAmount = !isNaN(parsedProposed) && parsedProposed > 0;
    const diff = isValidAmount ? parsedProposed - currentSalary : 0;
    const pctChange = isValidAmount && currentSalary > 0
        ? ((diff / currentSalary) * 100).toFixed(1)
        : (isValidAmount ? '100.0' : '0.0');

    const handleInputChange = (val: string) => {
        setProposedSalaryStr(val);
        if (setSalaryInput) setSalaryInput(val);
        if (errorMessage) setErrorMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (isForbidden) {
            setErrorMessage(forbiddenReason || 'Unauthorized compensation adjustment.');
            return;
        }

        if (!isValidAmount) {
            setErrorMessage('Please enter a valid positive salary amount.');
            return;
        }

        if (parsedProposed === currentSalary) {
            setErrorMessage('Proposed salary is identical to current salary.');
            return;
        }

        if (!reason.trim() || reason.trim().length < 5) {
            setErrorMessage('A detailed justification (min 5 characters) is required under Dual-Control policy.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isExecutive && directOverride) {
                // Executive Direct Override: Create request + approve immediately
                const created = await salaryRequestsService.create({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    currentSalary,
                    proposedSalary: parsedProposed,
                    currency,
                    siteId: employee.siteId,
                    countryCode: country,
                    reason: `[Executive Override] ${reason.trim()}`,
                    status: 'pending',
                    requestedBy: user?.name || 'Executive',
                    requestedByRole: user?.role || 'group_ceo',
                    requestedAt: new Date().toISOString()
                });

                await salaryRequestsService.approve(created.id, {
                    id: user?.id,
                    name: user?.name || 'Executive',
                    role: user?.role || 'group_ceo'
                });

                updateEmployee({ ...employee, salary: parsedProposed }, user?.name || 'Executive');
                addNotification('success', `Salary updated to ${currency} ${parsedProposed.toLocaleString()} (Executive Override).`);
            } else {
                // Standard Dual-Control: Propose to approval queue
                await salaryRequestsService.create({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    currentSalary,
                    proposedSalary: parsedProposed,
                    currency,
                    siteId: employee.siteId,
                    countryCode: country,
                    reason: reason.trim(),
                    status: 'pending',
                    requestedBy: user?.name || 'HR Staff',
                    requestedByRole: user?.role || 'hr',
                    requestedAt: new Date().toISOString()
                });

                addNotification('info', `Salary adjustment submitted. Awaiting Country Finance Director or CEO approval.`);
            }

            if (handleConfirmSalary) handleConfirmSalary();
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to submit salary adjustment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compensation Adjustment (Dual-Control)" size="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Employee Header */}
                <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] rounded-xl border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                    <div>
                        <p className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Employee</p>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">{employee.name}</p>
                        <p className="text-xs text-[var(--theme-text-secondary)]">{getEmployeeJobTitle(employee)} • {employee.department}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Current Base</p>
                        <p className="text-sm font-mono font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">
                            {currency} {currentSalary.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Forbidden Governance Warning */}
                {isForbidden && (
                    <div className="p-3.5 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] rounded-xl border border-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)] text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Action Prohibited Under Governance Rules</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed">{forbiddenReason}</p>
                        </div>
                    </div>
                )}

                {/* Proposed Salary Input */}
                <div>
                    <label className="block text-xs text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider mb-2">
                        Proposed Monthly Salary ({currency}) *
                    </label>
                    <div className="relative">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]" />
                        <input
                            type="number"
                            step="any"
                            value={proposedSalaryStr}
                            onChange={(e) => handleInputChange(e.target.value)}
                            disabled={isForbidden}
                            className="w-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl pl-12 pr-4 py-3 text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] text-lg font-mono border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] outline-none placeholder:text-[var(--theme-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                {/* Delta Badge */}
                {isValidAmount && diff !== 0 && (
                    <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                        diff > 0
                            ? 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)]'
                            : 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]'
                    }`}>
                        <div className="flex items-center gap-1.5">
                            {diff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>Adjustment: {diff > 0 ? '+' : ''}{currency} {diff.toLocaleString()} ({diff > 0 ? '+' : ''}{pctChange}%)</span>
                        </div>
                        <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                            {diff > 0 ? 'Merit Increase' : 'Salary Reduction'}
                        </span>
                    </div>
                )}

                {/* Justification Textarea */}
                <div>
                    <label className="block text-xs text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider mb-2">
                        Business Justification / Reason *
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => { setReason(e.target.value); if (errorMessage) setErrorMessage(''); }}
                        disabled={isForbidden}
                        rows={3}
                        className="w-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl p-3 text-sm text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] outline-none resize-none placeholder:text-[var(--theme-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Provide formal rationale (e.g. annual merit review, promotion to lead, market benchmarking)..."
                        required
                    />
                </div>

                {/* Executive Mode Toggle */}
                {isExecutive && !isForbidden && (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] rounded-xl border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Executive Bypass Mode</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">Apply immediate override or route to approval queue</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDirectOverride(!directOverride)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                directOverride
                                    ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)]'
                                    : 'bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]'
                            }`}
                        >
                            {directOverride ? 'Direct Override' : 'Route to Queue'}
                        </button>
                    </div>
                )}

                {/* Policy Notice */}
                <div className="p-3 bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] rounded-xl border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] flex items-start gap-2.5 text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    <ShieldAlert size={15} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0 mt-0.5" />
                    <span>
                        <strong>SOP-GOV-018 4-Eyes Policy:</strong> Salary adjustments cannot be applied unilaterally by HR. All requests require Country Finance Director or CEO co-signature before payroll sync.
                    </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] rounded-xl border border-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)] text-xs flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] font-bold text-xs uppercase cursor-pointer hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isForbidden || !isValidAmount || diff === 0 || reason.trim().length < 5}
                        className="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-status-success)] hover:from-[var(--theme-status-success)] hover:to-[var(--theme-status-success)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--theme-text-primary)] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-all shadow-sm"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        <span>{isExecutive && directOverride ? 'Apply Override' : 'Submit for Approval'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
