import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { Product, StockMovement } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

interface WasteHistoryProps {
    movements: StockMovement[];
    products: Product[];
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
}

const WASTE_HISTORY_PER_PAGE = 12;

export const WasteHistory: React.FC<WasteHistoryProps> = ({
    movements,
    products,
    setSelectedJob,
    setIsDetailsOpen
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredHistory = useMemo(() => {
        const wasteMoves = movements.filter(m => m.reason.toLowerCase().includes('waste') || m.reason.toLowerCase().includes('spoilage'));
        return wasteMoves.filter(m => {
            return !search ||
                (m.productName || '').toLowerCase().includes(search.toLowerCase()) ||
                m.id.toLowerCase().includes(search.toLowerCase()) ||
                (m.reason || '').toLowerCase().includes(search.toLowerCase());
        });
    }, [movements, search]);

    const totalPages = Math.ceil(filteredHistory.length / WASTE_HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * WASTE_HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + WASTE_HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-white/10 mt-6 pt-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-gray-400" />
                        Waste Logs
                    </h4>
                    <p className="text-gray-500 text-[10px]">Recent spoilage and damage records</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {paginatedHistory.map((m: any) => {
                            const product = products.find(p => p.id === m.productId);
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedJob(m);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono text-cyber-primary font-bold">{m.id.slice(0, 8)}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-red-500/10 text-red-400">
                                            {m.reason.replace('Waste: ', '')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{product?.name || 'Unknown Item'}</p>
                                            <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(m.date)}</p>
                                        </div>
                                        <div className="text-right text-white font-bold text-xs">
                                            {m.quantity} <span className="text-[9px] text-gray-500 font-normal">units</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={WASTE_HISTORY_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </>
            ) : (
                <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    <p className="text-gray-500 text-xs">No matching history found</p>
                </div>
            )}
        </div>
    );
};
