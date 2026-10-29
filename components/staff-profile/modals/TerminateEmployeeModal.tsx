import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface TerminateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    terminateInput: string;
    setTerminateInput: (val: string) => void;
    handleConfirmTermination: () => void;
}

export default function TerminateEmployeeModal({
    isOpen,
    onClose,
    employee,
    terminateInput,
    setTerminateInput,
    handleConfirmTermination
}: TerminateEmployeeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Operational Action: Termination" size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl">
                    <AlertTriangle className="text-[var(--theme-status-warning-text)]" size={32} />
                    <div>
                        <h4 className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">Terminate Employee?</h4>
                        <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] dark:opacity-80">This will revoke all active access and set status to 'Terminated'.</p>
                    </div>
                </div>
                <div className="p-4 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] rounded-xl mb-6">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider mb-1">Target Personnel</p>
                    <p className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{employee.name}</p>
                    <p className="text-[10px] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-mono">{employee.id}</p>
                </div>
                <div className="space-y-4 mb-6">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-widest block text-center">Type "TERMINATE" to confirm action</p>
                    <input
                        type="text"
                        value={terminateInput}
                        onChange={(e) => setTerminateInput(e.target.value)}
                        placeholder="TERMINATE"
                        className="w-full bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] focus:border-[var(--theme-status-warning-border)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--theme-status-warning-border)_20%,transparent)] outline-none text-center font-mono placeholder:text-[var(--theme-text-secondary)] transition-all font-bold"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] font-bold text-xs uppercase hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={terminateInput !== 'TERMINATE'}
                        onClick={handleConfirmTermination}
                        className={`px-6 py-2 font-black rounded-lg text-xs uppercase shadow-lg flex items-center gap-2 transition-all ${
                            terminateInput === 'TERMINATE'
                            ? 'bg-[var(--theme-status-warning-bg)] hover:bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] '
                            : 'bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] text-[var(--theme-text-secondary)] cursor-not-allowed border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]'
                        }`}
                    >
                        Confirm Termination
                    </button>
                </div>
            </div>
        </Modal>
    );
}
