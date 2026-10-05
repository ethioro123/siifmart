
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { stockMovementsService } from '../../services/supabase.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { getSellUnit } from '../../utils/units';
import { Site, StockMovement } from '../../types';
import { logger } from '../../utils/logger';
import { canViewAllSites } from '../../utils/permissions';

interface InventoryMovementsProps {
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    addNotification: (type: any, message: string) => void;
}

export const InventoryMovements: React.FC<InventoryMovementsProps> = ({
    sites, activeSite, isReadOnly, addNotification
}) => {
    // State
    const [localMovements, setLocalMovements] = useState<StockMovement[]>([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [totalMovementsCount, setTotalMovementsCount] = useState(0);
    const [currentMovementsPage, setCurrentMovementsPage] = useState(1);
    const MOVEMENTS_PER_PAGE = 20;

    // Filter State
    const { user } = useStore();
    const { allProducts, products } = useData();
    const isSuperAdmin = canViewAllSites(user?.role);
    const isHQView = !activeSite;

    const [movementsSearch, setMovementsSearch] = useState('');
    const [movementsTypeFilter, setMovementsTypeFilter] = useState('All');
    // If not super admin/HQ, force current site
    const [movementsSiteFilter, setMovementsSiteFilter] = useState(isHQView ? 'All' : (activeSite?.id || 'All'));
    const [movementsSort, setMovementsSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    // Sync site filter if activeSite changes and not in HQ view
    useEffect(() => {
        if (!isHQView && activeSite?.id) {
            setMovementsSiteFilter(activeSite.id);
        }
    }, [activeSite?.id, isHQView]);

    // Fetch Data
    useEffect(() => {
        const fetchMovements = async () => {
            setMovementsLoading(true);
            try {
                const offset = (currentMovementsPage - 1) * MOVEMENTS_PER_PAGE;

                // Enforce Visibility: 
                // 1. If HQ View + Super Admin -> Use dropdown filter
                // 2. If Warehouse View -> ALWAYS use activeSite.id, regardless of dropdown (security)
                let siteIdToQuery = activeSite?.id;

                if (isHQView) {
                    siteIdToQuery = movementsSiteFilter === 'All' ? undefined : movementsSiteFilter;
                }

                const { data, count } = await stockMovementsService.getAll(
                    siteIdToQuery,
                    undefined,
                    MOVEMENTS_PER_PAGE,
                    offset,
                    { search: movementsSearch, type: movementsTypeFilter },
                    movementsSort
                );
                setLocalMovements(data);
                setTotalMovementsCount(count);
            } catch (error) {
                logger.error('InventoryMovements', 'Failed to fetch movements', error);
                addNotification('alert', 'Failed to load movements');
            } finally {
                setMovementsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchMovements();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentMovementsPage, activeSite?.id, movementsSearch, movementsTypeFilter, movementsSiteFilter, movementsSort, isReadOnly, addNotification, isHQView]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentMovementsPage(1);
    }, [movementsSearch, movementsTypeFilter, movementsSiteFilter, movementsSort]);

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Controls */}
            <div className="p-4 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-accent)] transition-colors" size={16} />
                    <input
                        type="text"
                        value={movementsSearch}
                        onChange={(e) => setMovementsSearch(e.target.value)}
                        placeholder="Search by Product name or Reference ID..."
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Site Filter (HQ/SuperAdmin Only) */}
                    {(isHQView && isSuperAdmin) ? (
                        <select
                            aria-label="Filter Movement Site"
                            value={movementsSiteFilter}
                            onChange={(e) => setMovementsSiteFilter(e.target.value)}
                            className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                        >
                            <option value="All">All Sites</option>
                            {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    ) : (
                        // Show current site as read-only badge if in warehouse view
                        !isHQView && (
                            <div className="bg-[var(--theme-pill-bg)] border border-[var(--theme-pill-border)] rounded-xl px-4 py-3 text-sm text-[var(--theme-text-primary)] font-bold">
                                {activeSite?.name || 'Current Site'}
                            </div>
                        )
                    )}

                    {/* Type Filter */}
                    <select
                        aria-label="Filter Movement Type"
                        value={movementsTypeFilter}
                        onChange={(e) => setMovementsTypeFilter(e.target.value)}
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    >
                        <option value="All">All Types</option>
                        <option value="IN">Inbound (Stock In)</option>
                        <option value="OUT">Outbound (Stock Out)</option>
                        <option value="ADJUSTMENT">Adjustments</option>
                        <option value="TRANSFER">Transfers</option>
                    </select>

                    {/* Sort */}
                    <select
                        aria-label="Sort Movements"
                        value={`${movementsSort.key}-${movementsSort.direction}`}
                        onChange={(e) => {
                            const [key, direction] = e.target.value.split('-');
                            setMovementsSort({ key, direction: direction as 'asc' | 'desc' });
                        }}
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="quantity-desc">Highest Qty</option>
                        <option value="quantity-asc">Lowest Qty</option>
                    </select>

                    {(movementsSearch || movementsTypeFilter !== 'All' || (isHQView && movementsSiteFilter !== 'All')) && (
                        <button
                            onClick={() => {
                                setMovementsSearch('');
                                setMovementsTypeFilter('All');
                                if (isHQView) setMovementsSiteFilter('All');
                            }}
                            className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors shrink-0"
                            title="Clear All Filters"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--theme-border)]"><h3 className="font-bold text-[var(--theme-text-primary)]">Stock Movements</h3><p className="text-xs text-[var(--theme-text-muted)] mt-1">Immutable history of inventory changes.</p></div>
                <div className="overflow-x-auto relative min-h-[400px]">
                    {movementsLoading && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 transition-all">
                            <div className="w-10 h-10 border-4 border-[var(--theme-border)] border-t-[var(--theme-accent)] rounded-full animate-spin" />
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead><tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]"><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">Ref ID</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">Time</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">Type</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">Product</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold text-right">Qty</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">User</th><th className="p-4 text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">Reason</th></tr></thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {localMovements.map((move) => (
                                <tr key={move.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                    <td className="p-4 text-xs font-mono text-[var(--theme-text-muted)]">{move.id?.slice(0, 8).toUpperCase()}</td>
                                    <td className="p-4 text-xs text-[var(--theme-text-primary)]">{formatDateTime(move.date, { showTime: true })}</td>
                                    <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${move.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : move.type === 'OUT' ? 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10' : 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10'} `}>{move.type}</span></td>
                                    <td className="p-4 text-sm text-[var(--theme-text-primary)]">{move.productName}</td>
                                    <td className={`p-4 text-sm font-mono text-right font-bold ${move.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : move.type === 'OUT' ? 'text-red-500' : 'text-[var(--theme-text-primary)]'} `}>
                                        {(() => {
                                            const prod = allProducts.find(p => p.id === move.productId) || products.find(p => p.id === move.productId);
                                            const unitCode = prod?.unit;
                                            const unitDef = unitCode ? getSellUnit(unitCode) : null;
                                            // Convert raw quantity to sellable units for weight/volume products
                                            let displayQty = Math.abs(move.quantity);
                                            let perUnitLabel = '';
                                            if (prod && unitDef && (unitDef.category === 'weight' || unitDef.category === 'volume')) {
                                                const sizeNum = parseFloat(prod.size || '0');
                                                if (sizeNum > 0) {
                                                    perUnitLabel = ` × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                                                }
                                            }
                                            const prefix = move.type === 'IN' ? '+' : move.type === 'OUT' ? '-' : '';
                                            const unitLabel = (!perUnitLabel && unitDef) ? unitDef.shortLabel : 'units';
                                            return (
                                                <>
                                                    {prefix}{displayQty.toLocaleString()}
                                                    {perUnitLabel ? (
                                                        <span className="text-[9px] font-bold ml-1 opacity-60">{perUnitLabel}</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold ml-1 opacity-60 uppercase">{unitLabel}</span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-4 text-xs text-[var(--theme-text-secondary)]">{move.performedBy}</td>
                                    <td className="p-4 text-xs text-[var(--theme-text-muted)] italic">{move.reason}</td>
                                </tr>
                            ))}
                            {!movementsLoading && localMovements.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-[var(--theme-text-muted)] italic text-sm">
                                        No stock movements found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                    <div className="text-xs text-[var(--theme-text-muted)]">
                        Showing {localMovements.length} of {formatCompactNumber(totalMovementsCount)} records
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentMovementsPage(prev => Math.max(1, prev - 1))}
                            disabled={currentMovementsPage === 1 || movementsLoading}
                            className="px-3 py-1 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)]"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-2 text-xs text-[var(--theme-text-muted)] font-mono">
                            Page {currentMovementsPage}
                        </span>
                        <button
                            onClick={() => setCurrentMovementsPage(prev => (localMovements.length === MOVEMENTS_PER_PAGE ? prev + 1 : prev))}
                            disabled={localMovements.length < MOVEMENTS_PER_PAGE || movementsLoading}
                            className="px-3 py-1 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)]"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
