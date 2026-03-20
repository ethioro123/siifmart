import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../../ui/Modal';
import { Employee } from '../../../types';

interface TerminateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    isTerminating: boolean;
    handleTerminate: () => void;
}

export default function TerminateEmployeeModal({
    isOpen,
    onClose,
    employee,
    isTerminating,
    handleTerminate
}: TerminateEmployeeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Operational Action: Termination" size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <AlertTriangle className="text-orange-500" size={32} />
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold">Terminate Employee?</h4>
                        <p className="text-xs text-orange-600 dark:text-orange-200 dark:opacity-80">This will revoke all active access and set status to 'Terminated'.</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl mb-6">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Target Personnel</p>
                    <p className="text-gray-900 dark:text-white font-bold">{employee.name}</p>
                    <p className="text-[10px] text-cyber-primary font-mono">{employee.id}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        disabled={isTerminating}
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={isTerminating}
                        onClick={handleTerminate}
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-lg text-xs uppercase shadow-lg shadow-orange-500/20 flex items-center gap-2"
                    >
                        {isTerminating ? (
                            <><Loader2 size={14} className="animate-spin" /> Processing...</>
                        ) : (
                            "Confirm Termination"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
