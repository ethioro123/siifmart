import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Clock, User as UserIcon } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { PurchaseOrder } from '../../../types';

interface DocksHistoryProps {
    orders: PurchaseOrder[];
    t: (key: string) => string;
}

const DOCK_HISTORY_PER_PAGE = 12;

export const DocksHistory: React.FC<DocksHistoryProps> = ({ orders, t }) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // DOCK HISTORY Logic (Unloaded POs)
    const filteredHistory = useMemo(() => {
        return orders.filter((po: any) => {
            // Keep POs that have been approved (unloaded)
            const isUnloaded = (po.status === 'Approved' || po.status === 'Partially Received' || po.status === 'Received') && po.approvedAt;
            if (!isUnloaded) return false;

            const matchesSearch = !search ||
                po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
                po.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
                (po.approvedBy && po.approvedBy.toLowerCase().includes(search.toLowerCase()));

            return matchesSearch;
        }).sort((a: any, b: any) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
    }, [orders, search]);

    const totalPages = Math.ceil(filteredHistory.length / DOCK_HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * DOCK_HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + DOCK_HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 mt-6 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-xl">
                        <HistoryIcon className="text-blue-400" size={20} />
                    </div>
                    {t('warehouse.docks.history') || 'Dock History'}
                </h3>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search PO, Supplier..."
                            className="w-64 bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Unloaded At</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">PO Number</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Supplier</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Approved By</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Items</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold">
                                    No unloaded POs found.
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((po: any) => (
                                <tr key={po.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-gray-600" />
                                            <span className="text-xs font-mono font-bold text-gray-400">
                                                {po.approvedAt ? new Date(po.approvedAt).toLocaleString() : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-white">{po.poNumber || po.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-400">{po.supplierName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <UserIcon size={10} className="text-blue-400" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{po.approvedBy || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold text-gray-400">{po.lineItems?.length || 0} items</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${po.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            po.status === 'Received' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}>
                                            {po.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={DOCK_HISTORY_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </div>
            )}
        </div>
    );
};
