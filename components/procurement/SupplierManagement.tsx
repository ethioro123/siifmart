import React, { useState, useMemo } from 'react';
import { Supplier, Product } from '../../types';
import { Protected } from '../../components/Protected';
import { Building, Plus, Search, Star, Mail, Phone, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { getSupplierIcon } from './utils';
import { AddSupplierModal } from './AddSupplierModal';
import { SupplierDetailsModal } from './SupplierDetailsModal';
import { ProductCatalogModal } from './ProductCatalogModal';
import type { SupplierDraft } from '../../services/suppliers.service';

interface SupplierManagementProps {
    suppliers: Supplier[];
    loading?: boolean;
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onAddSupplier: (supplier: SupplierDraft) => Promise<unknown>;
    onVerifySupplier: (supplier: Supplier) => Promise<unknown>;
    canVerify: boolean;
    viewerEmployeeId?: string;
    onOpenCreatePO: (product?: Product, supplierId?: string) => void;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
    suppliers,
    loading = false,
    totalCount,
    currentPage,
    onPageChange,
    onAddSupplier,
    onVerifySupplier,
    canVerify,
    viewerEmployeeId,
    onOpenCreatePO
}) => {
    const ITEMS_PER_PAGE = 20;

    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // Modal States
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [verificationError, setVerificationError] = useState('');
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    const handleVerify = async (supplier: Supplier) => {
        setVerificationError('');
        setVerifyingId(supplier.id);
        try {
            await onVerifySupplier(supplier);
        } catch (error) {
            setVerificationError(error instanceof Error ? error.message : 'Verification failed.');
        } finally {
            setVerifyingId(null);
        }
    };

    // Filter suppliers
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(sup => {
            const matchesSearch = !searchQuery.trim() ||
                sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sup.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sup.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sup.phone?.includes(searchQuery);

            const matchesCategory = selectedCategory === 'ALL' ||
                sup.category === selectedCategory ||
                (selectedCategory === 'Farmer' && sup.type === 'Farmer');

            return matchesSearch && matchesCategory;
        });
    }, [suppliers, searchQuery, selectedCategory]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        suppliers.forEach(s => {
            if (s.category) set.add(s.category);
        });
        return Array.from(set);
    }, [suppliers]);

    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

    const handleSupplierClick = (sup: Supplier) => {
        setSelectedSupplier(sup);
        setIsContactModalOpen(true);
    };

    const handleCatalogClick = (e: React.MouseEvent, sup: Supplier) => {
        e.stopPropagation();
        setSelectedSupplier(sup);
        setIsProductCatalogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
                        <Building size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">Supplier Directory</h2>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            <span className="font-mono tabular-nums font-semibold">{totalCount}</span> suppliers in your authorized country and region
                        </p>
                    </div>
                </div>
                <Protected permission="MANAGE_SUPPLIERS">
                    <button
                        onClick={() => setIsAddSupplierOpen(true)}
                        className="h-11 px-5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
                    >
                        <Plus size={16} strokeWidth={2} /> Add New Supplier
                    </button>
                </Protected>
            </div>
            {verificationError && <p role="alert" className="text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">{verificationError}</p>}

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by supplier name, contact, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === 'ALL'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.slice(0, 5).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Suppliers Table Container */}
            <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            <th className="py-3.5 px-6 font-semibold">Supplier Name</th>
                            <th className="py-3.5 px-4 font-semibold">Category</th>
                            <th className="py-3.5 px-4 font-semibold">Status</th>
                            <th className="py-3.5 px-4 font-semibold">Performance</th>
                            <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                            <th className="py-3.5 px-6 font-semibold text-right">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {filteredSuppliers.map((sup) => {
                            const Icon = getSupplierIcon(sup.type);
                            return (
                                <tr
                                    key={sup.id}
                                    onClick={() => handleSupplierClick(sup)}
                                    className="hover:bg-[var(--theme-bg-subtle)]/60 transition-colors cursor-pointer group"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors shrink-0">
                                                <Icon size={18} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">{sup.name}</h3>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono font-medium uppercase mt-0.5">
                                                    Terms: {sup.paymentTerms || 'Net 30'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{sup.category || 'General'}</span>
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{sup.type}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                            sup.status === 'Active' && sup.verificationStatus === 'verified'
                                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sup.status === 'Active' && sup.verificationStatus === 'verified' ? 'bg-[var(--theme-status-success-bg)]' : 'bg-[var(--theme-status-danger-bg)]'}`} />
                                            {sup.verificationStatus === 'verified' ? sup.status : 'Pending verification'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={12} className="text-[var(--theme-status-warning-text)] fill-amber-500" />
                                                <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{sup.rating ?? 'Unrated'}</span>
                                                {sup.rating != null && <span className="text-[11px] text-[var(--theme-text-secondary)]">/ 5.0</span>}
                                            </div>
                                            <span className="text-[10px] text-[var(--theme-text-secondary)]">{sup.regionCode || 'Country shared'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1">
                                            {sup.email && (
                                                <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] font-medium">
                                                    <Mail size={12} className="shrink-0 text-[var(--theme-text-secondary)]" />
                                                    <span className="truncate max-w-[160px]">{sup.email}</span>
                                                </div>
                                            )}
                                            {sup.phone && (
                                                <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] font-mono">
                                                    <Phone size={12} className="shrink-0 text-[var(--theme-text-secondary)]" />
                                                    <span>{sup.phone}</span>
                                                </div>
                                            )}
                                            {!sup.email && !sup.phone && (
                                                <span className="text-xs text-[var(--theme-text-secondary)] italic">No direct contact</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {canVerify && sup.createdBy !== viewerEmployeeId && sup.verificationStatus === 'pending' && (
                                            <button type="button" disabled={verifyingId === sup.id}
                                                onClick={e => { e.stopPropagation(); void handleVerify(sup); }}
                                                className="mr-2 h-8 px-3.5 rounded-full text-xs font-semibold border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">
                                                {verifyingId === sup.id ? 'Verifying…' : 'Verify'}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleCatalogClick(e, sup)}
                                            className="h-8 px-3.5 rounded-full text-xs font-semibold bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-border)]/50 border border-[var(--theme-border)] active:scale-[0.98] transition-all inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                                        >
                                            <Package size={13} strokeWidth={1.5} /> Catalog
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-[var(--theme-border)]">
                    {filteredSuppliers.map((sup) => {
                        const Icon = getSupplierIcon(sup.type);
                        return (
                            <div
                                key={sup.id}
                                onClick={() => handleSupplierClick(sup)}
                                className="p-4 space-y-3.5 hover:bg-[var(--theme-bg-subtle)]/40 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] shrink-0">
                                            <Icon size={18} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">{sup.name}</h3>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">Terms: {sup.paymentTerms || 'Net 30'}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        sup.status === 'Active' && sup.verificationStatus === 'verified'
                                            ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                            : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                    }`}>
                                        {sup.verificationStatus === 'verified' ? sup.status : 'Pending verification'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-left bg-[var(--theme-bg-subtle)]/60 p-3 rounded-2xl border border-[var(--theme-border)]">
                                    <div>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Category</span>
                                        <p className="text-xs text-[var(--theme-text-primary)] font-semibold mt-0.5">{sup.category || 'General'}</p>
                                        <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium mt-0.5">{sup.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Rating</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Star size={11} className="text-[var(--theme-status-warning-text)] fill-amber-500" />
                                            <span className="text-xs text-[var(--theme-text-primary)] font-bold font-mono tabular-nums">{sup.rating ?? 'Unrated'}</span>
                                            {sup.rating != null && <span className="text-[10px] text-[var(--theme-text-secondary)]">/ 5.0</span>}
                                        </div>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] block mt-0.5">{sup.regionCode || 'Country shared'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex flex-col text-left">
                                        {sup.email && (
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] truncate max-w-[170px]">{sup.email}</span>
                                        )}
                                        {sup.phone && (
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{sup.phone}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleCatalogClick(e, sup)}
                                        className="h-8 px-3 rounded-full text-xs font-semibold bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] inline-flex items-center gap-1.5"
                                    >
                                        <Package size={12} strokeWidth={1.5} /> Catalog
                                    </button>
                                    {canVerify && sup.createdBy !== viewerEmployeeId && sup.verificationStatus === 'pending' && (
                                        <button type="button" disabled={verifyingId === sup.id}
                                            onClick={e => { e.stopPropagation(); void handleVerify(sup); }}
                                            className="h-8 px-3 rounded-full text-xs font-semibold border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">
                                            {verifyingId === sup.id ? 'Verifying…' : 'Verify'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredSuppliers.length === 0 && (
                    <div className="py-16 text-center text-[var(--theme-text-secondary)] flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                            <Search size={22} className="opacity-40 text-[var(--theme-text-secondary)]" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--theme-text-primary)]">No suppliers found</p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Try adjusting your search criteria or register a new supplier.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
                <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                    Showing <span className="text-[var(--theme-text-primary)] font-semibold font-mono tabular-nums">{filteredSuppliers.length}</span> of <span className="text-[var(--theme-text-primary)] font-semibold font-mono tabular-nums">{totalCount}</span> Partners
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="h-9 px-3.5 rounded-full text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                        <ChevronLeft size={14} /> Previous
                    </button>
                    <div className="flex items-center px-3.5 h-9 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono">
                        <span className="text-[var(--theme-text-secondary)] mr-1.5">Page</span>
                        <span className="font-bold text-[var(--theme-text-primary)] tabular-nums">{currentPage}</span>
                        <span className="text-[var(--theme-text-secondary)] mx-1.5">of</span>
                        <span className="font-bold text-[var(--theme-text-primary)] tabular-nums">{totalPages}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages || loading}
                        className="h-9 px-3.5 rounded-full text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AddSupplierModal
                isOpen={isAddSupplierOpen}
                onClose={() => setIsAddSupplierOpen(false)}
                onAdd={onAddSupplier}
            />

            <SupplierDetailsModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                supplier={selectedSupplier}
            />

            <ProductCatalogModal
                isOpen={isProductCatalogOpen}
                onClose={() => setIsProductCatalogOpen(false)}
                supplier={selectedSupplier}
                onAddToPO={(product) => {
                    setIsProductCatalogOpen(false);
                    onOpenCreatePO(product, selectedSupplier?.id);
                }}
            />
        </div>
    );
};
