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
import { logger } from '../../utils/logger';

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
    const isCEO = user?.role === 'super_admin';
    const isProcurementManager = user?.role === 'procurement_manager';
    const canApprove = isProcurementManager || user?.role === 'finance_manager' || user?.role === 'admin' || isCEO;
    const canFullDelete = isCEO; // Only Super Admin can delete anything non-received

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
            logger.error('PurchaseOrdersList', "Bulk approve failed", e);
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
            logger.error('PurchaseOrdersList', "Approve failed", e);
            showToast("Approve failed", 'error');
        }
    };

    return (
        <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in">
            {/* Modern Filter Toolbar */}
            <div className="p-4 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20 space-y-4">
                {/* Row 1: Search & Dropdowns */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex items-center glass-panel-pushed rounded-xl px-4 py-2.5 flex-1 focus-within:border-[#2C5E3B]/50 dark:focus-within:border-[#A9CBA2]/50 transition-colors">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search PO # or Supplier..."
                            className="bg-transparent border-none ml-3 flex-1 text-gray-900 dark:text-white text-sm outline-none placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Supplier Filter */}
                    <select
                        aria-label="Filter by Supplier"
                        value={supplierFilter}
                        onChange={(e) => onSupplierFilterChange(e.target.value)}
                        className="glass-panel-pushed rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]/50 dark:focus:border-[#A9CBA2]/50 min-w-[150px] transition-colors"
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
                        className="glass-panel-pushed rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]/50 dark:focus:border-[#A9CBA2]/50 min-w-[150px] transition-colors"
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
                                ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-[#224429] dark:border-[#EAE5D9]'
                                : 'glass-panel-pushed text-gray-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions Bar (CEO Only) */}
            {user?.role === 'super_admin' && selectedPOIds.length > 0 && (
                <div className="mx-4 mb-4 bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 dark:bg-[#A9CBA2]/10 dark:border-[#A9CBA2]/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
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
                        className="px-4 py-2 bg-[#2C5E3B] hover:bg-[#224429] dark:bg-[#A9CBA2] dark:hover:bg-[#8dae86] text-[#FAF8F5] dark:text-[#1E3B24] disabled:bg-gray-600 disabled:cursor-not-allowed font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-md"
                    >
                        <CheckCircle size={16} /> Approve Selected
                    </button>
                </div>
            )}

            <div className="overflow-x-auto p-4">
                <table className="w-full text-left hidden md:table">
                    <thead>
                        <tr className="glass-panel-pushed border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                            {/* Bulk Selection Checkbox (CEO Only) */}
                            {user?.role === 'super_admin' && (
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all drafts"
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-black/50"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedPOIds(orders.filter(o => o.status === 'Draft').map(o => o.id));
                                            else setSelectedPOIds([]);
                                        }}
                                        checked={selectedPOIds.length > 0 && selectedPOIds.length === orders.filter(o => o.status === 'Draft').length}
                                    />
                                </th>
                            )}
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">PO Number</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold text-center whitespace-nowrap">Priority</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">Supplier</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">Destination</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">Date</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">Expected</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold text-right whitespace-nowrap">Items</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold text-right whitespace-nowrap">Amount</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase text-center font-bold whitespace-nowrap">Status</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">Requested By</th>
                            <th className="p-4 text-xs text-gray-500 dark:text-gray-400 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/30 dark:divide-emerald-950/10">
                        {orders.map((po) => {
                            const isDraft = po.status === 'Draft';
                            const isSelected = selectedPOIds.includes(po.id);
                            return (
                                <tr key={po.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 group transition-colors ${isSelected ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-l-2 border-[#2C5E3B] dark:border-[#A9CBA2]' : ''}`}>
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
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-black/50"
                                                />
                                            ) : <span className="w-4 h-4 block"></span>}
                                        </td>
                                    )}
                                    <td className="p-4 text-sm font-mono text-gray-900 dark:text-white font-bold">{formatPONumber(po)}</td>
                                    <td className="p-4">
                                        <div className={`mx-auto px-2 py-0.5 rounded text-[9px] font-bold border uppercase text-center w-fit ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                            po.priority === 'Low' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/5' :
                                                'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                            }`}>
                                            {po.priority || 'Normal'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{po.supplierName}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1.5 max-w-[180px]">
                                            <MapPin size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                            <span className="truncate">{po.destination || sites.find(s => s.id === po.siteId)?.name || 'Central Operations'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{po.date}</td>
                                    <td className="p-4 text-xs text-[#8C6239] dark:text-[#E2C899] whitespace-nowrap">{po.expectedDelivery || 'N/A'}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono text-right">{po.itemsCount}</td>
                                    <td className="p-4 text-sm text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-right font-bold">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${po.status === 'Received' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                            po.status === 'Partially Received' ? 'text-amber-500 dark:text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                                po.status === 'Approved' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' :
                                                    po.status === 'Ordered' ? 'text-amber-600 dark:text-[#E2C899] border-amber-500/20 dark:border-[#E2C899]/20 bg-amber-500/10 dark:bg-amber-500/5' :
                                                        po.status === 'Draft' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                                            po.status === 'Pending' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/10' :
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
                                            {/* Edit Logic:
                                                1. CEO/Super Admin can edit anything NOT received.
                                                2. Other staff can ONLY edit their own Draft POs.
                                            */}
                                            {((isCEO && po.status !== 'Received') || 
                                              (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(po); }}
                                                    className="p-1 text-[#2C5E3B] dark:text-[#A9CBA2] hover:opacity-80"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}

                                            {/* Deletion Logic:
                                                1. Super Admin can delete anything NOT received.
                                                2. Other staff can ONLY delete their own Draft POs.
                                            */}
                                            {((isCEO && po.status !== 'Received') || 
                                              (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
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

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-[#E2DCCE]/30 dark:divide-emerald-950/10">
                    {orders.map((po) => {
                        const isDraft = po.status === 'Draft';
                        const isSelected = selectedPOIds.includes(po.id);
                        return (
                            <div
                                key={po.id}
                                onClick={() => setSelectedPO(po)}
                                className={`p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group ${isSelected ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-l-2 border-[#2C5E3B] dark:border-[#A9CBA2]' : ''}`}
                            >
                                {/* Top row: Selection checkbox (if draft & CEO), PO Number, Priority, Status */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {user?.role === 'super_admin' && isDraft && (
                                            <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select PO ${po.id}`}
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedPOIds(prev => [...prev, po.id]);
                                                        else setSelectedPOIds(prev => prev.filter(id => id !== po.id));
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-black/50"
                                                />
                                            </div>
                                        )}
                                        <div className="text-left">
                                            <span className="text-sm font-mono text-gray-900 dark:text-white font-bold">{formatPONumber(po)}</span>
                                            <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase text-center ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                                po.priority === 'Low' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/5' :
                                                    'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                                }`}>
                                                {po.priority || 'Normal'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${po.status === 'Received' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                        po.status === 'Partially Received' ? 'text-amber-500 dark:text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                            po.status === 'Approved' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' :
                                                po.status === 'Ordered' ? 'text-amber-600 dark:text-[#E2C899] border-amber-500/20 dark:border-[#E2C899]/20 bg-amber-500/10 dark:bg-amber-500/5' :
                                                    po.status === 'Draft' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                                        po.status === 'Pending' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/10' :
                                                            'text-red-400 border-red-500/20 bg-red-500/10'
                                        }`}>
                                        {po.status}
                                    </span>
                                </div>

                                {/* Middle detail: Supplier & Destination */}
                                <div className="grid grid-cols-2 gap-2 text-left bg-gray-50/50 dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div>
                                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Supplier</span>
                                        <p className="text-xs text-gray-900 dark:text-white font-medium mt-0.5 truncate">{po.supplierName}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Destination</span>
                                        <p className="text-xs text-gray-900 dark:text-white font-medium mt-0.5 truncate">
                                            {po.destination || sites.find(s => s.id === po.siteId)?.name || 'Central Operations'}
                                        </p>
                                    </div>
                                </div>

                                {/* Expected and items/amount */}
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Expected Delivery</span>
                                        <span className="text-[10px] text-[#8C6239] dark:text-[#E2C899] font-bold mt-0.5">{po.expectedDelivery || 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Items</span>
                                            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold mt-0.5">{po.itemsCount}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Amount</span>
                                            <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold mt-0.5">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & request info */}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[9px] text-gray-500 italic">By: {po.requestedBy || po.createdBy || 'Unknown'}</span>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setSelectedPO(po)}
                                            className="px-2.5 py-1 text-[10px] font-bold bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors"
                                        >
                                            Details
                                        </button>
                                        {isDraft && canApprove && (
                                            <button
                                                onClick={(e) => handleSingleApprove(e, po)}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {((isCEO && po.status !== 'Received') || 
                                          (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                            <button
                                                onClick={() => onEdit(po)}
                                                className="p-1 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-lg"
                                                title="Edit PO"
                                                aria-label="Edit Purchase Order"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                        )}
                                        {((isCEO && po.status !== 'Received') || 
                                          (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                            <button
                                                onClick={(e) => handleDeletePO(e, po)}
                                                className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg"
                                                title="Delete PO"
                                                aria-label="Delete Purchase Order"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic">No active purchase orders found.</div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 glass-panel-pushed rounded-b-2xl">
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                    Showing <span className="text-gray-900 dark:text-gray-300">{orders.length}</span> of <span className="text-gray-900 dark:text-gray-300">{totalCount}</span> Results
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 transition-colors shadow-sm dark:shadow-none"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 glass-panel-pushed rounded-lg">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mr-2">Page</span>
                        <span className="text-sm font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{currentPage}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mx-2">of</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{Math.ceil(totalCount / ITEMS_PER_PAGE)}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                        className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 transition-colors shadow-sm dark:shadow-none"
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
