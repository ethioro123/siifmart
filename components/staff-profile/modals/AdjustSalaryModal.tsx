import React from 'react';
import { DollarSign } from 'lucide-react';
import Modal from '../../ui/Modal';
import { CURRENCY_SYMBOL } from '../../../constants';

interface AdjustSalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    salaryInput: string;
    setSalaryInput: (val: string) => void;
    handleConfirmSalary: () => void;
}

export default function AdjustSalaryModal({
    isOpen,
    onClose,
    salaryInput,
    setSalaryInput,
    handleConfirmSalary
}: AdjustSalaryModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Compensation" size="sm">
            <div className="p-6">
                <label className="block text-xs text-gray-500 font-black uppercase tracking-widest mb-3">Base Monthly Salary ({CURRENCY_SYMBOL})</label>
                <div className="relative mb-8">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-primary" />
                    <input
                        type="number"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-4 text-gray-900 dark:text-white text-xl font-mono focus:border-cyber-primary outline-none placeholder:text-gray-400"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase">Cancel</button>
                    <button onClick={handleConfirmSalary} className="px-8 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-black rounded-lg text-xs uppercase tracking-widest">Update Scale</button>
                </div>
            </div>
        </Modal>
    );
}
