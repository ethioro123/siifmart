import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    CheckCircle2,
    AlertTriangle,
    DollarSign,
    Loader2,
    ShieldAlert,
    Search,
    Filter,
    ShieldCheck,
    CreditCard,
    ArrowUpRight
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { accountsPayableService } from '../../services/accounts-payable.service';
import type { VendorInvoice } from '../../types';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { InvoiceOverrideModal } from './InvoiceOverrideModal';
import { isAdminSite } from '../../utils/countryAdmin';

export const AccountsPayableTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

    const canCreatePaymentRun = ['finance_manager', 'super_admin', 'CEO', 'ceo', 'admin', 'cfo'].includes(user?.role);
    const canOverride = ['finance_manager', 'regional_finance_officer', 'cfo', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await accountsPayableService.getInvoices({
                countryCode: effectiveCountry,
                siteId: isAdminSite(activeSite) ? undefined : activeSite?.id,
                status: statusFilter === 'All' ? undefined : statusFilter
            });
            setInvoices(data);
        } catch {
            addNotification('alert', 'Failed to load vendor invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, [effectiveCountry, activeSite?.id, statusFilter]);

    const handleOverride = async (reason: string) => {
        if (!selectedInvoice) return;
        setIsActionLoading(true);
        try {
            const updated = await accountsPayableService.overrideDiscrepancy(
                selectedInvoice.id,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff', role: user?.role || 'finance_manager' },
                reason
            );
            setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
            setSelectedInvoice(updated);
            setOverrideModalOpen(false);
            addNotification('success', `Discrepancy overridden for invoice ${updated.invoiceNumber}`);
        } catch (err: any) {
            addNotification('alert', err?.message || 'Failed to override discrepancy');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCreatePaymentRun = async () => {
        if (selectedInvoiceIds.length === 0) return;
        setIsActionLoading(true);
        try {
            const channel = effectiveCountry === 'KE' ? 'M_Pesa' : 'Bank_Transfer';
            const run = await accountsPayableService.createPaymentRun(
                selectedInvoiceIds,
                channel,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff' },
                effectiveCountry,
                currencySymbol
            );
            addNotification('success', `Created Payment Run #${run.runNumber} for ${run.totalInvoices} invoices.`);
            setSelectedInvoiceIds([]);
            loadInvoices();
        } catch (err: any) {
            addNotification('alert', err?.message || 'Failed to create payment run');
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedInvoiceIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Executive Metrics
    const stats = useMemo(() => {
        let totalOutstanding = 0;
        let matchedCount = 0;
        let matchedAmount = 0;
        let discrepancyCount = 0;
        let selectedAmount = 0;

        for (const inv of invoices) {
            if (inv.status !== 'Paid') {
                totalOutstanding += inv.totalAmount || 0;
            }
            if (inv.matchStatus === 'Matched' || inv.matchStatus === 'Manual_Override') {
                matchedCount++;
                if (inv.status !== 'Paid') matchedAmount += inv.totalAmount || 0;
            } else if (inv.matchStatus.startsWith('Discrepancy')) {
                discrepancyCount++;
            }
            if (selectedInvoiceIds.includes(inv.id)) {
                selectedAmount += inv.totalAmount || 0;
            }
        }

        return { totalOutstanding, matchedCount, matchedAmount, discrepancyCount, selectedAmount };
    }, [invoices, selectedInvoiceIds]);

    const filteredInvoices = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return invoices;
        return invoices.filter(inv =>
            (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(query)) ||
            (inv.vendorName && inv.vendorName.toLowerCase().includes(query)) ||
            (inv.poNumber && inv.poNumber.toLowerCase().includes(query)) ||
            (inv.receivingManifestNumber && inv.receivingManifestNumber.toLowerCase().includes(query))
        );
    }, [invoices, searchQuery]);

    return (
        <div className="space-y-4">
            {/* Executive KPI Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Total AP Outstanding
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                        {currencySymbol} {stats.totalOutstanding.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Unsettled commercial payables
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            3-Way Matched &amp; Ready
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {stats.matchedCount} bills
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Verified PO + GRN alignment
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Match Discrepancies
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
                        {stats.discrepancyCount} bills
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Requires supervisor override
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Payment Batch Staged
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                            <CreditCard size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-[#0071E3] dark:text-[#2997FF] font-mono tabular-nums mt-1">
                        {selectedInvoiceIds.length > 0 ? `${currencySymbol} ${stats.selectedAmount.toLocaleString()}` : '0 staged'}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        {selectedInvoiceIds.length} bills selected for run
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
                                Accounts Payable (AP) Ledger
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>3-Way Match Hardened</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 w-56">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search invoice, vendor..."
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none w-full placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search invoices"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1"
                                aria-label="Filter invoices by status"
                            >
                                <option value="All">All Invoices</option>
                                <option value="Matched">3-Way Matched</option>
                                <option value="Manual_Override">Manual Override</option>
                                <option value="Discrepancy_Quantity">Qty Discrepancy</option>
                                <option value="Discrepancy_Price">Price Discrepancy</option>
                                <option value="Paid">Settled / Paid</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedInvoiceIds.length > 0 && canCreatePaymentRun && (
                            <button
                                onClick={handleCreatePaymentRun}
                                disabled={isActionLoading}
                                className="bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                            >
                                {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <DollarSign size={14} />}
                                <span>Create Payment Run ({selectedInvoiceIds.length})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 w-10"></th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Invoice #</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Vendor</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">PO Ref</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Receiving Ref</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">3-Way Match</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-[var(--theme-text-secondary)]">
                                        <Loader2 className="animate-spin inline mr-2 text-[#0071E3] dark:text-[#2997FF]" size={18} />
                                        <span className="text-xs">Loading Accounts Payable invoices...</span>
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                                                <FileText size={22} />
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                No vendor invoices recorded
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                No invoices match the active filters or search terms.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const isMatched = inv.matchStatus === 'Matched' || inv.matchStatus === 'Manual_Override';
                                    const isDiscrepant = inv.matchStatus.startsWith('Discrepancy');

                                    return (
                                        <tr key={inv.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInvoiceIds.includes(inv.id)}
                                                    onChange={() => toggleSelect(inv.id)}
                                                    disabled={!canCreatePaymentRun || !isMatched || inv.status === 'Paid'}
                                                    className="rounded text-[#0071E3] dark:text-[#2997FF] focus:ring-0 disabled:opacity-30 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--theme-text-primary)] whitespace-nowrap">
                                                {inv.invoiceNumber}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-text-primary)] whitespace-nowrap">
                                                {inv.vendorName}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono text-[var(--theme-text-secondary)] whitespace-nowrap">
                                                {inv.poNumber || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono text-[var(--theme-text-secondary)] whitespace-nowrap">
                                                {inv.receivingManifestNumber || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                                {currencySymbol} {inv.totalAmount.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                                    inv.matchStatus === 'Matched'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : inv.matchStatus === 'Manual_Override'
                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {inv.matchStatus === 'Matched' && <CheckCircle2 size={11} />}
                                                    {inv.matchStatus === 'Manual_Override' && <ShieldAlert size={11} />}
                                                    {isDiscrepant && <AlertTriangle size={11} />}
                                                    <span>{inv.matchStatus.replace(/_/g, ' ')}</span>
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`text-[11px] font-medium uppercase font-mono ${
                                                    inv.status === 'Paid'
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-[var(--theme-text-secondary)]'
                                                }`}>
                                                    {inv.status.replace(/_/g, ' ')}
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 text-xs text-[var(--theme-text-secondary)] flex justify-between items-center">
                    <span>
                        Loaded <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{filteredInvoices.length}</span> invoices in ledger
                    </span>
                    <span className="text-[11px]">
                        Zero-Trust Procurement Alignment (PO ↔ Receiving Manifest ↔ Invoiced Bill)
                    </span>
                </div>
            </div>

            {/* Line Item Match Details Modal */}
            <InvoiceDetailsModal
                invoice={selectedInvoice}
                isOpen={Boolean(selectedInvoice)}
                onClose={() => setSelectedInvoice(null)}
                onOpenOverride={() => setOverrideModalOpen(true)}
                canOverride={canOverride}
                currencySymbol={currencySymbol}
            />

            {/* Supervisory Override Modal */}
            <InvoiceOverrideModal
                isOpen={overrideModalOpen}
                onClose={() => setOverrideModalOpen(false)}
                onConfirm={handleOverride}
                isActionLoading={isActionLoading}
                invoiceNumber={selectedInvoice?.invoiceNumber || ''}
            />
        </div>
    );
};

export default AccountsPayableTab;
