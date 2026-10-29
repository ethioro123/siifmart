import React, { useState, useEffect } from 'react';
import { Scale, X, Send, AlertCircle } from 'lucide-react';
import { disciplinaryService } from '../../../services/disciplinary.service';
import type { DisciplinaryRecord } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';

interface AppealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    record: DisciplinaryRecord | null;
}

export function AppealModal({
    isOpen,
    onClose,
    onSuccess,
    record
}: AppealModalProps) {
    const { user, showToast } = useStore();
    const [appealNotes, setAppealNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appealNotes.trim()) {
            showToast('Please state the grounds for the appeal', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            // Under 4-Eyes rules, the appeal is logged for this employee record
            await disciplinaryService.fileAppeal(
                record.id,
                record.employee_id,
                appealNotes.trim()
            );

            showToast('Formal appeal logged. Forwarded for independent 4-Eyes adjudication.', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Failed to submit appeal', 'error');
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
            <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <Scale size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                File Disciplinary Appeal
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                Submit formal dispute for independent supervisory adjudication
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

                {/* Case Summary Pill */}
                <div className="p-4 mx-6 mt-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--theme-text-primary)]">{record.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {record.severity} Severity
                        </span>
                    </div>
                    <p className="text-[var(--theme-text-secondary)]">
                        Target Personnel: <strong className="text-[var(--theme-text-primary)]">{record.employee_name}</strong> ({record.employee_id.slice(0, 8)})
                    </p>
                    <p className="text-[var(--theme-text-secondary)]">
                        Action Under Dispute: <span className="font-semibold">{record.action_taken}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[var(--theme-text-primary)]">
                            Grounds for Appeal & Statement of Defense <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={appealNotes}
                            onChange={(e) => setAppealNotes(e.target.value)}
                            placeholder="State the procedural irregularities, conflicting evidence, or mitigating circumstances..."
                            rows={4}
                            required
                            className="w-full px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[#0071E3] resize-none"
                        />
                        <p className="text-[11px] text-[var(--theme-text-secondary)] flex items-center gap-1 mt-1">
                            <AlertCircle size={12} className="text-amber-500 shrink-0" />
                            <span>Under Maker-Checker rules, the original issuing supervisor cannot adjudicate this appeal.</span>
                        </p>
                    </div>

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
                            className="px-5 py-2.5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                            <Send size={14} />
                            <span>{isSubmitting ? 'Submitting...' : 'Submit Appeal'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
