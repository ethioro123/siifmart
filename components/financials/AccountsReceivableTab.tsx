import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Search, Filter, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { accountsReceivableService } from '../../services/accounts-receivable.service';
import type { ArInvoice, ArAgingReport } from '../../types';

export const AccountsReceivableTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [invoices, setInvoices] = useState<ArInvoice[]>([]);
    const [aging, setAging] = useState<ArAgingReport>({ current: 0, days31to60: 0, days61to90: 0, days90Plus: 0, totalOutstanding: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredInvoices = invoices.filter(i =>
        i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                        <CreditCard className="text-emerald-600 dark:text-emerald-400" size={18} />
                        Accounts Receivable (AR) &amp; Commercial Credit Control
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        B2B wholesale customer invoicing, payment terms, due-date aging, and credit hold governance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                        <Search size={14} className="text-stone-400 dark:text-gray-400 mr-2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search customer or invoice..."
                            className="bg-transparent text-[#1E3F27] dark:text-white outline-none w-44 placeholder-stone-400 dark:placeholder-gray-500"
                        />
                    </div>

                    <div className="flex items-center bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                        <Filter size={14} className="text-stone-400 dark:text-gray-400 mr-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[#1E3F27] dark:text-gray-200 outline-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Sent">Open / Sent</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* AR Aging Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white/90 dark:bg-stone-900/60 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3">
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold block">Current (0-30 Days)</span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                        {currencySymbol} {aging.current.toLocaleString()}
                    </span>
                </div>
                <div className="bg-white/90 dark:bg-stone-900/60 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-3">
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold block">31-60 Days</span>
                    <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                        {currencySymbol} {aging.days31to60.toLocaleString()}
                    </span>
                </div>
                <div className="bg-white/90 dark:bg-stone-900/60 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-3">
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold block">61-90 Days</span>
                    <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                        {currencySymbol} {aging.days61to90.toLocaleString()}
                    </span>
                </div>
                <div className="bg-white/90 dark:bg-stone-900/60 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-3">
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold block">90+ Days Overdue</span>
                    <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                        {currencySymbol} {aging.days90Plus.toLocaleString()}
                    </span>
                </div>
                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-3 col-span-2 md:col-span-1">
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold block">Total Outstanding AR</span>
                    <span className="text-sm font-bold font-mono text-[#1E3F27] dark:text-white mt-1 block">
                        {currencySymbol} {aging.totalOutstanding.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5 uppercase text-stone-500 dark:text-gray-500">
                        <tr>
                            <th className="p-4">Invoice #</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Date / Due</th>
                            <th className="p-4">Terms</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-right">Balance Due</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-stone-400 dark:text-gray-400">
                                    <Loader2 className="animate-spin inline mr-2" size={18} /> Loading AR Invoices...
                                </td>
                            </tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-stone-400 dark:text-gray-500">
                                    No B2B receivables found matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono font-bold text-[#1E3F27] dark:text-white whitespace-nowrap">{inv.invoiceNumber}</td>
                                    <td className="p-4 text-stone-700 dark:text-gray-200 font-medium">{inv.customerName}</td>
                                    <td className="p-4 whitespace-nowrap text-stone-500 dark:text-gray-400 font-mono text-[11px]">
                                        <div>Inv: {inv.invoiceDate}</div>
                                        <div className="text-stone-400 dark:text-gray-500">Due: {inv.dueDate}</div>
                                    </td>
                                    <td className="p-4 text-stone-500 dark:text-gray-400 uppercase font-mono text-[10px]">{inv.paymentTerms.replace('_', ' ')}</td>
                                    <td className="p-4 text-right font-mono text-stone-600 dark:text-gray-300">
                                        {currencySymbol} {inv.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-[#1E3F27] dark:text-white whitespace-nowrap">
                                        {currencySymbol} {inv.balanceDue.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            inv.status === 'Paid'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : inv.status === 'Overdue'
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                        }`}>
                                            {inv.status === 'Paid' && <CheckCircle size={10} />}
                                            {inv.status === 'Overdue' && <AlertCircle size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AccountsReceivableTab;
