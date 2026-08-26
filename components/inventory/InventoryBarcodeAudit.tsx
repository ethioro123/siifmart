import React, { useState, useMemo } from 'react';
import {
    Barcode, Search, Filter, ArrowUpDown, ChevronDown, X, User, Clock, ChevronRight, Trash2, MapPin, ZoomIn, ChevronLeft
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatting';
import { Site, Employee } from '../../types';
import { useData } from '../../contexts/DataContext';
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
    const { allProducts } = useData();

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

    // --- REAL AUDIT RECORDS ONLY (ENRICHED WITH CATALOG PRODUCT METADATA) ---
    const allMappings = useMemo(() => {
        return (barcodeApprovals || [])
            .filter(b => {
                const bc = b.barcode || b.new_barcode || b.target_barcode;
                return bc && String(bc).trim().length > 0;
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
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 sm:p-6 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider flex items-center gap-2 text-base">
                            <Barcode size={20} /> Barcode Mapping Audit Log
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                            {filteredBarcodes.length} verified packaging barcodes synchronized across registers & scanners
                        </p>
                    </div>
                </div>

                {/* Advanced Filters Bar */}
                <div className="p-4 sm:p-5 border-b border-[#E2DCCE]/60 dark:border-white/5 bg-[#FAF8F5] dark:bg-black/20 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by product name, barcode, or SKU..."
                            value={barcodeSearch}
                            onChange={(e) => {
                                setBarcodeSearch(e.target.value);
                                setCurrentBarcodePage(1);
                            }}
                            className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B]"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        {isReadOnly && (
                            <div className="relative group min-w-[160px]">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
                                <select
                                    aria-label="Filter by Location"
                                    value={barcodeSiteFilter}
                                    onChange={(e) => {
                                        setBarcodeSiteFilter(e.target.value);
                                        setCurrentBarcodePage(1);
                                    }}
                                    className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl py-2.5 pl-8 pr-8 text-xs font-bold text-[#1E3F27] dark:text-white appearance-none cursor-pointer outline-none"
                                >
                                    <option value="All">All Locations</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={13} />
                            </div>
                        )}

                        <div className="relative group min-w-[150px]">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
                            <select
                                aria-label="Sort Audit Log"
                                value={`${barcodeSort.key}-${barcodeSort.direction}`}
                                onChange={(e) => {
                                    const [key, direction] = e.target.value.split('-');
                                    setBarcodeSort({ key, direction: direction as 'asc' | 'desc' });
                                }}
                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl py-2.5 pl-8 pr-8 text-xs font-bold text-[#1E3F27] dark:text-white appearance-none cursor-pointer outline-none"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="product-asc">Product (A-Z)</option>
                                <option value="product-desc">Product (Z-A)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={13} />
                        </div>

                        {(barcodeSearch || barcodeSiteFilter !== 'All') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBarcodeSearch('');
                                    setBarcodeSiteFilter('All');
                                    setCurrentBarcodePage(1);
                                }}
                                className="p-2.5 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100 transition-all cursor-pointer"
                                title="Clear all filters"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Barcode Mapping Items */}
                <div className="p-5 sm:p-6">
                    {filteredBarcodes.length === 0 ? (
                        <div className="p-12 text-center text-stone-400">
                            <Barcode size={40} className="mx-auto opacity-30 mb-3" />
                            <p className="font-bold text-sm text-[#1E3F27] dark:text-white">
                                {barcodeSearch || barcodeSiteFilter !== 'All' ? 'No mappings match your search.' : 'No barcode mappings recorded yet.'}
                            </p>
                            <p className="text-xs mt-1 text-stone-400">When cashiers scan unknown packaging barcodes, verified audit records appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginatedBarcodes.map((approval) => {
                                const siteName = getSiteName(approval.site_id || approval.siteId);
                                const recorderName = getEmployeeName(approval);

                                return (
                                    <div
                                        key={approval.id}
                                        className="group bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE]/80 dark:border-emerald-950/20 hover:border-[#2C5E3B]/40 rounded-2xl transition-all p-4 shadow-xs"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Product Info & Click-to-Zoom Thumbnail */}
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
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
                                                    className={`w-12 h-12 rounded-xl bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative ${approval.image_url ? 'cursor-zoom-in group/img' : ''}`}
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
                                                        <Barcode size={20} className="text-stone-300 dark:text-stone-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs sm:text-sm font-black text-[#1E3F27] dark:text-white truncate">
                                                        {approval.product?.name || 'Unknown Product'}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] font-mono font-bold text-stone-500 bg-white dark:bg-black/40 px-1.5 py-0.5 rounded border border-[#E2DCCE] dark:border-white/5">
                                                            {approval.product?.sku || 'NO SKU'}
                                                        </span>
                                                        <span className="text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-950/30">
                                                            Mapped to: {approval.barcode}
                                                        </span>
                                                        {siteName && (
                                                            <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                                                                <MapPin size={11} /> {siteName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Attribution */}
                                            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-stone-500">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Recorded By</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <User size={11} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                        <span className="text-stone-800 dark:text-stone-200 font-bold">{recorderName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Timestamp</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Clock size={11} className="text-stone-400" />
                                                        <span className="font-mono text-[11px]">{formatDateTime(approval.created_at || approval.createdAt || '', { showTime: true })}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Status</span>
                                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 mt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />
                                                        <span className="font-black text-[9px] uppercase">Synced</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAuditRecord(approval);
                                                        setIsApprovalDetailsOpen(true);
                                                    }}
                                                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-black/30 hover:bg-[#2C5E3B] hover:text-white dark:hover:bg-[#A9CBA2] dark:hover:text-[#18201B] text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-white/10 transition-all flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer shadow-2xs"
                                                >
                                                    <span>Details</span>
                                                    <ChevronRight size={13} />
                                                </button>
                                                {['super_admin', 'admin', 'warehouse_manager'].includes(user?.role) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAuditRecord(approval)}
                                                        className="w-8 h-8 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
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
                        <div className="flex flex-wrap justify-between items-center mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5 gap-3">
                            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                                Showing {(currentBarcodePage - 1) * BARCODE_PER_PAGE + 1} - {Math.min(currentBarcodePage * BARCODE_PER_PAGE, filteredBarcodes.length)} of {filteredBarcodes.length} Records
                            </div>
                            
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentBarcodePage(prev => Math.max(1, prev - 1))}
                                        disabled={currentBarcodePage === 1}
                                        className="px-3 py-1.5 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                                                    {hasGap && <span className="px-1 text-stone-400">...</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentBarcodePage(p)}
                                                        className={`w-7 h-7 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                            currentBarcodePage === p
                                                                ? 'bg-[#2C5E3B] text-white shadow-xs'
                                                                : 'bg-[#FAF8F5] dark:bg-black/30 text-stone-600 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10'
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
                                        className="px-3 py-1.5 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
