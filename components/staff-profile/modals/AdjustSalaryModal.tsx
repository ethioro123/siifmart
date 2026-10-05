import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ShieldAlert, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { salaryRequestsService } from '../../../services/salary-requests.service';
import type { Employee } from '../../../types';

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

    const isExecutive = ['CEO', 'ceo', 'super_admin'].includes(user?.role || '');
    const [directOverride, setDirectOverride] = useState<boolean>(isExecutive);

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
                    requestedByRole: user?.role || 'super_admin',
                    requestedAt: new Date().toISOString()
                });

                await salaryRequestsService.approve(created.id, {
                    id: user?.id,
                    name: user?.name || 'Executive',
                    role: user?.role || 'super_admin'
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

                addNotification('info', `Salary adjustment submitted. Awaiting Finance Manager or CEO approval.`);
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
                <div className="flex items-center justify-between p-3.5 bg-stone-100 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/10">
                    <div>
                        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Employee</p>
                        <p className="text-sm font-bold text-stone-900 dark:text-white">{employee.name}</p>
                        <p className="text-xs text-stone-500 capitalize">{employee.role.replace(/_/g, ' ')} • {employee.department}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Current Base</p>
                        <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                            {currency} {currentSalary.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Proposed Salary Input */}
                <div>
                    <label className="block text-xs text-stone-500 font-bold uppercase tracking-wider mb-2">
                        Proposed Monthly Salary ({currency}) *
                    </label>
                    <div className="relative">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                        <input
                            type="number"
                            step="any"
                            value={proposedSalaryStr}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="w-full bg-stone-50 dark:bg-black/50 border border-stone-300 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-stone-900 dark:text-white text-lg font-mono focus:border-emerald-600 dark:focus:border-emerald-500 outline-none placeholder:text-stone-400"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                {/* Delta Badge */}
                {isValidAmount && diff !== 0 && (
                    <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                        diff > 0 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' 
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                    }`}>
                        <div className="flex items-center gap-1.5">
                            {diff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>Adjustment: {diff > 0 ? '+' : ''}{currency} {diff.toLocaleString()} ({diff > 0 ? '+' : ''}{pctChange}%)</span>
                        </div>
                        <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                            {diff > 0 ? 'Merit Increase' : 'Salary Reduction'}
                        </span>
                    </div>
                )}

                {/* Justification Textarea */}
                <div>
                    <label className="block text-xs text-stone-500 font-bold uppercase tracking-wider mb-2">
                        Business Justification / Reason *
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => { setReason(e.target.value); if (errorMessage) setErrorMessage(''); }}
                        rows={3}
                        className="w-full bg-stone-50 dark:bg-black/50 border border-stone-300 dark:border-white/10 rounded-xl p-3 text-sm text-stone-900 dark:text-white focus:border-emerald-600 dark:focus:border-emerald-500 outline-none resize-none placeholder:text-stone-400"
                        placeholder="Provide formal rationale (e.g. annual merit review, promotion to lead, market benchmarking)..."
                        required
                    />
                </div>

                {/* Executive Mode Toggle */}
                {isExecutive && (
                    <div className="p-3 bg-stone-100 dark:bg-black/30 rounded-xl border border-stone-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Executive Bypass Mode</p>
                            <p className="text-[11px] text-stone-500">Apply immediate override or route to approval queue</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDirectOverride(!directOverride)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                directOverride 
                                    ? 'bg-amber-600 text-white' 
                                    : 'bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300'
                            }`}
                        >
                            {directOverride ? 'Direct Override' : 'Route to Queue'}
                        </button>
                    </div>
                )}

                {/* Policy Notice */}
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/20 flex items-start gap-2.5 text-[11px] text-stone-600 dark:text-stone-400">
                    <ShieldAlert size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                        <strong>SOP-GOV-018 4-Eyes Policy:</strong> Salary adjustments cannot be applied unilaterally by HR. All requests require Finance Manager or CEO co-signature before payroll sync.
                    </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900 text-xs flex items-center gap-2">
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
                        className="px-4 py-2.5 text-stone-500 dark:text-stone-400 font-bold text-xs uppercase cursor-pointer hover:text-stone-800 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !isValidAmount || diff === 0 || reason.trim().length < 5}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-all shadow-sm"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        <span>{isExecutive && directOverride ? 'Apply Override' : 'Submit for Approval'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
