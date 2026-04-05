import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface TerminateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
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
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Termination" size="md">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="text-red-400" size={24} />
                    <div>
                        <h4 className="font-bold text-red-400">Critical Action</h4>
                        <p className="text-xs text-gray-400">You are about to terminate {employee?.name}. This will revoke access and update their status to "Terminated".</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Type "TERMINATE" to confirm</label>
                    <input
                        type="text"
                        value={terminateInput}
                        onChange={(e) => setTerminateInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-colors"
                        placeholder="TERMINATE"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmTermination}
                        disabled={terminateInput !== 'TERMINATE'}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${terminateInput === 'TERMINATE' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        Confirm Termination
                    </button>
                </div>
            </div>
        </Modal>
    );
}
