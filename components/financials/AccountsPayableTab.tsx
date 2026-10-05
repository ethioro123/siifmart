import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, DollarSign, Loader2, ShieldAlert } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { accountsPayableService } from '../../services/accounts-payable.service';
import type { VendorInvoice, InvoiceMatchStatus } from '../../types';

export const AccountsPayableTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

    const canManageAP = ['finance_manager', 'super_admin', 'CEO', 'ceo', 'admin', 'accountant'].includes(user?.role);
    const canOverride = ['finance_manager', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await accountsPayableService.getInvoices({
                countryCode: effectiveCountry,
                siteId: activeSite?.id,
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

    const handleOverride = async () => {
        if (!selectedInvoice || overrideReason.trim().length < 10) return;
        setIsActionLoading(true);
        try {
            const updated = await accountsPayableService.overrideDiscrepancy(
                selectedInvoice.id,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff', role: user?.role || 'finance_manager' },
                overrideReason
            );
            setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
            setSelectedInvoice(updated);
            setOverrideModalOpen(false);
            setOverrideReason('');
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

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                        <FileText className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={18} />
                        Accounts Payable (AP) &amp; 3-Way Match Verification
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        Guaranteed Zero-Trust vendor payment governance: PO ↔ Warehouse Receiving Manifest ↔ Invoiced Bill.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {selectedInvoiceIds.length > 0 && canManageAP && (
                        <button
                            onClick={handleCreatePaymentRun}
                            disabled={isActionLoading}
                            className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                            <DollarSign size={14} /> Create Payment Run ({selectedInvoiceIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5">
                        <tr>
                            <th className="p-4 w-10"></th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Invoice #</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Vendor</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">PO Ref</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Receiving Ref</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Amount</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-center">3-Way Match</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-center">Payment Status</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-stone-400 dark:text-gray-400">
                                    <Loader2 className="animate-spin inline mr-2" size={18} /> Loading AP records...
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-16 text-center text-stone-400 dark:text-gray-400">
                                    <FileText size={40} className="mx-auto mb-2 text-stone-300 dark:text-gray-600" />
                                    <p className="text-sm">No vendor invoices recorded yet.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => {
                                const isMatched = inv.matchStatus === 'Matched' || inv.matchStatus === 'Manual_Override';
                                const isDiscrepant = inv.matchStatus.startsWith('Discrepancy');

                                return (
                                    <tr key={inv.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoiceIds.includes(inv.id)}
                                                onChange={() => toggleSelect(inv.id)}
                                                disabled={!isMatched || inv.status === 'Paid'}
                                                className="rounded text-emerald-600 dark:text-emerald-500 disabled:opacity-30"
                                            />
                                        </td>
                                        <td className="p-4 font-mono text-xs font-bold text-[#1E3F27] dark:text-white whitespace-nowrap">
                                            {inv.invoiceNumber}
                                        </td>
                                        <td className="p-4 text-xs text-stone-600 dark:text-gray-300 font-medium">{inv.vendorName}</td>
                                        <td className="p-4 text-xs font-mono text-stone-500 dark:text-gray-400">{inv.poNumber || 'N/A'}</td>
                                        <td className="p-4 text-xs font-mono text-stone-500 dark:text-gray-400">{inv.receivingManifestNumber || 'N/A'}</td>
                                        <td className="p-4 text-xs text-right font-mono font-bold text-[#1E3F27] dark:text-white whitespace-nowrap">
                                            {currencySymbol} {inv.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                inv.matchStatus === 'Matched'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                    : inv.matchStatus === 'Manual_Override'
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                            }`}>
                                                {inv.matchStatus === 'Matched' && <CheckCircle size={10} />}
                                                {inv.matchStatus === 'Manual_Override' && <ShieldAlert size={10} />}
                                                {isDiscrepant && <AlertTriangle size={10} />}
                                                {inv.matchStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-gray-400">
                                                {inv.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="woody-btn-secondary px-3 py-1 text-xs rounded-lg"
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

            {/* Line Item Match Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-[#E2DCCE] dark:border-white/5 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                                    3-Way Match Verification: {selectedInvoice.invoiceNumber}
                                </h4>
                                <span className="text-xs text-stone-500 dark:text-gray-400">{selectedInvoice.vendorName}</span>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="text-stone-400 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white text-lg leading-none">✕</button>
                        </div>

                        {selectedInvoice.matchDiscrepancyNotes && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block mb-0.5">Discrepancy Diagnostics:</span>
                                    <span>{selectedInvoice.matchDiscrepancyNotes}</span>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto max-h-60 border border-[#E2DCCE] dark:border-white/5 rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-100/80 dark:bg-black/40 text-stone-500 dark:text-gray-400 uppercase">
                                    <tr>
                                        <th className="p-3">SKU / Item</th>
                                        <th className="p-3 text-right">PO Qty</th>
                                        <th className="p-3 text-right">Dock Recv</th>
                                        <th className="p-3 text-right">Invoiced</th>
                                        <th className="p-3 text-right">Unit Price</th>
                                        <th className="p-3 text-right">Variance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5 font-mono">
                                    {(selectedInvoice.items || []).map((item) => (
                                        <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                            <td className="p-3 text-[#1E3F27] dark:text-white font-sans">{item.itemName}</td>
                                            <td className="p-3 text-right text-stone-500 dark:text-gray-400">{item.poQuantity}</td>
                                            <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{item.receivedQuantity}</td>
                                            <td className="p-3 text-right text-[#1E3F27] dark:text-white font-bold">{item.invoicedQuantity}</td>
                                            <td className="p-3 text-right text-stone-600 dark:text-gray-300">{currencySymbol} {item.invoicedUnitPrice}</td>
                                            <td className={`p-3 text-right font-bold ${item.matchVariancePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {item.matchVariancePct > 0 ? `+${item.matchVariancePct}%` : '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            {selectedInvoice.matchStatus.startsWith('Discrepancy') && canOverride && (
                                <button
                                    onClick={() => setOverrideModalOpen(true)}
                                    className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Supervisory Override (Rule 18)
                                </button>
                            )}
                            <div className="ml-auto">
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Supervisory Override Modal */}
            {overrideModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                            <ShieldAlert className="text-amber-600 dark:text-amber-400" size={18} />
                            Mandatory Override Reason (Rule 18)
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-gray-300">
                            You are overriding an Accounts Payable match discrepancy. This action will be permanently co-signed with your manager credentials.
                        </p>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="woody-input resize-none h-24"
                            placeholder="State supplier contract clause, approved adjustment, or shipment justification..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setOverrideModalOpen(false)}
                                className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOverride}
                                disabled={overrideReason.trim().length < 10 || isActionLoading}
                                className="woody-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                                {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                                Confirm Override
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsPayableTab;
