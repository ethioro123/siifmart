import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { budgetReconciliationService } from '../../services/budget-reconciliation.service';
import Modal from '../Modal';
import { isAdminSite } from '../../utils/countryAdmin';

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
    const { user, currencySymbol, effectiveCountry, activeSite, sites, addNotification } = useFinance();
    const defaultTender = effectiveCountry === 'KE' ? 'M_Pesa' : 'Telebirr';

    const [tenderType, setTenderType] = useState<'Telebirr' | 'CBE_Birr' | 'M_Pesa' | 'Card' | 'Cash'>(defaultTender as any);
    const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
    const [posReportedAmount, setPosReportedAmount] = useState<number | ''>('');
    const [statementAmount, setStatementAmount] = useState<number | ''>('');
    const [feeDeductions, setFeeDeductions] = useState<number | ''>(0);
    const [statementReference, setStatementReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const regionCode = user?.regionCode || user?.region_code || activeSite?.regionCode || activeSite?.region_code;
    const eligibleSites = sites.filter(site =>
        site.country === effectiveCountry &&
        (isAdminSite(activeSite)
            ? (!regionCode || (site.regionCode || site.region_code) === regionCode)
            : site.id === activeSite?.id)
    );
    const siteId = eligibleSites.some(site => site.id === selectedSiteId)
        ? selectedSiteId
        : (eligibleSites.find(site => site.id === activeSite?.id)?.id || eligibleSites[0]?.id);

    const calculatedVariance = Number(statementAmount || 0) - Number(posReportedAmount || 0) - Number(feeDeductions || 0);

    const handleSubmit = async () => {
        if (posReportedAmount === '' || statementAmount === '') {
            addNotification('alert', 'Please enter both POS amount and Statement amount.');
            return;
        }
        if (!siteId) {
            addNotification('alert', 'Select an authorized site for this reconciliation.');
            return;
        }

        setIsSubmitting(true);
        try {
            await budgetReconciliationService.submitTenderReconciliation(
                {
                    countryCode: effectiveCountry,
                    siteId,
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

    const inputBase = "w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors placeholder:text-[var(--theme-text-secondary)]/50";
    const labelBase = "text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mobile Money & Bank Settlement Reconciliation" size="md">
            <div className="space-y-4 p-1">
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs flex items-center gap-2.5">
                    <ShieldCheck size={18} className="text-[#0071E3] dark:text-[#2997FF] shrink-0" />
                    <span className="text-[var(--theme-text-secondary)] leading-relaxed">
                        Reconcile POS-cleared mobile wallet balances against official bank / telco statements.
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelBase}>Tender Gateway</label>
                        <select
                            value={tenderType}
                            onChange={(e) => setTenderType(e.target.value as any)}
                            className={`${inputBase} cursor-pointer`}
                            aria-label="Tender Gateway"
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
                        <label className={labelBase}>Reconciliation Date</label>
                        <input
                            type="date"
                            value={reconciliationDate}
                            onChange={(e) => setReconciliationDate(e.target.value)}
                            className={`${inputBase} font-mono`}
                            aria-label="Reconciliation Date"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelBase} htmlFor="tender-reconciliation-site">Site to reconcile</label>
                    <select
                        id="tender-reconciliation-site"
                        value={siteId || ''}
                        onChange={event => setSelectedSiteId(event.target.value)}
                        className={`${inputBase} cursor-pointer`}
                    >
                        {eligibleSites.length === 0 && <option value="">No authorized site</option>}
                        {eligibleSites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    <div>
                        <label className={labelBase}>POS Reported</label>
                        <input
                            type="number"
                            value={posReportedAmount}
                            onChange={(e) => setPosReportedAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className={`${inputBase} font-mono tabular-nums`}
                            aria-label="POS Reported Amount"
                        />
                    </div>
                    <div>
                        <label className={labelBase}>Statement Total</label>
                        <input
                            type="number"
                            value={statementAmount}
                            onChange={(e) => setStatementAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className={`${inputBase} font-mono tabular-nums`}
                            aria-label="Statement Amount"
                        />
                    </div>
                    <div>
                        <label className={labelBase}>Fee Deductions</label>
                        <input
                            type="number"
                            value={feeDeductions}
                            onChange={(e) => setFeeDeductions(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className={`${inputBase} font-mono tabular-nums`}
                            aria-label="Fee Deductions"
                        />
                    </div>
                </div>

                {posReportedAmount !== '' && statementAmount !== '' && (
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                        Math.abs(calculatedVariance) < 0.01
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}>
                        <div className="flex items-center gap-1.5 font-semibold">
                            {Math.abs(calculatedVariance) < 0.01 ? (
                                <span>Zero-Variance Perfect Match</span>
                            ) : (
                                <>
                                    <AlertCircle size={14} />
                                    <span>Variance Detected</span>
                                </>
                            )}
                        </div>
                        <span className="font-mono font-semibold tabular-nums">
                            {calculatedVariance > 0 ? '+' : ''}{currencySymbol} {calculatedVariance.toLocaleString()}
                        </span>
                    </div>
                )}

                <div>
                    <label className={labelBase}>Statement Reference / Batch ID</label>
                    <input
                        type="text"
                        value={statementReference}
                        onChange={(e) => setStatementReference(e.target.value)}
                        placeholder="e.g. STMT-202610-TB0921"
                        className={inputBase}
                        aria-label="Statement Reference"
                    />
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || posReportedAmount === '' || statementAmount === ''}
                        className="px-4 py-2 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                        <span>Save Reconciliation</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TenderReconciliationModal;
