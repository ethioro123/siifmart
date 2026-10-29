import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert,
    CheckCircle2,
    XCircle,
    ArrowDownRight,
    Loader2,
    Search,
    RefreshCw,
    TrendingDown,
    Check,
    X,
    ShieldCheck,
    Store
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { marginApprovalService } from '../../services/margin-approval.service';
import { MarginExceptionModal } from './MarginExceptionModal';
import type { MarginApprovalRequest } from '../../types';

export const LowMarginQueueTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [requests, setRequests] = useState<MarginApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MarginApprovalRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const canApproveMargin = ['country_finance_director', 'country_compliance_manager', 'auditor', 'country_managing_director', 'group_ceo'].includes(user?.role?.toLowerCase() || '');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await marginApprovalService.getRequests(
                effectiveCountry,
                statusFilter === 'All' ? undefined : statusFilter
            );
            setRequests(data);
        } catch {
            addNotification('alert', 'Failed to load margin approval queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [effectiveCountry, statusFilter]);

    const handleSignOff = async (id: string, action: 'Approved' | 'Rejected', reason?: string) => {
        setIsActionLoading(true);
        try {
            await marginApprovalService.signOff(
                id,
                action,
                { id: user?.id || 'FIN-001', name: user?.name || 'Finance Staff' },
                reason
            );
            addNotification('success', `Margin approval request #${id.slice(0, 8)} ${action.toLowerCase()}.`);
            await loadData();
        } catch {
            addNotification('alert', 'Failed to sign off margin approval');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleOpenReview = (request: MarginApprovalRequest) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    // Filter requests by search query
    const filteredRequests = useMemo(() => {
        if (!searchQuery.trim()) return requests;
        const q = searchQuery.toLowerCase();
        return requests.filter(
            (r) =>
                r.productName.toLowerCase().includes(q) ||
                r.sku.toLowerCase().includes(q) ||
                (r.requestNumber && r.requestNumber.toLowerCase().includes(q)) ||
                (r.siteId && r.siteId.toLowerCase().includes(q))
        );
    }, [requests, searchQuery]);

    // KPI Metrics calculation
    const pendingCount = requests.filter((r) => r.status === 'Pending').length;
    const approvedCount = requests.filter((r) => r.status === 'Approved').length;
    const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;
    const avgDeficit = requests.length > 0
        ? (requests.reduce((acc, curr) => acc + Math.abs(curr.marginVariancePct), 0) / requests.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Toolbar */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Margin Protection &amp; Floor Control
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Rule 2 Landed COGS safeguard — Finance governance queue for sub-hurdle retail pricing and promotional markdowns.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all"
                        title="Reload Queue"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Apple 4-Card Executive KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Pending Reviews */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Pending Reviews
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {pendingCount}
                        </div>
                        <div className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-0.5">
                            Awaiting clearance
                        </div>
                    </div>
                </div>

                {/* Approved Exceptions */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Approved Exceptions
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {approvedCount}
                        </div>
                        <div className="text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-0.5">
                            Policy overrides active
                        </div>
                    </div>
                </div>

                {/* Rejected Cuts */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                        <XCircle size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Rejected Price Cuts
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {rejectedCount}
                        </div>
                        <div className="text-[11px] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] mt-0.5">
                            Floor protected
                        </div>
                    </div>
                </div>

                {/* Avg Hurdle Deficit */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Avg Hurdle Deficit
                        </div>
                        <div className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5 flex items-center gap-1">
                            <span>-{avgDeficit}%</span>
                        </div>
                        <div className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                            Deviation from target
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-3">
                {/* Live Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={14} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search SKU, product name, or store ID..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-all"
                    />
                </div>

                {/* Apple Segmented Control */}
                <div className="flex items-center p-0.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-medium">
                    {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                statusFilter === status
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {status === 'Pending' ? 'Pending Review' : status === 'All' ? 'All Records' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] uppercase text-[11px] font-medium text-[var(--theme-text-secondary)] tracking-wider">
                            <tr>
                                <th className="p-4">SKU / Item</th>
                                <th className="p-4 text-right">Landed Cost</th>
                                <th className="p-4 text-right">Proposed Price</th>
                                <th className="p-4 text-right">Proposed Margin</th>
                                <th className="p-4 text-right">Target Hurdle</th>
                                <th className="p-4 text-center">Variance</th>
                                <th className="p-4">Justification</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-[var(--theme-text-secondary)]">
                                        <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                                        Loading margin protection queue...
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-[var(--theme-text-primary)]">
                                                Margin Floor Protected
                                            </span>
                                            <span className="text-xs text-[var(--theme-text-secondary)] max-w-sm">
                                                No low-margin price exceptions in queue. All active retail prices comply with company gross margin targets.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((r) => {
                                    const isPending = r.status === 'Pending';
                                    const isApproved = r.status === 'Approved';
                                    const isRejected = r.status === 'Rejected';

                                    return (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-[var(--theme-bg-subtle)] transition-colors group cursor-pointer"
                                            onClick={() => handleOpenReview(r)}
                                        >
                                            {/* SKU / Item */}
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="text-[var(--theme-text-primary)] font-semibold leading-tight">
                                                    {r.productName}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                                                        {r.sku}
                                                    </span>
                                                    {r.siteId && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--theme-text-secondary)]">
                                                            <Store size={10} /> {r.siteId}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Landed Cost */}
                                            <td className="p-4 text-right font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                                {currencySymbol} {r.costPrice.toLocaleString()}
                                            </td>

                                            {/* Proposed Price */}
                                            <td className="p-4 text-right font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                                                {currencySymbol} {r.proposedRetailPrice.toLocaleString()}
                                            </td>

                                            {/* Proposed Margin */}
                                            <td className="p-4 text-right font-mono tabular-nums font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                                                {r.proposedMarginPct.toFixed(1)}%
                                            </td>

                                            {/* Target Margin */}
                                            <td className="p-4 text-right font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                                {r.targetMarginPct.toFixed(1)}%
                                            </td>

                                            {/* Variance */}
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] px-2 py-0.5 rounded-full border border-[var(--theme-status-danger-border)] font-mono">
                                                    <ArrowDownRight size={11} /> {Math.abs(r.marginVariancePct).toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* Justification */}
                                            <td
                                                className="p-4 text-[var(--theme-text-secondary)] text-xs truncate max-w-[180px]"
                                                title={r.reason}
                                            >
                                                {r.reason}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                                    isApproved
                                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                        : isRejected
                                                            ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                                            : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                                }`}>
                                                    {isApproved && <CheckCircle2 size={11} />}
                                                    {isRejected && <XCircle size={11} />}
                                                    {r.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td
                                                className="p-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenReview(r)}
                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-all"
                                                    >
                                                        Review
                                                    </button>

                                                    {isPending && canApproveMargin && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSignOff(r.id, 'Approved')}
                                                                disabled={isActionLoading}
                                                                className="p-1.5 rounded-lg bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] transition-all disabled:opacity-50"
                                                                title="Quick Approve Exception"
                                                            >
                                                                <Check size={13} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSignOff(r.id, 'Rejected')}
                                                                disabled={isActionLoading}
                                                                className="p-1.5 rounded-lg bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] transition-all disabled:opacity-50"
                                                                title="Quick Reject Price Cut"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Margin Exception Modal */}
            <MarginExceptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
                currencySymbol={currencySymbol}
                canApprove={canApproveMargin}
                onSignOff={handleSignOff}
            />
        </div>
    );
};

export default LowMarginQueueTab;
