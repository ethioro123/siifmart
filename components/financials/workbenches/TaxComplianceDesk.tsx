import React, { useState } from 'react';
import {
    FileCheck,
    Download,
    CheckCircle2,
    ShieldCheck,
    FileText,
    Clock,
    Send,
    Check
} from 'lucide-react';
import { useFinance } from '../FinanceContext';

interface TaxComplianceDeskProps {
    currencySymbol: string;
    effectiveCountry: string;
}

export const TaxComplianceDesk: React.FC<TaxComplianceDeskProps> = ({
    currencySymbol,
    effectiveCountry
}) => {
    const { user, addNotification } = useFinance();
    const isManager = Boolean(user?.role && ['country_finance_director', 'tax_compliance_officer', 'country_managing_director', 'group_ceo'].includes(user.role));

    const [returnStatus, setReturnStatus] = useState<'draft' | 'submitted' | 'certified'>('draft');

    const isEthiopia = effectiveCountry === 'ET';
    const authorityForm = isEthiopia ? 'ERCA Form 21 (VAT)' : 'KRA iTax VAT (Monthly)';
    const authorityName = isEthiopia ? 'Ministry of Revenues (ERCA)' : 'Kenya Revenue Authority (KRA)';

    const handleStaffSubmitReturn = () => {
        setReturnStatus('submitted');
        addNotification?.('info', `Monthly ${authorityForm} draft compiled and submitted to Country Finance Director for statutory certification.`);
    };

    const handleManagerCertifyReturn = () => {
        setReturnStatus('certified');
        addNotification?.('success', `Monthly ${authorityForm} signed off and statutorily certified for sovereign fiscal transmission.`);
    };

    return (
        <div className="space-y-5 animate-in fade-in">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <FileCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Sovereign Fiscal Authority Filing Desk ({authorityForm})
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Monthly VAT return liability, input tax credit verification from registered POs, and withholding tax certificates.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 text-[11px] font-semibold font-mono">
                        {authorityName}
                    </span>
                    {isManager ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)] text-[11px] font-semibold">
                            <ShieldCheck size={12} />
                            <span>Checker • Statutory Sign-Off</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 text-[11px] font-semibold">
                            <Clock size={12} />
                            <span>Maker • Draft Compilation</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 3 Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Output VAT Collected
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] mt-1">
                        +{currencySymbol} 142,500
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        POS retail sales standard rate
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Input VAT Tax Credits
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1">
                        -{currencySymbol} 68,200
                    </div>
                    <span className="text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1 block">
                        Verified supplier procurement receipts
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Net Tax Payable
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-1">
                        {currencySymbol} 74,300
                    </div>
                    <span className="text-[11px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-1 block">
                        {returnStatus === 'certified'
                            ? 'Statutorily Certified for Sovereign Remittance'
                            : returnStatus === 'submitted'
                            ? 'Return compiled • Awaiting manager sign-off'
                            : 'Filing due on 20th of the month'}
                    </span>
                </div>
            </div>

            {/* Compliance Verification Panel */}
            <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Statutory Return Verification &amp; Certification
                        </h5>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Automated 3-way reconciliation between sales ledger, vendor purchase orders, and tax authority gateway.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isManager ? (
                            <button
                                type="button"
                                onClick={handleManagerCertifyReturn}
                                disabled={returnStatus === 'certified'}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    returnStatus === 'certified'
                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] opacity-80 cursor-default'
                                        : 'bg-[var(--theme-accent-muted)] hover:bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] cursor-pointer'
                                }`}
                                title="Country Finance Director supervisory authority to certify statutory sovereign tax filing"
                            >
                                <Check size={13} />
                                {returnStatus === 'certified' ? 'Return Certified (Signed Off)' : 'Certify Return (Manager Sign-Off)'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStaffSubmitReturn}
                                disabled={returnStatus !== 'draft'}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    returnStatus === 'draft'
                                        ? 'bg-[var(--theme-accent)] hover:bg-[#0077ED] text-[var(--theme-text-primary)] cursor-pointer'
                                        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] opacity-80 cursor-default'
                                }`}
                            >
                                <Send size={13} />
                                {returnStatus === 'draft' ? 'Compile & Submit for Sign-Off' : 'Submitted for Certification'}
                            </button>
                        )}

                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-all flex items-center gap-1.5"
                        >
                            <FileText size={13} /> Export E-Return Form
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-3 text-xs">
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={16} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0" />
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Electronic Fiscal Device (EFD / TIMS) Checksum Handshake
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    All 1,420 POS invoices hashed and synced to fiscal authority server
                                </span>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] font-mono">
                            100% MATCHED
                        </span>
                    </div>

                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 size={16} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Vendor Withholding Tax (WHT) Credit Certificates
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    24 eligible vendor purchase receipts validated against electronic clearance PIN
                                </span>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 font-mono">
                            VALIDATED
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxComplianceDesk;
