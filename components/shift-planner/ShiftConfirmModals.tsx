import React from 'react';
import Modal from '../Modal';
import { Copy, Send, Trash2, AlertTriangle } from 'lucide-react';

interface ShiftConfirmModalsProps {
    isCopyModalOpen: boolean;
    onCloseCopyModal: () => void;
    onConfirmCopy: () => void;
    isCopying: boolean;

    isPublishModalOpen: boolean;
    onClosePublishModal: () => void;
    onConfirmPublish: () => void;
    isPublishing: boolean;

    isClearModalOpen: boolean;
    onCloseClearModal: () => void;
    onConfirmClear: () => void;

    weekLabel: string;
}

export const ShiftConfirmModals: React.FC<ShiftConfirmModalsProps> = ({
    isCopyModalOpen,
    onCloseCopyModal,
    onConfirmCopy,
    isCopying,
    isPublishModalOpen,
    onClosePublishModal,
    onConfirmPublish,
    isPublishing,
    isClearModalOpen,
    onCloseClearModal,
    onConfirmClear,
    weekLabel
}) => {
    return (
        <>
            {/* Copy Previous Week Modal */}
            <Modal
                isOpen={isCopyModalOpen}
                onClose={onCloseCopyModal}
                title="Copy Previous Week's Roster"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/20 text-[var(--theme-primary)] dark:text-[#A9CBA2] border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)]">
                        <Copy size={24} className="shrink-0" />
                        <p className="text-xs">
                            This will replicate all shifts from the preceding week into <strong>{weekLabel}</strong>. Any existing draft shifts will be updated.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onCloseCopyModal}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmCopy}
                            disabled={isCopying}
                            className="woody-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                            <Copy size={14} />
                            <span>{isCopying ? 'Copying...' : 'Confirm Copy'}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Publish Roster Modal */}
            <Modal
                isOpen={isPublishModalOpen}
                onClose={onClosePublishModal}
                title="Publish Weekly Roster"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/20 text-[var(--theme-primary)] dark:text-[#A9CBA2] border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)]">
                        <Send size={24} className="shrink-0" />
                        <p className="text-xs">
                            Publishing will confirm and finalize the schedule for <strong>{weekLabel}</strong>. Shifts will be visible to all staff profiles and POS/WMS terminals.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClosePublishModal}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmPublish}
                            disabled={isPublishing}
                            className="woody-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                            <Send size={14} />
                            <span>{isPublishing ? 'Publishing...' : 'Publish Roster'}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Clear Week Modal */}
            <Modal
                isOpen={isClearModalOpen}
                onClose={onCloseClearModal}
                title="Clear Weekly Shifts"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--theme-status-danger-bg)] dark:bg-red-950/20 text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)]">
                        <AlertTriangle size={24} className="shrink-0 text-[var(--theme-status-danger-text)]" />
                        <p className="text-xs">
                            Are you sure you want to clear all shifts for <strong>{weekLabel}</strong>? Shifts will be set to Off (Day Off). Remember to click <strong>Save Changes</strong> to persist.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onCloseClearModal}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmClear}
                            className="px-4 py-2 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Trash2 size={14} />
                            <span>Clear Shifts</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
