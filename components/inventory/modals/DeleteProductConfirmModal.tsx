import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../Modal';
import Button from '../../shared/Button';

interface DeleteProductConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    deleteInput: string;
    setDeleteInput: (input: string) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const DeleteProductConfirmModal: React.FC<DeleteProductConfirmModalProps> = ({
    isOpen,
    onClose,
    deleteInput,
    setDeleteInput,
    onConfirm,
    isSubmitting
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Product">
            <div className="space-y-4">
                <div className="p-4 bg-[var(--theme-status-danger-bg)]/10 border border-[var(--theme-status-danger-border)]/20 rounded-2xl flex items-center gap-3.5 text-[var(--theme-status-danger-text)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-danger-bg)]/15 flex items-center justify-center shrink-0 text-[var(--theme-status-danger-text)]">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">Permanent Catalog Deletion</h4>
                        <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">This item will be permanently removed from all site catalogs.</p>
                    </div>
                </div>
                <p className="text-[13px] text-[var(--theme-text-secondary)] leading-relaxed">
                    To confirm this action, please type <span className="text-[var(--theme-text-primary)] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-bg-hover)] border border-[var(--theme-border)]">DELETE</span> below:
                </p>
                <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="w-full h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 text-[14px] text-[var(--theme-text-primary)] font-mono tracking-wider placeholder:text-[var(--theme-text-secondary)]/50 focus:border-[var(--theme-status-danger-border)] focus:ring-2 focus:ring-[var(--theme-status-danger)]/20 outline-none transition-all shadow-xs"
                    placeholder="Type DELETE"
                    autoFocus
                />
                <div className="flex justify-end items-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={deleteInput !== 'DELETE' || isSubmitting}
                        onClick={onConfirm}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] hover:opacity-95 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <span>Delete Product</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
