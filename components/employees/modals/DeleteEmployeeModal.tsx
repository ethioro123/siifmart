import { Link } from 'react-router-dom';
import React from 'react';
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
    return <Modal isOpen={isOpen} onClose={onClose} title="Employee history is protected" size="md">
        <div className="p-6 space-y-4 text-[var(--theme-text-primary)]">
            <p>{employee?.name}'s employee record and supporting evidence must be retained.</p>
            <p>Use the employee offboarding workflow to submit a termination proposal for an independent reviewer.</p>
            <Link to="/approvals" onClick={onClose} className="min-h-11 inline-flex items-center underline">Open lifecycle requests in Approvals</Link>
            <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border border-[var(--theme-border)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Close</button>
        </div>
    </Modal>;
}
