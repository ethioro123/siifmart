
import React, { useState, useMemo } from 'react';
import {
    Barcode, Search, Filter, ArrowUpDown, ChevronDown, X, User, Clock, ChevronRight, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatting';
import { Site, Employee } from '../../types';
import Modal from '../Modal'; // Assuming generic Modal exists

// Types for props
interface InventoryBarcodeAuditProps {
    barcodeApprovals: any[]; // Replace 'any' with specific type if available (BarcodeMapping?)
    sites: Site[];
    employees: Employee[];
    isReadOnly: boolean;
    user: any; // Current user for role check
    handleDeleteAuditRecord: (record: any) => void;
}

export const InventoryBarcodeAudit: React.FC<InventoryBarcodeAuditProps> = ({
    barcodeApprovals,
    sites,
    employees,
    isReadOnly,
    user,
    handleDeleteAuditRecord
}) => {
    // --- LOCAL STATE ---
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [barcodeSiteFilter, setBarcodeSiteFilter] = useState('All');
    const [barcodeSort, setBarcodeSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [currentBarcodePage, setCurrentBarcodePage] = useState(1);
    const BARCODE_PER_PAGE = 15;

    // Modal State
    const [selectedAuditRecord, setSelectedAuditRecord] = useState<any>(null);
    const [isApprovalDetailsOpen, setIsApprovalDetailsOpen] = useState(false);

    // --- HELPERS ---
    const getEmployeeName = (employeeId: string | undefined | null) => {
        if (!employeeId) return 'Unknown';
        const emp = employees.find(e => e.id === employeeId);
        return emp?.name || 'Unknown';
    };

    // --- FILTERED DATA ---
    const filteredBarcodes = useMemo(() => {
        let result = [...barcodeApprovals];

        // Search
        if (barcodeSearch) {
            const lowSearch = barcodeSearch.toLowerCase();
            result = result.filter(b =>
                b.barcode.toLowerCase().includes(lowSearch) ||
                (b.product?.name || '').toLowerCase().includes(lowSearch) ||
                (b.product?.sku || '').toLowerCase().includes(lowSearch)
            );
        }

        // Hide rejected? Inventory.tsx hid rejected: result = result.filter(b => b.status !== 'rejected');
        // Let's keep that logic.
        result = result.filter(b => b.status !== 'rejected');

        // Site Filter
        if (barcodeSiteFilter !== 'All') {
            result = result.filter(b => (b.site_id || b.siteId) === barcodeSiteFilter);
        }

        // Sort
        result.sort((a, b) => {
            let valA: any, valB: any;

            if (barcodeSort.key === 'date') {
                valA = new Date(a.created_at || 0).getTime();
                valB = new Date(b.created_at || 0).getTime();
            } else if (barcodeSort.key === 'product') {
                valA = (a.product?.name || '').toLowerCase();
                valB = (b.product?.name || '').toLowerCase();
            } else if (barcodeSort.key === 'duration') {
                valA = a.resolution_time || 0;
                valB = b.resolution_time || 0;
            }

            if (valA < valB) return barcodeSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return barcodeSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [barcodeApprovals, barcodeSearch, barcodeSiteFilter, barcodeSort]);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-blue-400 flex items-center gap-2">
                        <Barcode size={18} /> Barcode Mapping Audit Log
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{filteredBarcodes.length} barcode mappings matched</p>
                </div>

                {/* Advanced Filters */}
                <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by product, barcode, or SKU..."
                            value={barcodeSearch}
                            onChange={(e) => {
                                setBarcodeSearch(e.target.value);
                                setCurrentBarcodePage(1);
                            }}
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {isReadOnly && (
                            <div className="relative group min-w-[180px]">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <select
                                    aria-label="Filter by Location"
                                    value={barcodeSiteFilter}
                                    onChange={(e) => {
                                        setBarcodeSiteFilter(e.target.value);
                                        setCurrentBarcodePage(1);
                                    }}
                                    className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-10 text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 appearance-none focus:border-blue-500/50 transition-all cursor-pointer"
                                >
                                    <option value="All">All Locations</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        )}

                        <div className="relative group min-w-[180px]">
                            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <select
                                aria-label="Sort Audit Log"
                                value={`${barcodeSort.key}-${barcodeSort.direction}`}
                                onChange={(e) => {
                                    const [key, direction] = e.target.value.split('-');
                                    setBarcodeSort({ key, direction: direction as 'asc' | 'desc' });
                                }}
                                className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-10 text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 appearance-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="product-asc">Product (A-Z)</option>
                                <option value="product-desc">Product (Z-A)</option>
                                <option value="duration-desc">Longest Duration</option>
                                <option value="duration-asc">Fastest Duration</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>

                        {(barcodeSearch || barcodeSiteFilter !== 'All') && (
                            <button
                                onClick={() => {
                                    setBarcodeSearch('');
                                    setBarcodeSiteFilter('All');
                                    setCurrentBarcodePage(1);
                                }}
                                className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                title="Clear all filters"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {filteredBarcodes.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Barcode size={48} className="mx-auto opacity-30 mb-4" />
                            <p>{barcodeSearch || barcodeSiteFilter !== 'All' ? 'No mappings match your search.' : 'No barcode mappings recorded yet.'}</p>
                            <p className="text-xs mt-2">When cashiers map unknown barcodes to products, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBarcodes.slice((currentBarcodePage - 1) * BARCODE_PER_PAGE, currentBarcodePage * BARCODE_PER_PAGE).map((approval) => (
                                <div
                                    key={approval.id}
                                    className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] hover:border-blue-500/30 rounded-2xl transition-all duration-300 overflow-hidden"
                                >
                                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Left: Product Info & Thumb */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-blue-500/30 transition-colors">
                                                {approval.image_url ? (
                                                    <img src={approval.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black/20">
                                                        <Barcode size={24} className="opacity-20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[14px] font-black text-gray-900 dark:text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                                                    {approval.product?.name || 'Unknown Product'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black font-mono text-gray-500 bg-gray-100 dark:bg-black/40 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5 uppercase tracking-tighter">
                                                        {approval.product?.sku || 'NO SKU'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-md">
                                                        Mapped to {approval.barcode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Attribution */}
                                        <div className="flex flex-wrap items-center gap-8 text-[11px] font-medium text-gray-400">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Recorded By</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                        <User size={10} className="text-cyan-400" />
                                                    </div>
                                                    <span className="text-gray-300 font-bold">{getEmployeeName(approval.created_by)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Timestamp</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-gray-500" />
                                                    <span className="text-gray-300 font-mono tracking-tighter">{formatDateTime(approval.created_at || '', { showTime: true })}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Status</span>
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                                                    <span className="text-green-400 font-black text-[9px] uppercase tracking-wider">Synced</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                onClick={() => {
                                                    setSelectedAuditRecord(approval);
                                                    setIsApprovalDetailsOpen(true);
                                                }}
                                                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest group/btn"
                                            >
                                                Details
                                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                            {user?.role === 'super_admin' && (
                                                <button
                                                    onClick={() => handleDeleteAuditRecord(approval)}
                                                    className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center group/del"
                                                    title="Delete Mapping"
                                                >
                                                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {filteredBarcodes.length > 0 && (
                        <div className="flex justify-between items-center mt-8 p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 rounded-b-2xl">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Showing {(currentBarcodePage - 1) * BARCODE_PER_PAGE + 1} - {Math.min(currentBarcodePage * BARCODE_PER_PAGE, filteredBarcodes.length)} of {filteredBarcodes.length} Records
                            </div>
                            {filteredBarcodes.length > BARCODE_PER_PAGE && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentBarcodePage(prev => Math.max(1, prev - 1))}
                                        disabled={currentBarcodePage === 1}
                                        className="px-6 py-2.5 bg-white hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white transition-all border border-gray-200 dark:border-white/10"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentBarcodePage(prev => (currentBarcodePage * BARCODE_PER_PAGE < filteredBarcodes.length ? prev + 1 : prev))}
                                        disabled={currentBarcodePage * BARCODE_PER_PAGE >= filteredBarcodes.length}
                                        className="px-6 py-2.5 bg-white hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-white transition-all border border-gray-200 dark:border-white/10"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Barcode Details Modal */}
            <Modal
                isOpen={isApprovalDetailsOpen}
                onClose={() => { setIsApprovalDetailsOpen(false); setSelectedAuditRecord(null); }}
                title="Barcode Mapping Details"
            >
                {selectedAuditRecord && (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                                {selectedAuditRecord.image_url ? (
                                    <img src={selectedAuditRecord.image_url} alt="Evidence" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Barcode className="opacity-20" size={32} /></div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedAuditRecord.product?.name}</h3>
                                <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-1 rounded bg-white/10 text-xs font-mono">{selectedAuditRecord.product?.sku}</span>
                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono font-bold flex items-center gap-1">
                                        <Barcode size={12} /> {selectedAuditRecord.barcode}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                                    <div className="flex items-center gap-1"><User size={12} /> {getEmployeeName(selectedAuditRecord.created_by)}</div>
                                    <div className="flex items-center gap-1"><Clock size={12} /> {formatDateTime(selectedAuditRecord.created_at || '')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm space-y-2">
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest mb-2">Audit Trail</h4>
                            <p className="text-gray-600 dark:text-gray-300">
                                This barcode was automatically mapped by the cashier <b>{getEmployeeName(selectedAuditRecord.created_by)}</b> when searching for <b>"{selectedAuditRecord.product?.name}"</b>.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                                Mapping created via Point of Sale (POS) - Unknown Barcode Flow.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setIsApprovalDetailsOpen(false)}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold"
                            >
                                Close
                            </button>
                            {user?.role === 'super_admin' && (
                                <button
                                    onClick={() => {
                                        handleDeleteAuditRecord(selectedAuditRecord);
                                        setIsApprovalDetailsOpen(false);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Remove Mapping
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
