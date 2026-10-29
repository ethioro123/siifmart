import React from 'react';
import { UserCheck, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';
import { getEmployeeJobTitle } from '../../../utils/roles';
import { useStore } from '../../../contexts/CentralStore';
import { canApproveEmployeeOnboarding } from '../../../utils/roleHiring';

interface ApproveEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    sites: any[];
    handleConfirmApprove: () => void;
}

export default function ApproveEmployeeModal({
    isOpen,
    onClose,
    employee,
    sites,
    handleConfirmApprove
}: ApproveEmployeeModalProps) {
    const { user } = useStore();

    if (!isOpen || !employee) return null;

    const isAuthorized = canApproveEmployeeOnboarding(user?.role);
    const locationName = sites.find(s => s.id === employee.siteId)?.name || 'Unassigned';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Approve Employee Onboarding" size="md">
            <div className="p-5 sm:p-6 space-y-5 bg-[var(--theme-bg-card)]">
                {/* Header Icon & Title */}
                <div className="text-center space-y-2.5">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] flex items-center justify-center mx-auto text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                        <UserCheck size={32} />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] mb-1.5">
                            <ShieldCheck size={11} />
                            <span>Checker Sign-Off • Onboarding Authorization</span>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">
                            Authorize & Activate Talent
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm mx-auto">
                            Ratifying <strong className="text-[var(--theme-text-primary)] font-semibold">{employee.name}</strong> will activate the <span className="font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">{getEmployeeJobTitle(employee)}</span> position and its assigned system access.
                        </p>
                    </div>
                </div>

                {/* Role Details Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold mb-1">Department</p>
                        <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{employee.department || 'Operations'}</p>
                    </div>
                    <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold mb-1">Site Assignment</p>
                        <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{locationName}</p>
                    </div>
                </div>

                {/* Anti-Self-Approval / Hierarchy Guard */}
                {!isAuthorized ? (
                    <div className="p-3 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl flex items-start gap-2.5 text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Dual-Control Constraint</p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                                Sign-off is limited to HR leadership or the Group CEO.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
                        <ShieldCheck size={14} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0" />
                        <span>Sign-off identity audit will be permanently recorded in tamper-evident system logs.</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 px-4 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmApprove}
                        disabled={!isAuthorized}
                        className={`flex-1 h-11 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                            isAuthorized
                                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 shadow-[0_2px_8px_rgba(0,113,227,0.25)]'
                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] cursor-not-allowed opacity-50'
                        }`}
                    >
                        <CheckCircle2 size={16} />
                        <span>Sign Off & Activate</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
