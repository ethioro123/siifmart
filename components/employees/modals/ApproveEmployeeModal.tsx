import React from 'react';
import { UserCheck, CheckCircle } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface ApproveEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    sites: any[];
    handleConfirmApprove: () => void;
}

export default function ApproveEmployeeModal({
    isOpen,
    onClose,
    employee,
    sites,
    handleConfirmApprove
}: ApproveEmployeeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Approve Employee" size="md">
            <div className="p-6 space-y-6">
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 animate-pulse">
                        <UserCheck className="text-green-400" size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Activate Talent</h3>
                        <p className="text-sm text-gray-400">Approving {employee?.name} will grant them system access based on the assigned role: <span className="text-cyber-primary font-bold">{employee?.role}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Department</p>
                        <p className="text-sm text-white font-medium">{employee?.department || 'Unassigned'}</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Location</p>
                        <p className="text-sm text-white font-medium">{sites.find(s => s.id === employee?.siteId)?.name || 'Unassigned'}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleConfirmApprove}
                        className="flex-1 py-4 px-4 bg-cyber-primary text-black hover:bg-cyber-primary/90 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-primary/20"
                    >
                        <CheckCircle size={18} />
                        Approve & Activate
                    </button>
                </div>
            </div>
        </Modal>
    );
}
