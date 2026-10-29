import React from 'react';
import {
    Loader2,
    FileText,
    AlertCircle,
    Clock,
    Landmark,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Scale,
    ShieldCheck,
    CheckCircle2,
    Calendar,
    Globe
} from 'lucide-react';
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
        <div className="space-y-6 animate-in fade-in">
            {/* Header Toolbar */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Sovereign Tax &amp; Statutory Compliance
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Automated ledger reconciliation for {currentTaxConfig.authority} statutory filings and input credit offsets.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-medium text-[var(--theme-text-primary)] flex items-center gap-1.5">
                        <Globe size={13} className="text-[var(--theme-text-secondary)]" />
                        <span>{currentTaxConfig.name}</span>
                        <span className="text-[var(--theme-text-secondary)] font-mono">({currentTaxConfig.authority})</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] text-[10px] font-bold font-mono">
                            {currentTaxConfig.rate}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Apple 4-Card Executive Tax Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Gross Turnover */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Taxable Turnover
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {currencySymbol} {totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                            Audited sales base
                        </div>
                    </div>
                </div>

                {/* Output Tax Collected */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                        <ArrowUpRight size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Output Tax (Collected)
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-mono tabular-nums mt-0.5">
                            +{currencySymbol} {estimatedTaxLiability.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                            {currentTaxConfig.rate}% standard rate
                        </div>
                    </div>
                </div>

                {/* Input Tax Credit Claimable */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                        <ArrowDownRight size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Input Tax Credit
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono tabular-nums mt-0.5">
                            -{currencySymbol} {inputTaxCredit.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                            Procurement offsets
                        </div>
                    </div>
                </div>

                {/* Net Statutory Liability */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <Scale size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Net Statutory Liability
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {currencySymbol} {netTaxPayable.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-0.5">
                            Remittance payable
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: Tax Statement & Compliance Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Statement Card */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                    Tax Liability Reconciliation
                                </h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                    Official reconciliation statement for {currentTaxConfig.authority} statutory filings.
                                </p>
                            </div>
                            <span className="px-2.5 py-1 bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] rounded-full text-[11px] font-semibold font-mono">
                                {currentTaxConfig.taxName} ({currentTaxConfig.rate}%)
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Gross Taxable Turnover</span>
                                <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                                    {currencySymbol} {totalRevenue.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Output Tax (Sales Collected)</span>
                                <span className="font-mono tabular-nums font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                                    +{currencySymbol} {estimatedTaxLiability.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Input Tax Credit (Vendor Purchases)</span>
                                <span className="font-mono tabular-nums font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                    -{currencySymbol} {inputTaxCredit.toLocaleString()}
                                </span>
                            </div>

                            {/* Net Payable Highlight */}
                            <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex justify-between items-center mt-2">
                                <div>
                                    <span className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                        Net Statutory Remittance
                                    </span>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                        Amount payable to {currentTaxConfig.authority}
                                    </span>
                                </div>
                                <span className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                    {currencySymbol} {netTaxPayable.toLocaleString()}
                                </span>
                            </div>

                            {/* Multi-country sovereignty disclaimer */}
                            <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-start gap-2.5 text-[11px] text-[var(--theme-text-secondary)]">
                                <ShieldCheck size={16} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0 mt-0.5" />
                                <span>
                                    Multi-Country Sovereignty Invariant: Tax configuration is sovereignly locked to {currentTaxConfig.name}. Tax rates cannot be modified in POS or Procurement and remain editable solely within Settings (Finance).
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGenerateFiling}
                        disabled={isSubmitting}
                        className="w-full mt-6 py-2.5 bg-[var(--theme-accent)] hover:bg-[#0077ED] text-white font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={15} />}
                        {isSubmitting ? 'Generating Statutory Report...' : `Generate ${currentTaxConfig.taxName} Filing Report`}
                    </button>
                </div>

                {/* Compliance Calendar Card */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                Statutory Compliance Calendar
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Official filing milestones and electronic tax schedules for {currentTaxConfig.authority}.
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] flex items-center justify-center">
                            <Calendar size={16} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* VAT/TOT Deadline */}
                        <div className="flex items-center justify-between p-3.5 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                                    <AlertCircle size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                        {currentTaxConfig.taxName} Monthly Filing
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] mt-0.5">
                                        Due in 3 Days (Oct 15) • {currentTaxConfig.authority} E-Tax Portal
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                                Action Required
                            </span>
                        </div>

                        {/* Payroll Tax */}
                        <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                        Payroll Withholding &amp; Pension (PAYE)
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                        Due: Oct 30 • Local Statutory Withholding
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                Scheduled
                            </span>
                        </div>

                        {/* Advance CIT */}
                        <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                        Provisional Corporate Advance Tax
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                        Quarterly assessment reconciled to General Ledger
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                Reconciled
                            </span>
                        </div>

                        {/* Cryptographic EFD Device */}
                        <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                        Electronic Fiscal Device (EFD / TIMS) Sync
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                        Real-time cryptographic sales receipts synced
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                Synced
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxTab;
