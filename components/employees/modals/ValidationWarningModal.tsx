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
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
                    <div>
                        <h4 className="font-bold text-amber-600 dark:text-amber-400">Configuration Mismatch</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">A potential issue was identified with the role and location assignment.</p>
                    </div>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-xl text-amber-900 dark:text-amber-200/90 text-sm leading-relaxed italic font-medium">
                    "{validationMessage}"
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-400 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        Cancel & Edit
                    </button>
                    <button
                        onClick={handleConfirmValidation}
                        className="flex-1 py-3 px-4 bg-amber-500 text-white dark:text-black hover:bg-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </Modal>
    );
}
