import React from 'react';
import { DollarSign } from 'lucide-react';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';

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
    const { settings, activeSite } = useData();
    const currencySymbol = (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Compensation" size="sm">
            <div className="p-6">
                <label className="block text-xs text-stone-500 font-bold uppercase tracking-wider mb-3">Base Monthly Salary ({currencySymbol})</label>
                <div className="relative mb-8">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <input
                        type="number"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        className="w-full bg-stone-50 dark:bg-black/50 border border-[#E2DCCE] dark:border-white/10 rounded-2xl pl-12 pr-6 py-4 text-stone-900 dark:text-white text-xl font-mono focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none placeholder:text-stone-400"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-stone-500 dark:text-stone-400 font-bold text-xs uppercase cursor-pointer">Cancel</button>
                    <button onClick={handleConfirmSalary} className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer">Update Scale</button>
                </div>
            </div>
        </Modal>
    );
}
