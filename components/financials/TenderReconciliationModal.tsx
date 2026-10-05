import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { budgetReconciliationService } from '../../services/budget-reconciliation.service';
import Modal from '../Modal';

interface TenderReconciliationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const TenderReconciliationModal: React.FC<TenderReconciliationModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const defaultTender = effectiveCountry === 'KE' ? 'M_Pesa' : 'Telebirr';

    const [tenderType, setTenderType] = useState<'Telebirr' | 'CBE_Birr' | 'M_Pesa' | 'Card' | 'Cash'>(defaultTender as any);
    const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
    const [posReportedAmount, setPosReportedAmount] = useState<number | ''>('');
    const [statementAmount, setStatementAmount] = useState<number | ''>('');
    const [feeDeductions, setFeeDeductions] = useState<number | ''>(0);
    const [statementReference, setStatementReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculatedVariance = Number(statementAmount || 0) - Number(posReportedAmount || 0) - Number(feeDeductions || 0);

    const handleSubmit = async () => {
        if (posReportedAmount === '' || statementAmount === '') {
            addNotification('alert', 'Please enter both POS amount and Statement amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            await budgetReconciliationService.submitTenderReconciliation(
                {
                    countryCode: effectiveCountry,
                    siteId: activeSite?.id || 'SITE-0001',
                    reconciliationDate,
                    tenderType,
                    posReportedAmount: Number(posReportedAmount),
                    statementAmount: Number(statementAmount),
                    feeDeductions: Number(feeDeductions || 0),
                    statementReference,
                    notes
                },
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff' }
            );

            addNotification('success', `${tenderType} settlement reconciled.`);
            onSuccess();
            onClose();
        } catch {
            addNotification('alert', 'Failed to submit tender reconciliation');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mobile Money & Bank Settlement Reconciliation" size="md">
            <div className="space-y-4 p-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-200 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Reconcile POS-cleared mobile wallet balances against official bank / telco statements.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Tender Gateway</label>
                        <select
                            value={tenderType}
                            onChange={(e) => setTenderType(e.target.value as any)}
                            className="woody-input"
                        >
                            {effectiveCountry === 'ET' ? (
                                <>
                                    <option value="Telebirr">Telebirr SuperApp</option>
                                    <option value="CBE_Birr">CBE Birr Wallet</option>
                                    <option value="Card">Bank Card (POS Terminal)</option>
                                    <option value="Cash">Cash Vault Transit</option>
                                </>
                            ) : (
                                <>
                                    <option value="M_Pesa">Safaricom M-Pesa</option>
                                    <option value="Card">Visa / Mastercard</option>
                                    <option value="Cash">Cash Vault Transit</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Date</label>
                        <input
                            type="date"
                            value={reconciliationDate}
                            onChange={(e) => setReconciliationDate(e.target.value)}
                            className="woody-input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">POS Reported ({currencySymbol})</label>
                        <input
                            type="number"
                            value={posReportedAmount}
                            onChange={(e) => setPosReportedAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className="woody-input font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Statement Amount ({currencySymbol})</label>
                        <input
                            type="number"
                            value={statementAmount}
                            onChange={(e) => setStatementAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className="woody-input font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Fees Deducted ({currencySymbol})</label>
                        <input
                            type="number"
                            value={feeDeductions}
                            onChange={(e) => setFeeDeductions(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className="woody-input font-mono"
                        />
                    </div>
                </div>

                {posReportedAmount !== '' && statementAmount !== '' && (
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                        Math.abs(calculatedVariance) < 0.01
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                            {Math.abs(calculatedVariance) < 0.01 ? (
                                <span>Perfect Zero-Variance Match</span>
                            ) : (
                                <>
                                    <AlertCircle size={14} className="text-rose-600 dark:text-rose-400" />
                                    <span>Variance Detected</span>
                                </>
                            )}
                        </div>
                        <span className="font-mono font-bold">
                            {calculatedVariance > 0 ? '+' : ''}{currencySymbol} {calculatedVariance.toLocaleString()}
                        </span>
                    </div>
                )}

                <div>
                    <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Statement Reference / Batch ID</label>
                    <input
                        type="text"
                        value={statementReference}
                        onChange={(e) => setStatementReference(e.target.value)}
                        placeholder="e.g. STMT-202610-TB0921"
                        className="woody-input"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E2DCCE] dark:border-white/5">
                    <button onClick={onClose} className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || posReportedAmount === '' || statementAmount === ''}
                        className="woody-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                        Save Reconciliation
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TenderReconciliationModal;
