import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, UserCheck } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { Product, StockMovement } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

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
            if (!search) return true;
            const q = search.toLowerCase();
            const product = products.find(p => p.id === m.productId);
            
            return (
                (m.productName || '').toLowerCase().includes(q) ||
                (product?.name || '').toLowerCase().includes(q) ||
                (product?.sku || '').toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                (m.reason || '').toLowerCase().includes(q)
            );
        });
    }, [movements, products, search]);

    const totalPages = Math.ceil(filteredHistory.length / WASTE_HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * WASTE_HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + WASTE_HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-[var(--theme-border)] mt-4 pt-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-[var(--theme-text-secondary)]" />
                        Waste Logs
                    </h4>
                    <p className="text-[var(--theme-text-secondary)] text-[11px]">Recent spoilage and damage records</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={15} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-primary transition-all touch-manipulation"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {paginatedHistory.map((m: any) => {
                            const product = products.find(p => p.id === m.productId);
                            const rawUser = m.userId || m.user_id || m.userName || m.user;
                            const resolved = resolveFulfillmentWorker({
                                userId: rawUser,
                                job: null,
                                employees: [],
                                sites: [],
                                siteId: m.siteId || m.site_id
                            });
                            const workerName = resolved.code ? `${resolved.name} (${resolved.code})` : resolved.name;

                            return (
                                <div
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedJob(m);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 hover:border-primary/40 transition-all group cursor-pointer shadow-xs touch-manipulation"
                                >
                                    <div className="flex justify-between items-start mb-2.5">
                                        <span className="text-[11px] font-mono text-primary font-bold">{m.id.slice(0, 8)}</span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-lg uppercase font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                                            {m.reason.replace('Waste: ', '')}
                                        </span>
                                    </div>
                                    <div className="space-y-1 mb-2.5">
                                        <p className="text-sm font-bold text-[var(--theme-text-primary)] break-words">{product?.name || m.productName || 'Unknown Item'}</p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{product?.sku || 'SKU N/A'}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--theme-border)]">
                                        <div className="flex items-center gap-1 text-[var(--theme-text-secondary)] min-w-0 pr-2">
                                            <UserCheck size={12} className="shrink-0 text-primary" />
                                            <span className="break-words leading-tight">By: {workerName}</span>
                                        </div>
                                        <div className="text-right text-[var(--theme-text-primary)] font-mono font-bold text-xs tabular-nums shrink-0">
                                            {m.quantity} <span className="text-[11px] text-[var(--theme-text-secondary)] font-normal">units</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-1 text-right">{formatDateTime(m.date)}</p>
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
                <div className="text-center py-12 bg-[var(--theme-bg-subtle)] rounded-2xl border border-dashed border-[var(--theme-border)]">
                    <p className="text-[var(--theme-text-secondary)] text-xs">No matching waste history found</p>
                </div>
            )}
        </div>
    );
};
