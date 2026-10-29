import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../Modal';

interface ValidationWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationMessage: string;
    handleConfirmValidation: () => void;
}

export default function ValidationWarningModal({
    isOpen,
    onClose,
    validationMessage,
    handleConfirmValidation
}: ValidationWarningModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Validation Warning" size="md">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl">
                    <AlertTriangle className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" size={24} />
                    <div>
                        <h4 className="font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">Configuration Mismatch</h4>
                        <p className="text-xs text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] font-medium">A potential issue was identified with the role and location assignment.</p>
                    </div>
                </div>

                <div className="p-5 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] rounded-xl text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-sm leading-relaxed italic font-medium">
                    "{validationMessage}"
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        Cancel & Edit
                    </button>
                    <button
                        onClick={handleConfirmValidation}
                        className="flex-1 py-3 px-4 bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] bg-[var(--theme-status-warning-bg)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg "
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </Modal>
    );
}
