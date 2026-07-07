import React from 'react';
import { Loader2, Briefcase } from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';
import { CURRENCY_SYMBOL } from '../../constants';

export const PayrollModal: React.FC = () => {
    const {
        isPayrollModalOpen,
        setIsPayrollModalOpen,
        employees,
        totalSalaries,
        handleConfirmPayroll,
        isSubmitting
    } = useFinance();

    return (
        <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title="Process Payroll" size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl">
                    <div className="p-3 bg-cyber-primary/20 rounded-full">
                        <Briefcase className="w-8 h-8 text-cyber-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Run Payroll?</h3>
                        <p className="text-gray-400 text-sm">This will process salaries for {employees.length} employees.</p>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl mb-6 border border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Payout</p>
                    <p className="text-2xl font-mono font-bold text-white">{CURRENCY_SYMBOL} {totalSalaries.toLocaleString()}</p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsPayrollModalOpen(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPayroll}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Processing...' : 'Confirm & Process'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default PayrollModal;
