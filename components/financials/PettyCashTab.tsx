import React, { useState, useEffect, useMemo } from 'react';
import {
    Coins,
    Plus,
    RefreshCw,
    Loader2,
    ShieldCheck,
    CheckCircle2,
    Search,
    Filter,
    UserCheck,
    Building2,
    Calendar,
    Receipt
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { pettyCashService } from '../../services/petty-cash.service';
import type { PettyCashAccount, PettyCashVoucher } from '../../types';
import { PettyCashVoucherModal } from './PettyCashVoucherModal';
import { PettyCashReplenishModal } from './PettyCashReplenishModal';

export const PettyCashTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [account, setAccount] = useState<PettyCashAccount | null>(null);
    const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
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

    const handleCreateVoucher = async (voucherData: {
        category: 'Local_Transit' | 'Cleaning_Supplies' | 'Emergency_Repairs' | 'Water_Tea' | 'Other';
        description: string;
        amount: string;
        paidTo: string;
        receiptAttached: boolean;
    }) => {
        setIsSubmitting(true);
        try {
            await pettyCashService.recordVoucher(
                {
                    siteId,
                    countryCode: effectiveCountry,
                    voucherDate: new Date().toISOString().split('T')[0],
                    category: voucherData.category,
                    description: voucherData.description,
                    amount: Number(voucherData.amount),
                    receiptAttached: voucherData.receiptAttached,
                    paidTo: voucherData.paidTo,
                    createdById: user?.id || 'EMP-01',
                    createdByName: user?.name || 'Staff'
                },
                { id: user?.id || 'EMP-01', name: user?.name || 'Staff' }
            );
            addNotification('success', 'Petty cash voucher issued.');
            setIsVoucherModalOpen(false);
            loadData();
        } catch {
            addNotification('alert', 'Failed to issue petty cash voucher');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestReplenish = async (amount: string) => {
        setIsSubmitting(true);
        try {
            await pettyCashService.requestReplenishment(
                siteId,
                Number(amount),
                account?.currentBalance || 0,
                effectiveCountry,
                { id: user?.id || 'EMP-01', name: user?.name || 'Branch Custodian' }
            );
            addNotification('success', 'Float replenishment requested from Treasury.');
            setIsReplenishModalOpen(false);
        } catch {
            addNotification('alert', 'Failed to request float replenishment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredVouchers = useMemo(() => {
        return vouchers.filter(v => {
            const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query ||
                (v.voucherNumber && v.voucherNumber.toLowerCase().includes(query)) ||
                (v.description && v.description.toLowerCase().includes(query)) ||
                (v.paidTo && v.paidTo.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [vouchers, categoryFilter, searchQuery]);

    const currentBalance = account?.currentBalance || 0;
    const authorizedFloat = account?.authorizedFloat || 10000;
    const floatReservePct = Math.min(100, Math.max(0, Math.round((currentBalance / authorizedFloat) * 100)));

    return (
        <div className="space-y-4">
            {/* Executive Float Health Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Balance Card */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Physical Vault Balance
                        </span>
                        <h4 className="text-2xl font-semibold tracking-tight text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono tabular-nums mt-1">
                            {currencySymbol} {currentBalance.toLocaleString()}
                        </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] flex justify-between">
                        <span>Authorized Target:</span>
                        <span className="font-mono font-medium text-[var(--theme-text-primary)]">
                            {currencySymbol} {authorizedFloat.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Float Utilization & Progress */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                Float Reserve Level
                            </span>
                            <span className="text-xs font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                {floatReservePct}%
                            </span>
                        </div>
                        <div className="h-2 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden mt-2.5">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    floatReservePct < 25
                                        ? 'bg-[var(--theme-status-danger-bg)]'
                                        : floatReservePct < 50
                                            ? 'bg-[var(--theme-status-warning-bg)]'
                                            : 'bg-[var(--theme-status-success-bg)]'
                                }`}
                                style={{ width: `${floatReservePct}%` }}
                            />
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] flex justify-between">
                        <span>Deficit to replenish:</span>
                        <span className="font-mono font-medium text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                            {currencySymbol} {Math.max(0, authorizedFloat - currentBalance).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Custodian Card */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                Designated Custodian
                            </span>
                            <h4 className="text-base font-semibold text-[var(--theme-text-primary)] mt-1 truncate">
                                {account?.custodianName || 'Branch Manager'}
                            </h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] flex justify-between">
                        <span>Branch Site:</span>
                        <span className="font-mono font-medium text-[var(--theme-text-primary)]">{siteId}</span>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-center gap-2">
                    <button
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="w-full py-2 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                        <Plus size={14} />
                        <span>Issue Cash Voucher</span>
                    </button>
                    <button
                        onClick={() => setIsReplenishModalOpen(true)}
                        className="w-full py-2 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                        <RefreshCw size={14} />
                        <span>Request Float Top-Up</span>
                    </button>
                </div>
            </div>

            {/* Vouchers Table Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {/* Header & Filter Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Branch Petty Cash Vouchers
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>Zero-Trust Vault Audit</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 w-52">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search voucher, payee..."
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none w-full placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search petty cash vouchers"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1"
                                aria-label="Filter vouchers by category"
                            >
                                <option value="All">All Categories</option>
                                <option value="Local_Transit">Local Transit / Dispatch</option>
                                <option value="Cleaning_Supplies">Cleaning Supplies</option>
                                <option value="Emergency_Repairs">Emergency Repairs</option>
                                <option value="Water_Tea">Water &amp; Refreshments</option>
                                <option value="Other">Other Operational</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-xs text-[var(--theme-text-secondary)] font-mono">
                        Site: <span className="font-semibold text-[var(--theme-text-primary)]">{siteId}</span> | Currency: <span className="font-semibold text-[var(--theme-text-primary)]">{currencySymbol}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono">Voucher #</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono">Date</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Category</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Purpose / Description</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Paid To</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-[var(--theme-text-secondary)]">
                                        <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                                        <span className="text-xs">Loading petty cash vouchers...</span>
                                    </td>
                                </tr>
                            ) : filteredVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                                                <Coins size={22} />
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                No petty cash vouchers recorded
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                No vouchers logged for this site or search query.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[var(--theme-accent)] dark:text-[var(--theme-accent)] whitespace-nowrap">
                                            {v.voucherNumber}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-mono text-[var(--theme-text-secondary)] whitespace-nowrap tabular-nums">
                                            {v.voucherDate}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]">
                                                {v.category.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-text-primary)]">
                                            {v.description}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--theme-text-secondary)] font-medium whitespace-nowrap">
                                            {v.paidTo}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {v.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                                <CheckCircle2 size={11} />
                                                <span>Attached</span>
                                            </span>
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
                        Loaded <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{filteredVouchers.length}</span> petty cash vouchers
                    </span>
                    <span className="text-[11px]">
                        Zero-Trust Physical Vault Imprest Audit Trail
                    </span>
                </div>
            </div>

            {/* Modular Issue Voucher Modal */}
            <PettyCashVoucherModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                onSubmit={handleCreateVoucher}
                isSubmitting={isSubmitting}
                currencySymbol={currencySymbol}
            />

            {/* Modular Replenish Modal */}
            <PettyCashReplenishModal
                isOpen={isReplenishModalOpen}
                onClose={() => setIsReplenishModalOpen(false)}
                onSubmit={handleRequestReplenish}
                isSubmitting={isSubmitting}
                currencySymbol={currencySymbol}
                currentBalance={currentBalance}
                authorizedFloat={authorizedFloat}
            />
        </div>
    );
};

export default PettyCashTab;
