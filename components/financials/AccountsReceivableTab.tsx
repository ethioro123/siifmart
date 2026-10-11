import React, { useState, useEffect, useMemo } from 'react';
import {
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Loader2,
    Clock,
    ShieldCheck,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { accountsReceivableService } from '../../services/accounts-receivable.service';
import type { ArInvoice, ArAgingReport } from '../../types';
import { ArInvoiceModal } from './ArInvoiceModal';

export const AccountsReceivableTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [invoices, setInvoices] = useState<ArInvoice[]>([]);
    const [aging, setAging] = useState<ArAgingReport>({ current: 0, days31to60: 0, days61to90: 0, days90Plus: 0, totalOutstanding: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<ArInvoice | null>(null);

    const canManageCredit = ['credit_control_officer', 'finance_manager', 'super_admin', 'CEO', 'ceo', 'admin'].includes(user?.role);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invs, ag] = await Promise.all([
                accountsReceivableService.getInvoices(effectiveCountry, undefined, statusFilter === 'All' ? undefined : statusFilter),
                accountsReceivableService.getAgingReport(effectiveCountry)
            ]);
            setInvoices(invs);
            setAging(ag);
        } catch {
            addNotification('alert', 'Failed to load Accounts Receivable records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [effectiveCountry, statusFilter]);

    const filteredInvoices = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return invoices;
        return invoices.filter(i =>
            (i.customerName && i.customerName.toLowerCase().includes(query)) ||
            (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(query))
        );
    }, [invoices, searchTerm]);

    return (
        <div className="space-y-4">
            {/* Header & Aging Schedule Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Current (0-30 Days)
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {currencySymbol} {aging.current.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Within standard terms
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        31-60 Days
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">
                        {currencySymbol} {aging.days31to60.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Mild aging tier
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        61-90 Days
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
                        {currencySymbol} {aging.days61to90.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Follow-up scheduled
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        90+ Days Overdue
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
                        {currencySymbol} {aging.days90Plus.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Credit hold candidates
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs col-span-2 md:col-span-1">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Total Outstanding AR
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                        {currencySymbol} {aging.totalOutstanding.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        All commercial receivables
                    </p>
                </div>
            </div>

            {/* Invoices Table Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {/* Header & Filter Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Accounts Receivable (AR) &amp; Credit Ledger
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>Commercial Credit Governance</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 w-56">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search customer, invoice..."
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none w-full placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search receivables"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1"
                                aria-label="Filter receivables by status"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Sent">Open / Sent</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Paid">Settled / Paid</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-xs text-[var(--theme-text-secondary)] font-mono">
                        Tenancy: <span className="font-semibold text-[var(--theme-text-primary)]">{effectiveCountry}</span> ({currencySymbol})
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Invoice #</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Customer</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Date / Due</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Terms</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Total</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Balance Due</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-[var(--theme-text-secondary)]">
                                        <Loader2 className="animate-spin inline mr-2 text-[#0071E3] dark:text-[#2997FF]" size={18} />
                                        <span className="text-xs">Loading Accounts Receivable invoices...</span>
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                                                <CreditCard size={22} />
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                No B2B receivables found
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                No invoices match the selected status or search term.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--theme-text-primary)] whitespace-nowrap">
                                            {inv.invoiceNumber}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-text-primary)] whitespace-nowrap">
                                            {inv.customerName}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[var(--theme-text-secondary)]">
                                            <div>{inv.invoiceDate}</div>
                                            <div className="text-[11px] text-[var(--theme-text-secondary)]/70">Due: {inv.dueDate}</div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]">
                                                {inv.paymentTerms.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right font-mono text-[var(--theme-text-secondary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {inv.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {inv.balanceDue.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                                inv.status === 'Paid'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : inv.status === 'Overdue'
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                            }`}>
                                                {inv.status === 'Paid' && <CheckCircle2 size={11} />}
                                                {inv.status === 'Overdue' && <AlertCircle size={11} />}
                                                {inv.status === 'Sent' && <Clock size={11} />}
                                                <span>{inv.status}</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="px-3 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-lg transition-colors shadow-xs"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 text-xs text-[var(--theme-text-secondary)] flex justify-between items-center">
                    <span>
                        Loaded <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{filteredInvoices.length}</span> receivables in ledger
                    </span>
                    <span className="text-[11px]">
                        Zero-Trust Commercial Aging Telemetry
                    </span>
                </div>
            </div>

            {/* AR Invoice Detail Modal */}
            <ArInvoiceModal
                invoice={selectedInvoice}
                isOpen={Boolean(selectedInvoice)}
                onClose={() => setSelectedInvoice(null)}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

export default AccountsReceivableTab;
