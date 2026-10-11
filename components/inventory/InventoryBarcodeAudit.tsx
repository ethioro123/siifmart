import React, { useState, useMemo } from 'react';
import {
    Barcode, Search, Filter, ArrowUpDown, ChevronDown, X, User, Clock, ChevronRight, Trash2, MapPin, ZoomIn, ChevronLeft
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatting';
import { Site, Employee } from '../../types';
import { useData } from '../../contexts/DataContext';
import { isAdminSite } from '../../utils/countryAdmin';
import { BarcodeAuditDetailsModal } from './components/BarcodeAuditDetailsModal';
import { BarcodeImageLightbox } from './components/BarcodeImageLightbox';

const BARCODE_PER_PAGE = 15;

interface InventoryBarcodeAuditProps {
    barcodeApprovals: any[];
    sites: Site[];
    employees: Employee[];
    isReadOnly: boolean;
    user: any;
    handleDeleteAuditRecord: (record: any) => void;
}

export const InventoryBarcodeAudit: React.FC<InventoryBarcodeAuditProps> = ({
    barcodeApprovals = [],
    sites = [],
    employees = [],
    isReadOnly,
    user,
    handleDeleteAuditRecord
}) => {
    const { allProducts, activeSite } = useData();
    const isCountryAdmin = useMemo(() => isReadOnly || isAdminSite(activeSite), [isReadOnly, activeSite]);

    // --- LOCAL STATE ---
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [barcodeSiteFilter, setBarcodeSiteFilter] = useState('All');
    const [barcodeSort, setBarcodeSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [currentBarcodePage, setCurrentBarcodePage] = useState(1);

    // Modal States
    const [selectedAuditRecord, setSelectedAuditRecord] = useState<any>(null);
    const [isApprovalDetailsOpen, setIsApprovalDetailsOpen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

    // --- ACCURATE ATTRIBUTION HELPER ---
    const getEmployeeName = (record: any) => {
        if (!record) return 'Store Cashier';
        const userVal = record.user_name || record.userName || record.created_by || record.createdBy || record.recordedBy;
        if (!userVal) return user?.name || 'Store Cashier';

        if (typeof userVal === 'string' && !userVal.includes('-') && userVal.length > 2 && isNaN(Number(userVal))) {
            return userVal;
        }

        const emp = employees.find(e =>
            e.id === userVal ||
            e.email === userVal ||
            e.code === userVal ||
            (e.code && userVal && e.code.toLowerCase() === String(userVal).toLowerCase()) ||
            e.name?.toLowerCase() === String(userVal).toLowerCase()
        );
        if (emp?.name) return emp.name;
        return user?.name || 'Store Operator';
    };

    const getSiteName = (siteId?: string) => {
        if (!siteId) return null;
        const site = sites.find(s => s.id === siteId || s.code === siteId);
        return site?.name || siteId;
    };

    // --- REAL AUDIT RECORDS ONLY (SCOPED BY COUNTRY & SITE) ---
    const allMappings = useMemo(() => {
        const allowedSiteIds = new Set(sites.map(s => s.id));
        return (barcodeApprovals || [])
            .filter(b => {
                const bc = b.barcode || b.new_barcode || b.target_barcode;
                if (!bc || String(bc).trim().length === 0) return false;

                const siteId = b.site_id || b.siteId;
                // Zero Cross-Country Data Leakage: strictly match country-scoped sites
                if (siteId && allowedSiteIds.size > 0 && !allowedSiteIds.has(siteId)) {
                    return false;
                }

                // Strict Site Scoping: branch staff can only see their assigned site's records
                if (!isCountryAdmin && activeSite?.id && siteId && siteId !== activeSite.id) {
                    return false;
                }

                return true;
            })
            .map(b => {
                const bc = b.barcode || b.new_barcode || b.target_barcode;
                let product = b.product;
                if (!product) {
                    const matched = allProducts.find(p => p.id === (b.product_id || b.productId));
                    if (matched) {
                        product = {
                            id: matched.id,
                            name: matched.name,
                            sku: matched.sku,
                            category: matched.category,
                            image: matched.image
                        };
                    }
                }

                return {
                    ...b,
                    barcode: bc,
                    product: product || { name: 'Unknown Product', sku: 'N/A' },
                    image_url: b.image_url || b.imageUrl || product?.image
                };
            });
    }, [barcodeApprovals, allProducts]);

    // --- FILTERED DATA ---
    const filteredBarcodes = useMemo(() => {
        let result = allMappings.filter(b => b.status !== 'rejected');

        // Search
        if (barcodeSearch) {
            const lowSearch = barcodeSearch.toLowerCase();
            result = result.filter(b =>
                (b.barcode || '').toLowerCase().includes(lowSearch) ||
                (b.product?.name || '').toLowerCase().includes(lowSearch) ||
                (b.product?.sku || '').toLowerCase().includes(lowSearch)
            );
        }

        // Site Filter
        if (barcodeSiteFilter !== 'All') {
            result = result.filter(b => (b.site_id || b.siteId) === barcodeSiteFilter);
        }

        // Sort
        result.sort((a, b) => {
            let valA: any, valB: any;

            if (barcodeSort.key === 'date') {
                valA = new Date(a.created_at || a.createdAt || 0).getTime();
                valB = new Date(b.created_at || b.createdAt || 0).getTime();
            } else if (barcodeSort.key === 'product') {
                valA = (a.product?.name || '').toLowerCase();
                valB = (b.product?.name || '').toLowerCase();
            }

            if (valA < valB) return barcodeSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return barcodeSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allMappings, barcodeSearch, barcodeSiteFilter, barcodeSort]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredBarcodes.length / BARCODE_PER_PAGE));
    const paginatedBarcodes = filteredBarcodes.slice(
        (currentBarcodePage - 1) * BARCODE_PER_PAGE,
        currentBarcodePage * BARCODE_PER_PAGE
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                            <Barcode size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                Barcode Mapping Audit Log
                            </h3>
                            <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">
                                Verified packaging barcodes synchronized across POS registers & WMS scanners
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-[var(--theme-bg-hover)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        {filteredBarcodes.length} mappings
                    </span>
                </div>

                {/* Advanced Filters Bar */}
                <div className="p-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-hover)]/30 flex flex-col md:flex-row gap-2.5 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={15} />
                        <input
                            type="text"
                            placeholder="Search by product name, barcode, or SKU..."
                            value={barcodeSearch}
                            onChange={(e) => {
                                setBarcodeSearch(e.target.value);
                                setCurrentBarcodePage(1);
                            }}
                            className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl py-2 pl-10 pr-4 text-[13px] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/60 outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        {isReadOnly && (
                            <div className="relative group min-w-[160px]">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={13} />
                                <select
                                    aria-label="Filter by Location"
                                    value={barcodeSiteFilter}
                                    onChange={(e) => {
                                        setBarcodeSiteFilter(e.target.value);
                                        setCurrentBarcodePage(1);
                                    }}
                                    className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl py-2 pl-8 pr-8 text-[13px] font-medium text-[var(--theme-text-primary)] appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs transition-all"
                                >
                                    <option value="All">All Locations</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={13} />
                            </div>
                        )}

                        <div className="relative group min-w-[150px]">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={13} />
                            <select
                                aria-label="Sort Audit Log"
                                value={`${barcodeSort.key}-${barcodeSort.direction}`}
                                onChange={(e) => {
                                    const [key, direction] = e.target.value.split('-');
                                    setBarcodeSort({ key, direction: direction as 'asc' | 'desc' });
                                }}
                                className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl py-2 pl-8 pr-8 text-[13px] font-medium text-[var(--theme-text-primary)] appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs transition-all"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="product-asc">Product (A-Z)</option>
                                <option value="product-desc">Product (Z-A)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={13} />
                        </div>

                        {(barcodeSearch || barcodeSiteFilter !== 'All') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBarcodeSearch('');
                                    setBarcodeSiteFilter('All');
                                    setCurrentBarcodePage(1);
                                }}
                                className="h-10 px-3 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                                title="Clear all filters"
                            >
                                <X size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Barcode Mapping Items */}
                <div className="p-4 sm:p-5">
                    {filteredBarcodes.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3 mx-auto">
                                <Barcode size={22} className="opacity-40" />
                            </div>
                            <p className="font-semibold text-[13px] text-[var(--theme-text-primary)]">
                                {barcodeSearch || barcodeSiteFilter !== 'All' ? 'No mappings match your search' : 'No barcode mappings recorded yet'}
                            </p>
                            <p className="text-[12px] mt-0.5 text-[var(--theme-text-secondary)]">When cashiers scan packaging barcodes, verified audit records appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {paginatedBarcodes.map((approval) => {
                                const siteName = getSiteName(approval.site_id || approval.siteId);
                                const recorderName = getEmployeeName(approval);

                                return (
                                    <div
                                        key={approval.id}
                                        className="group bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-xl transition-all p-3.5 shadow-xs"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            {/* Product Info & Click-to-Zoom Thumbnail */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div 
                                                    onClick={(e) => {
                                                         if (approval.image_url) {
                                                            e.stopPropagation();
                                                            setFullscreenImage({
                                                                url: approval.image_url,
                                                                title: approval.product?.name || 'Product Packaging Evidence',
                                                                subtitle: `Mapped Barcode: ${approval.barcode} • SKU: ${approval.product?.sku || 'N/A'}`
                                                            });
                                                        }
                                                    }}
                                                    className={`w-11 h-11 rounded-lg bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden relative ${approval.image_url ? 'cursor-zoom-in group/img' : ''}`}
                                                    title={approval.image_url ? 'Click to view full photo' : 'No photo available'}
                                                >
                                                    {approval.image_url ? (
                                                        <>
                                                            <img src={approval.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <ZoomIn size={14} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Barcode size={18} className="text-[var(--theme-text-secondary)] opacity-40" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-[13px] font-medium text-[var(--theme-text-primary)] truncate">
                                                        {approval.product?.name || 'Unknown Product'}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                        <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-hover)] px-2 py-0.5 rounded border border-[var(--theme-border)]">
                                                            {approval.product?.sku || 'NO SKU'}
                                                        </span>
                                                        <span className="text-[11px] font-mono tabular-nums font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded border border-[#34C759]/20">
                                                            Mapped: {approval.barcode}
                                                        </span>
                                                        {siteName && (
                                                            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] flex items-center gap-1">
                                                                <MapPin size={11} /> {siteName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Attribution */}
                                            <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-[var(--theme-text-secondary)]">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] uppercase tracking-wider text-[var(--theme-text-secondary)] font-semibold">Recorded By</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <User size={12} className="text-[var(--theme-text-secondary)]" />
                                                        <span className="text-[var(--theme-text-primary)] font-medium text-[12px]">{recorderName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[11px] uppercase tracking-wider text-[var(--theme-text-secondary)] font-semibold">Timestamp</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Clock size={12} className="text-[var(--theme-text-secondary)]" />
                                                        <span className="font-mono tabular-nums text-[12px] text-[var(--theme-text-secondary)]">{formatDateTime(approval.created_at || approval.createdAt || '', { showTime: true })}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[11px] uppercase tracking-wider text-[var(--theme-text-secondary)] font-semibold">Status</span>
                                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 mt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                                                        <span className="font-semibold text-[11px]">Synced</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAuditRecord(approval);
                                                        setIsApprovalDetailsOpen(true);
                                                    }}
                                                    className="h-8 px-3 rounded-lg bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] active:scale-[0.98] transition-all flex items-center gap-1 text-[12px] font-semibold cursor-pointer shadow-xs"
                                                >
                                                    <span>Details</span>
                                                    <ChevronRight size={13} />
                                                </button>
                                                {['super_admin', 'admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(user?.role) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAuditRecord(approval)}
                                                        className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/15 transition-all flex items-center justify-center cursor-pointer active:scale-[0.98]"
                                                        title="Delete Mapping"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls after 15 items */}
                    {filteredBarcodes.length > 0 && (
                        <div className="flex flex-wrap justify-between items-center mt-5 pt-3.5 border-t border-[var(--theme-border)] gap-3">
                            <div className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                                Showing <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{(currentBarcodePage - 1) * BARCODE_PER_PAGE + 1} - {Math.min(currentBarcodePage * BARCODE_PER_PAGE, filteredBarcodes.length)}</span> of <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{filteredBarcodes.length}</span> Records
                            </div>
                            
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentBarcodePage(prev => Math.max(1, prev - 1))}
                                        disabled={currentBarcodePage === 1}
                                        className="h-8 px-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] rounded-lg text-[12px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                                    >
                                        <ChevronLeft size={13} className="inline mr-0.5" /> Prev
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentBarcodePage) <= 1)
                                        .map((p, idx, arr) => {
                                            const prevP = arr[idx - 1];
                                            const hasGap = prevP && p - prevP > 1;

                                            return (
                                                <React.Fragment key={p}>
                                                    {hasGap && <span className="px-1 text-[var(--theme-text-secondary)] text-[12px]">...</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentBarcodePage(p)}
                                                        className={`w-7 h-7 rounded-lg text-[12px] font-semibold font-mono tabular-nums transition-all cursor-pointer active:scale-[0.98] ${
                                                            currentBarcodePage === p
                                                                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}

                                    <button
                                        type="button"
                                        onClick={() => setCurrentBarcodePage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentBarcodePage >= totalPages}
                                        className="h-8 px-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] rounded-lg text-[12px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                                    >
                                        Next <ChevronRight size={13} className="inline ml-0.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            <BarcodeAuditDetailsModal
                isOpen={isApprovalDetailsOpen}
                onClose={() => {
                    setIsApprovalDetailsOpen(false);
                    setSelectedAuditRecord(null);
                }}
                record={selectedAuditRecord}
                employeeName={getEmployeeName(selectedAuditRecord)}
                userRole={user?.role}
                onDelete={handleDeleteAuditRecord}
                onOpenFullscreenImage={setFullscreenImage}
            />

            {/* Fullscreen Lightbox */}
            <BarcodeImageLightbox
                image={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />
        </div>
    );
};
export default InventoryBarcodeAudit;
