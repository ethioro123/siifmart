import React from 'react';
import { Loader2, FileText, AlertCircle, Clock } from 'lucide-react';
import { useFinance } from './FinanceContext';

export const TaxTab: React.FC = () => {
    const {
        currentTaxConfig,
        totalRevenue,
        estimatedTaxLiability,
        inputTaxCredit,
        netTaxPayable,
        handleGenerateFiling,
        isSubmitting,
        currencySymbol
    } = useFinance();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-stone-900/60 dark:bg-stone-900/60 border border-stone-200/10 dark:border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-white">Tax Liability</h3>
                        <p className="text-xs text-gray-400 mt-1">Estimated payable based on current sovereign ledger ({currentTaxConfig.authority}).</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">
                        {currentTaxConfig.name} ({currentTaxConfig.rate}%)
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Gross Revenue</span>
                        <span className="font-mono text-white">{currencySymbol} {totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Output Tax (Collected)</span>
                        <span className="font-mono text-rose-400">+ {currencySymbol} {estimatedTaxLiability.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Input Tax Credit (Claimable)</span>
                        <span className="font-mono text-emerald-400">- {currencySymbol} {inputTaxCredit.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-bold">Net Payable</span>
                        <span className="text-2xl font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{currencySymbol} {netTaxPayable.toLocaleString()}</span>
                    </div>
                </div>

                <button
                    onClick={handleGenerateFiling}
                    disabled={isSubmitting}
                    className="w-full mt-6 py-3 woody-btn-primary font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />} {isSubmitting ? 'Generating Report...' : `Generate ${currentTaxConfig.taxName} Filing Report`}
                </button>
            </div>

            <div className="bg-stone-900/60 dark:bg-stone-900/60 border border-stone-200/10 dark:border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Compliance Calendar</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{currentTaxConfig.taxName} Filing Deadline</p>
                            <p className="text-xs text-rose-400">Due in 3 Days (Oct 15) &bull; {currentTaxConfig.authority}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <div className="p-2 bg-white/10 rounded-lg text-gray-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Payroll Tax Submission</p>
                            <p className="text-xs text-gray-500">Due: Oct 30 &bull; Local Withholding</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default TaxTab;
