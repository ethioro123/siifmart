import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { pettyCashService } from '../../services/petty-cash.service';
import type { PettyCashAccount, PettyCashVoucher } from '../../types';

export const PettyCashTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [account, setAccount] = useState<PettyCashAccount | null>(null);
    const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        category: 'Local_Transit' as any,
        description: '',
        amount: '',
        paidTo: '',
        receiptAttached: true
    });
    const [replenishAmount, setReplenishAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const siteId = activeSite?.id || 'ST-001';

    const loadData = async () => {
        setLoading(true);
        try {
            const [acc, vchs] = await Promise.all([
                pettyCashService.getAccount(siteId, effectiveCountry),
                pettyCashService.getVouchers(siteId, effectiveCountry)
            ]);
            setAccount(acc || {
                id: 'PC-DEFAULT',
                siteId,
                countryCode: effectiveCountry,
                currency: currencySymbol,
                authorizedFloat: 10000,
                currentBalance: 8400,
                custodianId: user?.id || 'CUST-001',
                custodianName: user?.name || 'Branch Manager'
            });
            setVouchers(vchs);
        } catch {
            addNotification('alert', 'Failed to load petty cash records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [siteId, effectiveCountry]);

    const handleCreateVoucher = async () => {
        if (!newVoucher.description || !newVoucher.amount || !newVoucher.paidTo) return;
        setIsSubmitting(true);
        try {
            await pettyCashService.recordVoucher(
                {
                    siteId,
                    countryCode: effectiveCountry,
                    voucherDate: new Date().toISOString().split('T')[0],
                    category: newVoucher.category,
                    description: newVoucher.description,
                    amount: Number(newVoucher.amount),
                    receiptAttached: newVoucher.receiptAttached,
                    paidTo: newVoucher.paidTo,
                    createdById: user?.id || 'EMP-01',
                    createdByName: user?.name || 'Staff'
                },
                { id: user?.id || 'EMP-01', name: user?.name || 'Staff' }
            );
            addNotification('success', 'Petty cash voucher issued.');
            setIsVoucherModalOpen(false);
            setNewVoucher({ category: 'Local_Transit', description: '', amount: '', paidTo: '', receiptAttached: true });
            loadData();
        } catch {
            addNotification('alert', 'Failed to issue petty cash voucher');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestReplenish = async () => {
        if (!replenishAmount || Number(replenishAmount) <= 0) return;
        setIsSubmitting(true);
        try {
            await pettyCashService.requestReplenishment(
                siteId,
                Number(replenishAmount),
                account?.currentBalance || 0,
                effectiveCountry,
                { id: user?.id || 'EMP-01', name: user?.name || 'Branch Custodian' }
            );
            addNotification('success', 'Float replenishment requested from Treasury.');
            setIsReplenishModalOpen(false);
            setReplenishAmount('');
        } catch {
            addNotification('alert', 'Failed to request float replenishment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header & Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold block">Current Petty Cash Balance</span>
                        <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                            {currencySymbol} {(account?.currentBalance || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-stone-500 dark:text-gray-400 flex justify-between">
                        <span>Authorized Float:</span>
                        <span className="font-mono text-[#1E3F27] dark:text-white font-bold">{currencySymbol} {(account?.authorizedFloat || 10000).toLocaleString()}</span>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold block">Designated Float Custodian</span>
                        <span className="text-base font-bold text-[#1E3F27] dark:text-white mt-1 block">{account?.custodianName || 'Branch Manager'}</span>
                    </div>
                    <div className="mt-3 text-xs text-stone-500 dark:text-gray-400 flex justify-between">
                        <span>Branch Site:</span>
                        <span className="text-stone-700 dark:text-gray-200 font-mono">{siteId}</span>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5 flex items-center justify-between gap-3">
                    <div className="space-y-2 w-full">
                        <button
                            onClick={() => setIsVoucherModalOpen(true)}
                            className="woody-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} /> Issue Cash Voucher
                        </button>
                        <button
                            onClick={() => setIsReplenishModalOpen(true)}
                            className="woody-btn-secondary w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            <RefreshCw size={14} /> Request Float Top-Up
                        </button>
                    </div>
                </div>
            </div>

            {/* Vouchers Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                <div className="p-4 border-b border-[#E2DCCE] dark:border-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white">Recent Branch Petty Cash Vouchers</h3>
                    <span className="text-xs text-stone-400 dark:text-gray-400 font-mono">{vouchers.length} Recorded</span>
                </div>
                <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5 uppercase text-stone-500 dark:text-gray-500 font-mono">
                        <tr>
                            <th className="p-4">Voucher #</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Paid To</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Receipt</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                        {vouchers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-stone-400 dark:text-gray-500">
                                    No petty cash vouchers logged for this site yet.
                                </td>
                            </tr>
                        ) : (
                            vouchers.map((v) => (
                                <tr key={v.id} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{v.voucherNumber}</td>
                                    <td className="p-4 text-stone-500 dark:text-gray-400 font-mono">{v.voucherDate}</td>
                                    <td className="p-4 text-stone-600 dark:text-gray-300 uppercase text-[10px] font-bold">{v.category.replace('_', ' ')}</td>
                                    <td className="p-4 text-[#1E3F27] dark:text-white">{v.description}</td>
                                    <td className="p-4 text-stone-600 dark:text-gray-300 font-medium">{v.paidTo}</td>
                                    <td className="p-4 text-right font-mono font-bold text-[#1E3F27] dark:text-white">
                                        {currencySymbol} {v.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Attached</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Issue Voucher Modal */}
            {isVoucherModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                            <Plus className="text-emerald-600 dark:text-emerald-400" size={18} />
                            Issue Petty Cash Voucher
                        </h4>
                        <div>
                            <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Paid To</label>
                            <input
                                type="text"
                                value={newVoucher.paidTo}
                                onChange={(e) => setNewVoucher({ ...newVoucher, paidTo: e.target.value })}
                                placeholder="Vendor or staff recipient..."
                                className="woody-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Category</label>
                                <select
                                    value={newVoucher.category}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, category: e.target.value as any })}
                                    className="woody-input"
                                >
                                    <option value="Local_Transit">Local Transit / Dispatch</option>
                                    <option value="Cleaning_Supplies">Cleaning Supplies</option>
                                    <option value="Emergency_Repairs">Emergency Repairs</option>
                                    <option value="Water_Tea">Water &amp; Staff Refreshments</option>
                                    <option value="Other">Other Operational</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Amount ({currencySymbol})</label>
                                <input
                                    type="number"
                                    value={newVoucher.amount}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="woody-input font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Purpose / Description</label>
                            <input
                                type="text"
                                value={newVoucher.description}
                                onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                                placeholder="e.g. Fuel for delivery tricycle emergency run"
                                className="woody-input"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsVoucherModalOpen(false)} className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVoucher}
                                disabled={isSubmitting || !newVoucher.description || !newVoucher.amount || !newVoucher.paidTo}
                                className="woody-btn-primary px-5 py-2 rounded-xl text-xs font-bold"
                            >
                                {isSubmitting ? 'Recording...' : 'Disburse Cash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Replenish Modal */}
            {isReplenishModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                            <RefreshCw className="text-blue-600 dark:text-blue-400" size={18} />
                            Request Float Replenishment
                        </h4>
                        <div>
                            <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Top-Up Amount ({currencySymbol})</label>
                            <input
                                type="number"
                                value={replenishAmount}
                                onChange={(e) => setReplenishAmount(e.target.value)}
                                placeholder="e.g. 5000"
                                className="woody-input font-mono"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsReplenishModalOpen(false)} className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestReplenish}
                                disabled={isSubmitting || !replenishAmount}
                                className="woody-btn-primary px-5 py-2 rounded-xl text-xs font-bold"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request to Treasury'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PettyCashTab;
