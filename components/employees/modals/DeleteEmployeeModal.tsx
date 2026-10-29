import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface DeleteEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    deleteInput: string;
    setDeleteInput: (val: string) => void;
    handleConfirmDelete: () => void;
}

export default function DeleteEmployeeModal({
    isOpen,
    onClose,
    employee,
    deleteInput,
    setDeleteInput,
    handleConfirmDelete
}: DeleteEmployeeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee Record" size="md">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl">
                    <Trash2 className="text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]" size={24} />
                    <div>
                        <h4 className="font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">Irreversible Action</h4>
                        <p className="text-xs text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] font-medium">This will permanently delete {employee?.name}'s record from the database. This cannot be undone.</p>
                    </div>
                </div>

                <div className="p-4 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl text-xs text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] shadow-inner dark:shadow-none">
                    <p className="font-black text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] mb-1 uppercase tracking-widest">Requirements for deletion:</p>
                    <ul className="list-disc list-inside space-y-1 font-medium">
                        <li>Employee must be <strong>Terminated</strong> first</li>
                        <li>You must be a <strong>CEO</strong></li>
                        <li>Record cannot be restored after deletion</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--theme-text-secondary)] text-[var(--theme-text-secondary)] uppercase tracking-widest block px-1">Type "DELETE" to confirm permanent removal</label>
                    <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] border-[var(--theme-status-danger-border)] outline-none transition-colors font-bold"
                        placeholder="DELETE"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleteInput !== 'DELETE'}
                        className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${deleteInput === 'DELETE' ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] bg-[var(--theme-status-danger-bg)] shadow-lg ' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] cursor-not-allowed border border-[var(--theme-border-subtle)] dark:border-transparent'}`}
                    >
                        Permanently Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}
