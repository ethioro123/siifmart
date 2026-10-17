import React from 'react';
import { FileText, Trash2, ArrowRight, Plus, X, Clock, Paperclip, Building2, CheckCircle2 } from 'lucide-react';
import { EmployeeDraft } from '../../../utils/employeeDrafts';
import { getJobTitleForRole } from '../../../utils/roles';

interface EmployeeDraftsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    drafts: EmployeeDraft[];
    activeDraftId: string | null;
    onResumeDraft: (draftId: string) => void;
    onDeleteDraft: (draftId: string) => void;
    onStartNewCandidate: () => void;
}

const STEP_NAMES: Record<number, string> = {
    1: 'Identity',
    2: 'Role',
    3: 'Details',
    4: 'Documents',
    5: 'Review'
};

export const EmployeeDraftsDrawer: React.FC<EmployeeDraftsDrawerProps> = ({
    isOpen,
    onClose,
    drafts,
    activeDraftId,
    onResumeDraft,
    onDeleteDraft,
    onStartNewCandidate
}) => {
    if (!isOpen) return null;

    const formatSavedTime = (iso: string) => {
        try {
            const date = new Date(iso);
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)] text-[#2C5E3B] dark:text-[#A9CBA2] border border-[var(--theme-border)]">
                            <FileText size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                    Saved Worker Drafts
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                    {drafts.length}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Pick up onboarding from where you left off or start a fresh candidate
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onStartNewCandidate}
                            className="px-3 py-1.5 rounded-xl bg-[#2C5E3B] hover:bg-[#234b2f] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Start New Candidate"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">New Candidate</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Drafts List Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                    {drafts.length === 0 ? (
                        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] mx-auto flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                                    No Saved Drafts
                                </h4>
                                <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto mt-1">
                                    Click "Save Draft" at any step during onboarding to preserve candidate progress and resume anytime.
                                </p>
                            </div>
                        </div>
                    ) : (
                        drafts.map(draft => {
                            const isActive = activeDraftId === draft.id;
                            const stepName = STEP_NAMES[draft.step] || `Step ${draft.step}`;

                            return (
                                <div
                                    key={draft.id}
                                    className={`p-4 rounded-2xl border transition-all ${
                                        isActive
                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-[#2C5E3B] shadow-xs'
                                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[#2C5E3B]/40'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        {/* Candidate Details */}
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm text-[var(--theme-text-primary)] truncate">
                                                    {draft.title}
                                                </h4>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2C5E3B] text-white flex items-center gap-1 shrink-0">
                                                        <CheckCircle2 size={11} />
                                                        Active in Wizard
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-[var(--theme-bg-subtle)] text-[#2C5E3B] dark:text-[#A9CBA2] border border-[var(--theme-border)] shrink-0">
                                                    {getJobTitleForRole(draft.role || 'Staff')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-[var(--theme-text-secondary)] flex-wrap">
                                                {draft.siteName && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 size={12} className="text-[var(--theme-text-muted)]" />
                                                        {draft.siteName}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>{draft.department}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                                    <Clock size={11} />
                                                    {formatSavedTime(draft.savedAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                    Progress: Step {draft.step}/5 ({stepName})
                                                </span>
                                                {draft.attachedDocsCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center gap-1">
                                                        <Paperclip size={10} />
                                                        {draft.attachedDocsCount} doc(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onResumeDraft(draft.id)}
                                                className="px-3.5 py-2 rounded-xl bg-[#2C5E3B] hover:bg-[#234b2f] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                                title="Resume Draft"
                                            >
                                                <span>{isActive ? 'Continue Editing' : 'Resume Draft'}</span>
                                                <ArrowRight size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteDraft(draft.id)}
                                                className="p-2 rounded-xl text-[var(--theme-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                title="Delete Draft"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer info */}
                <div className="p-3 px-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                    <span>Drafts are securely isolated per country and stored locally.</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--theme-text-primary)] font-semibold hover:underline cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
