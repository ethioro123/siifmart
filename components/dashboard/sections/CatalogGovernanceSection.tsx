import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Layers, CheckCircle2, XCircle, GitMerge, Search,
    Package, RefreshCw, Filter, ShieldCheck, DollarSign
} from 'lucide-react';
import {
    getMasterProducts,
    approveMasterProduct,
    rejectMasterProduct,
    mergeMasterProduct,
    getMergeCandidates,
    ProductMasterRow
} from '../../../services/products/product-master.service';
import { MergeSkuModal } from './catalog/MergeSkuModal';
import { useStore } from '../../../contexts/CentralStore';
import { logger } from '../../../utils/logger';

interface CatalogGovernanceSectionProps {
    activeCountry: string;
    currencySymbol: string;
}

export const CatalogGovernanceSection: React.FC<CatalogGovernanceSectionProps> = ({
    activeCountry,
    currencySymbol
}) => {
    const { user, showToast } = useStore();
    const queryClient = useQueryClient();

    const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'merges'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [mergeModal, setMergeModal] = useState<{ open: boolean; survivingSku: string; deprecatedSku: string }>({
        open: false,
        survivingSku: '',
        deprecatedSku: ''
    });

    // 1. Fetch Pending Masters
    const {
        data: pendingProducts = [],
        isLoading: loadingPending,
        refetch: refetchPending
    } = useQuery({
        queryKey: ['masterCatalog', activeCountry, 'PENDING'],
        queryFn: () => getMasterProducts(activeCountry, 'PENDING', 50),
        staleTime: 1000 * 30
    });

    // 2. Fetch Approved Masters (on demand)
    const {
        data: approvedProducts = [],
        isLoading: loadingApproved,
        refetch: refetchApproved
    } = useQuery({
        queryKey: ['masterCatalog', activeCountry, 'APPROVED'],
        queryFn: () => getMasterProducts(activeCountry, 'APPROVED', 100),
        enabled: activeSubTab === 'approved',
        staleTime: 1000 * 60
    });

    // 3. Fetch Merge Candidates
    const {
        data: mergeCandidates = [],
        isLoading: loadingMerges,
        refetch: refetchMerges
    } = useQuery({
        queryKey: ['masterCatalog', activeCountry, 'merges'],
        queryFn: () => getMergeCandidates(activeCountry),
        enabled: activeSubTab === 'merges',
        staleTime: 1000 * 60
    });

    // Mutations
    const approveMutation = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            return approveMasterProduct(id, user?.name || 'HQ Executive');
        },
        onSuccess: () => {
            showToast('Master product approved and activated for nationwide sales', 'success');
            queryClient.invalidateQueries({ queryKey: ['masterCatalog'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err: Error) => {
            logger.error('CatalogGovernance', 'Approval failed', { error: err.message });
            showToast(`Approval failed: ${err.message}`, 'error');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            return rejectMasterProduct(id, user?.name || 'HQ Executive', reason);
        },
        onSuccess: () => {
            showToast('Proposed product rejected', 'info');
            setRejectingId(null);
            setRejectReason('');
            queryClient.invalidateQueries({ queryKey: ['masterCatalog'] });
        },
        onError: (err: Error) => {
            logger.error('CatalogGovernance', 'Rejection failed', { error: err.message });
            showToast(`Rejection failed: ${err.message}`, 'error');
        }
    });

    const mergeMutation = useMutation({
        mutationFn: async ({ surviving, deprecated }: { surviving: string; deprecated: string }) => {
            return mergeMasterProduct(activeCountry, surviving, deprecated);
        },
        onSuccess: () => {
            showToast('SKU successfully merged and unified across all facilities', 'success');
            setMergeModal({ open: false, survivingSku: '', deprecatedSku: '' });
            queryClient.invalidateQueries({ queryKey: ['masterCatalog'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err: Error) => {
            logger.error('CatalogGovernance', 'Merge failed', { error: err.message });
            showToast(`Merge failed: ${err.message}`, 'error');
        }
    });

    const filteredPending = pendingProducts.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.origin_region_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredApproved = approvedProducts.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Sub-Navigation */}
            <div className="p-5 sm:p-6 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-xl border border-[var(--theme-accent)]/20">
                            <Layers size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--theme-text-primary)]">
                            Sovereign Catalog Governance
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                            {activeCountry}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                        Review uncatalogued items proposed by regional facilities and manage single canonical SKUs.
                    </p>
                </div>

                {/* Sub-Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('pending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeSubTab === 'pending'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <span>Pending Review</span>
                        {pendingProducts.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                {pendingProducts.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('approved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeSubTab === 'approved'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <span>Approved Master ({approvedProducts.length || '•'})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('merges')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeSubTab === 'merges'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <GitMerge size={12} />
                        <span>Duplicates ({mergeCandidates.length})</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by SKU, product name, or region..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (activeSubTab === 'pending') refetchPending();
                        if (activeSubTab === 'approved') refetchApproved();
                        if (activeSubTab === 'merges') refetchMerges();
                    }}
                    className="p-2 text-xs font-medium bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1.5 cursor-pointer"
                >
                    <RefreshCw size={12} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* TAB 1: PENDING PROPOSALS */}
            {activeSubTab === 'pending' && (
                <div className="space-y-3">
                    {loadingPending ? (
                        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)]">
                            Loading pending catalog proposals...
                        </div>
                    ) : filteredPending.length === 0 ? (
                        <div className="p-12 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] text-center space-y-2">
                            <ShieldCheck size={28} className="mx-auto text-[var(--theme-status-success-text)]" />
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Zero Pending Product Proposals
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto">
                                All regional warehouse and DC additions are aligned with the national master catalog.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredPending.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="p-2.5 bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] rounded-xl border border-[var(--theme-status-warning-border)] shrink-0 mt-0.5">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                                    {item.sku}
                                                </span>
                                                <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                                                    {item.name}
                                                </h3>
                                                {item.origin_region_code && (
                                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                                        Region: {item.origin_region_code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--theme-text-secondary)] mt-1.5">
                                                <span>Category: <strong className="text-[var(--theme-text-primary)]">{item.category || 'General'}</strong></span>
                                                {item.barcode && <span>Barcode: <strong className="font-mono text-[var(--theme-text-primary)]">{item.barcode}</strong></span>}
                                                {item.unit && <span>Unit: <strong className="text-[var(--theme-text-primary)]">{item.unit}</strong></span>}
                                                {item.cost_price !== null && item.cost_price !== undefined && (
                                                    <span>Cost: <strong className="text-[var(--theme-text-primary)]">{currencySymbol} {Number(item.cost_price).toLocaleString()}</strong></span>
                                                )}
                                                {item.created_by && <span>Proposed by: <strong className="text-[var(--theme-text-primary)]">{item.created_by}</strong></span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        {rejectingId === item.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder="Rejection reason..."
                                                    className="px-2.5 py-1 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)]"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                                                    onClick={() => rejectMutation.mutate({ id: item.id, reason: rejectReason })}
                                                    className="px-3 py-1 bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-lg bg-[var(--theme-status-danger-bg)] disabled:opacity-50 cursor-pointer"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                    className="px-2 py-1 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setRejectingId(item.id)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] rounded-xl border border-[var(--theme-status-danger-border)] flex items-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <XCircle size={14} />
                                                    <span>Reject</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={approveMutation.isPending}
                                                    onClick={() => approveMutation.mutate({ id: item.id })}
                                                    className="px-3.5 py-1.5 text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    <span>Approve for POS</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: APPROVED MASTER PRODUCTS */}
            {activeSubTab === 'approved' && (
                <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Active National Catalog
                        </span>
                        <span className="text-xs text-[var(--theme-text-secondary)]">
                            Showing {filteredApproved.length} verified products
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="py-3 px-4">SKU</th>
                                    <th className="py-3 px-4">Product Name</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Primary Barcode</th>
                                    <th className="py-3 px-4">Unit Cost</th>
                                    <th className="py-3 px-4">Approved By</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                {filteredApproved.map((p) => (
                                    <tr key={p.id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-[var(--theme-accent)]">
                                            {p.sku}
                                        </td>
                                        <td className="py-3 px-4 font-medium">{p.name}</td>
                                        <td className="py-3 px-4 text-[var(--theme-text-secondary)]">{p.category || 'General'}</td>
                                        <td className="py-3 px-4 font-mono text-[var(--theme-text-secondary)]">{p.barcode || '—'}</td>
                                        <td className="py-3 px-4">
                                            {p.cost_price !== null && p.cost_price !== undefined
                                                ? `${currencySymbol} ${Number(p.cost_price).toLocaleString()}`
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-[var(--theme-text-secondary)]">
                                            {p.approved_by || 'System'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setMergeModal({ open: true, survivingSku: p.sku, deprecatedSku: '' })}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-lg border border-[var(--theme-border)] inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <GitMerge size={12} />
                                                <span>Merge Another SKU</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: DUPLICATE CANDIDATES */}
            {activeSubTab === 'merges' && (
                <div className="space-y-4">
                    {loadingMerges ? (
                        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)]">
                            Scanning catalog for duplicate names...
                        </div>
                    ) : mergeCandidates.length === 0 ? (
                        <div className="p-12 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] text-center space-y-2">
                            <ShieldCheck size={28} className="mx-auto text-[var(--theme-status-success-text)]" />
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Zero Duplicate Items Detected
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto">
                                Every active product has a single unique SKU nationwide.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {mergeCandidates.map((c, idx) => (
                                <div key={idx} className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] capitalize">
                                            {c.normalized_name}
                                        </h4>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                                            Found {c.master_count} conflicting SKUs: <span className="font-mono text-[var(--theme-text-primary)]">{(c.skus || []).join(', ')}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMergeModal({
                                            open: true,
                                            survivingSku: c.skus?.[0] || '',
                                            deprecatedSku: c.skus?.[1] || ''
                                        })}
                                        className="px-3.5 py-1.5 text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <GitMerge size={14} />
                                        <span>Consolidate into 1 SKU</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Merge Modal */}
            <MergeSkuModal
                isOpen={mergeModal.open}
                onClose={() => setMergeModal({ open: false, survivingSku: '', deprecatedSku: '' })}
                survivingSku={mergeModal.survivingSku}
                deprecatedSku={mergeModal.deprecatedSku}
                onSurvivingSkuChange={(sku) => setMergeModal(prev => ({ ...prev, survivingSku: sku }))}
                onDeprecatedSkuChange={(sku) => setMergeModal(prev => ({ ...prev, deprecatedSku: sku }))}
                onExecuteMerge={() => mergeMutation.mutate({
                    surviving: mergeModal.survivingSku,
                    deprecated: mergeModal.deprecatedSku
                })}
                isPending={mergeMutation.isPending}
            />
        </div>
    );
};
