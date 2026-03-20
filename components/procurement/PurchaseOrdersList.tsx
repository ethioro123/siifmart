import React, { useState } from 'react';
import { PurchaseOrder, Supplier } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { Search, MapPin, CheckCircle, Clock, Truck, XCircle, Printer, Edit3, Trash2 } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { ViewPOModal } from './ViewPOModal';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { purchaseOrdersService } from '../../services/supabase.service';

interface PurchaseOrdersListProps {
    orders: PurchaseOrder[];
    loading: boolean;
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    // Filters
    searchTerm: string;
    onSearchChange: (term: string) => void;
    supplierFilter: string;
    onSupplierFilterChange: (id: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: any) => void;
    sort: string;
    onSortChange: (sort: any) => void;

    suppliers: Supplier[];
    sites: any[];

    // Actions
    onEdit: (po: PurchaseOrder) => void;
    onRefresh: () => void;
}

export const PurchaseOrdersList: React.FC<PurchaseOrdersListProps> = ({
    orders, loading, totalCount, currentPage, onPageChange,
    searchTerm, onSearchChange, supplierFilter, onSupplierFilterChange,
    statusFilter, onStatusFilterChange, sort, onSortChange,
    suppliers, sites, onEdit, onRefresh
}) => {
    const { user, showToast } = useStore();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    const ITEMS_PER_PAGE = 20;
    const canApprove = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin';

    const handleBulkApprove = async () => {
        if (!confirm(`Approve ${selectedPOIds.length} selected POs?`)) return;
        setIsBulkApproving(true);
        try {
            const promises = selectedPOIds.map(id => {
                const po = orders.find(p => p.id === id);
                if (!po) return Promise.resolve();
                return purchaseOrdersService.update(id, {
                    ...po,
                    status: 'Ordered',
                    approvedBy: user?.name || 'Bulk Action',
                    approvedAt: new Date().toISOString()
                });
            });
            await Promise.all(promises);
            showToast(`Approved ${selectedPOIds.length} POs`, 'success');
            setSelectedPOIds([]);
            onRefresh();
        } catch (e) {
            console.error("Bulk approve failed", e);
            showToast("Bulk approve failed", 'error');
        } finally {
            setIsBulkApproving(false);
        }
    };

    const handleDeletePO = async (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        if (!confirm(`Delete PO ${formatPONumber(po)}?`)) return;
        try {
            await purchaseOrdersService.delete(po.id);
            showToast("PO Deleted", 'success');
            onRefresh();
        } catch (e) {
            showToast("Failed to delete PO", 'error');
        }
    };

    const handleSingleApprove = async (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        if (!confirm(`Approve PO ${formatPONumber(po)}?`)) return;
        try {
            await purchaseOrdersService.update(po.id, {
                ...po,
                status: 'Ordered',
                approvedBy: user?.name || 'Unknown',
                approvedAt: new Date().toISOString()
            });
            showToast(`PO ${formatPONumber(po)} Approved`, 'success');
            onRefresh();
        } catch (e) {
            console.error("Approve failed", e);
            showToast("Approve failed", 'error');
        }
    };

    return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden animate-in fade-in">
            {/* Modern Filter Toolbar */}
            <div className="p-4 border-b border-white/5 space-y-4">
                {/* Row 1: Search & Dropdowns */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 flex-1 focus-within:border-cyber-primary/50 transition-colors">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search PO # or Supplier..."
                            className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Supplier Filter */}
                    <select
                        aria-label="Filter by Supplier"
                        value={supplierFilter}
                        onChange={(e) => onSupplierFilterChange(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-primary/50 min-w-[150px]"
                    >
                        <option value="All">All Suppliers</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        aria-label="Sort POs"
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as any)}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-primary/50 min-w-[150px]"
                    >
                        <option value="dateDesc">Date: Newest</option>
                        <option value="dateAsc">Date: Oldest</option>
                        <option value="amountDesc">Amount: High-Low</option>
                        <option value="amountAsc">Amount: Low-High</option>
                        <option value="priority">Priority</option>
                    </select>
                </div>

                {/* Row 2: Status Chips */}
                <div className="flex flex-wrap gap-2">
                    {['All', 'Draft', 'Pending', 'Approved', 'Partially Received', 'Received', 'Cancelled', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => onStatusFilterChange(status as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${statusFilter === status
                                ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.2)]'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions Bar (CEO Only) */}
            {user?.role === 'super_admin' && selectedPOIds.length > 0 && (
                <div className="mx-4 mb-4 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-cyber-primary">
                            {selectedPOIds.length} PO{selectedPOIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={() => setSelectedPOIds([])}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Clear Selection
                        </button>
                    </div>
                    <button
                        onClick={handleBulkApprove}
                        disabled={isBulkApproving}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                        <CheckCircle size={16} /> Approve Selected
                    </button>
                </div>
            )}

            <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            {/* Bulk Selection Checkbox (CEO Only) */}
                            {user?.role === 'super_admin' && (
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all drafts"
                                        className="w-4 h-4 rounded border-gray-600 text-cyber-primary bg-black/50"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedPOIds(orders.filter(o => o.status === 'Draft').map(o => o.id));
                                            else setSelectedPOIds([]);
                                        }}
                                        checked={selectedPOIds.length > 0 && selectedPOIds.length === orders.filter(o => o.status === 'Draft').length}
                                    />
                                </th>
                            )}
                            <th className="p-4 text-xs text-gray-400 uppercase whitespace-nowrap">PO Number</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold text-center whitespace-nowrap">Priority</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Supplier</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Destination</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Date</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Expected</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold text-right whitespace-nowrap">Items</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold text-right whitespace-nowrap">Amount</th>
                            <th className="p-4 text-xs text-gray-400 uppercase text-center font-bold whitespace-nowrap">Status</th>
                            <th className="p-4 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Requested By</th>
                            <th className="p-4 text-xs text-gray-400 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.map((po) => {
                            const isDraft = po.status === 'Draft';
                            const isSelected = selectedPOIds.includes(po.id);
                            return (
                                <tr key={po.id} className={`hover:bg-white/5 group transition-colors ${isSelected ? 'bg-cyber-primary/5 border-l-2 border-cyber-primary' : ''}`}>
                                    {user?.role === 'super_admin' && (
                                        <td className="p-4">
                                            {isDraft ? (
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select PO ${po.id}`}
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedPOIds(prev => [...prev, po.id]);
                                                        else setSelectedPOIds(prev => prev.filter(id => id !== po.id));
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-600 text-cyber-primary bg-black/50"
                                                />
                                            ) : <span className="w-4 h-4 block"></span>}
                                        </td>
                                    )}
                                    <td className="p-4 text-sm font-mono text-white font-bold">{formatPONumber(po)}</td>
                                    <td className="p-4">
                                        <div className={`mx-auto px-2 py-0.5 rounded text-[9px] font-bold border uppercase text-center w-fit ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                            po.priority === 'Low' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                                'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                            }`}>
                                            {po.priority || 'Normal'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">{po.supplierName}</td>
                                    <td className="p-4 text-sm text-gray-300">
                                        <div className="flex items-center gap-1.5 max-w-[180px]">
                                            <MapPin size={12} className="text-gray-500 flex-shrink-0" />
                                            <span className="truncate">{po.destination || sites.find(s => s.id === po.siteId)?.name || 'Central Operations'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{po.date}</td>
                                    <td className="p-4 text-xs text-blue-400 whitespace-nowrap">{po.expectedDelivery || 'N/A'}</td>
                                    <td className="p-4 text-sm text-gray-300 font-mono text-right">{po.itemsCount}</td>
                                    <td className="p-4 text-sm text-cyber-primary font-mono text-right font-bold">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${po.status === 'Received' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                            po.status === 'Partially Received' ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' :
                                                po.status === 'Approved' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' :
                                                    po.status === 'Ordered' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                                        po.status === 'Draft' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                                            po.status === 'Pending' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                                                'text-red-400 border-red-500/20 bg-red-500/10'
                                            }`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 italic max-w-[100px] truncate">{po.requestedBy || po.createdBy || 'Unknown'}</td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedPO(po); }}
                                                className="p-1 px-2 hover:bg-white/10 rounded border border-white/10 text-gray-300 text-[10px] font-bold transition-colors"
                                            >
                                                Details
                                            </button>
                                            {isDraft && canApprove && (
                                                <button
                                                    onClick={(e) => handleSingleApprove(e, po)}
                                                    className="p-1 px-2 hover:bg-green-500/20 rounded border border-green-500/30 text-green-400 text-[10px] font-bold transition-colors flex items-center gap-1"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={12} /> Approve
                                                </button>
                                            )}
                                            {(po.status === 'Draft' || po.status === 'Approved') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(po); }}
                                                    className="p-1 text-blue-400 hover:text-blue-300"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                            {(po.status === 'Draft' || po.status === 'Rejected' || po.status === 'Cancelled') && (
                                                <button
                                                    onClick={(e) => handleDeletePO(e, po)}
                                                    className="p-1 text-red-400 hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={12} className="p-8 text-center text-gray-500 italic">No active purchase orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-black/20 rounded-b-2xl">
                <p className="text-xs text-gray-500 font-mono">
                    Showing <span className="text-gray-300">{orders.length}</span> of <span className="text-gray-300">{totalCount}</span> Results
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mr-2">Page</span>
                        <span className="text-sm font-mono font-bold text-cyber-primary">{currentPage}</span>
                        <span className="text-[10px] text-gray-500 mx-2">of</span>
                        <span className="text-sm font-mono text-white">{Math.ceil(totalCount / ITEMS_PER_PAGE)}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                        className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* View Modal */}
            <ViewPOModal
                isOpen={!!selectedPO}
                onClose={() => setSelectedPO(null)}
                po={selectedPO}
                onEdit={(po) => {
                    setSelectedPO(null);
                    onEdit(po);
                }}
                onSuccess={onRefresh}
            />
        </div>
    );

};
