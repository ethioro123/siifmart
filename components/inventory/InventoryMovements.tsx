
import React, { useState, useEffect } from 'react';
import { Search, X, ArrowLeftRight, RefreshCw } from 'lucide-react';
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
                // 1. If HQ View + group_ceo -> Use dropdown filter
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

    const hasActiveFilters = Boolean(movementsSearch || movementsTypeFilter !== 'All' || (isHQView && movementsSiteFilter !== 'All'));

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Controls Toolbar */}
            <div className="p-3.5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[280px] relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] group-focus-within:text-[var(--theme-accent)] transition-colors pointer-events-none" size={15} />
                    <input
                        type="text"
                        value={movementsSearch}
                        onChange={(e) => setMovementsSearch(e.target.value)}
                        placeholder="Search product or ref ID..."
                        className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl py-2 pl-10 pr-9 text-[13px] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all shadow-xs"
                    />
                    {movementsSearch && (
                        <button
                            type="button"
                            onClick={() => setMovementsSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] p-0.5 rounded-full transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Site Filter (HQ/SuperAdmin Only) */}
                    {(isHQView && isSuperAdmin) ? (
                        <select
                            aria-label="Filter Movement Site"
                            value={movementsSiteFilter}
                            onChange={(e) => setMovementsSiteFilter(e.target.value)}
                            className="h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 text-[13px] font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs cursor-pointer transition-all"
                        >
                            <option value="All">All Sites</option>
                            {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    ) : (
                        !isHQView && (
                            <div className="h-10 px-3.5 bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] rounded-xl text-[13px] text-[var(--theme-text-secondary)] font-medium flex items-center shadow-xs">
                                {activeSite?.name || 'Current Site'}
                            </div>
                        )
                    )}

                    {/* Type Filter */}
                    <select
                        aria-label="Filter Movement Type"
                        value={movementsTypeFilter}
                        onChange={(e) => setMovementsTypeFilter(e.target.value)}
                        className="h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 text-[13px] font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs cursor-pointer transition-all"
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
                        className="h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 text-[13px] font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] shadow-xs cursor-pointer transition-all"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="quantity-desc">Highest Qty</option>
                        <option value="quantity-asc">Lowest Qty</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setMovementsSearch('');
                                setMovementsTypeFilter('All');
                                if (isHQView) setMovementsSiteFilter('All');
                            }}
                            className="h-10 px-3 text-[var(--theme-status-danger-text)] hover:bg-[var(--theme-status-danger-bg)]/10 border border-[var(--theme-status-danger-border)]/20 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer active:scale-[0.98]"
                            title="Clear All Filters"
                        >
                            <X size={14} />
                            <span>Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs isolate overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center">
                            <ArrowLeftRight size={15} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">Stock Movements</h3>
                            <p className="text-[12px] text-[var(--theme-text-secondary)]">Immutable ledger of physical inventory movements</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-[var(--theme-bg-hover)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                            {formatCompactNumber(totalMovementsCount)} total records
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto relative min-h-[360px]">
                    {movementsLoading && (
                        <div className="absolute inset-0 bg-[var(--theme-bg-card)]/60 backdrop-blur-xs flex items-center justify-center z-10 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                                <RefreshCw className="animate-spin" size={18} />
                            </div>
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-hover)]/40 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Ref ID</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Qty</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {localMovements.map((move) => {
                                const prod = allProducts.find(p => p.id === move.productId) || products.find(p => p.id === move.productId);
                                const unitCode = prod?.unit;
                                const unitDef = unitCode ? getSellUnit(unitCode) : null;
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
                                    <tr key={move.id} className="hover:bg-[var(--theme-bg-hover)]/40 transition-colors">
                                        <td className="px-4 py-3 text-[12px] font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                            {move.id?.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] tabular-nums text-[var(--theme-text-secondary)] whitespace-nowrap">
                                            {formatDateTime(move.date, { showTime: true })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                move.type === 'IN'
                                                    ? 'text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]/20 bg-[var(--theme-status-success-bg)]/10'
                                                    : move.type === 'OUT'
                                                    ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border-[var(--theme-border-focus)]/20 bg-[var(--theme-accent)]/10'
                                                    : move.type === 'TRANSFER'
                                                    ? 'text-[var(--theme-chart-4)] border-[var(--theme-chart-4)]/20 bg-[var(--theme-chart-4)]/10'
                                                    : 'text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]/20 bg-[var(--theme-status-warning-bg)]/10'
                                            }`}>
                                                {move.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-medium text-[var(--theme-text-primary)]">
                                            {move.productName}
                                        </td>
                                        <td className={`px-4 py-3 text-[13px] font-mono tabular-nums text-right font-semibold ${
                                            move.type === 'IN' ? 'text-[var(--theme-status-success-text)]' : move.type === 'OUT' ? 'text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-text-primary)]'
                                        }`}>
                                            {prefix}{displayQty.toLocaleString()}
                                            {perUnitLabel ? (
                                                <span className="text-[11px] font-medium ml-1 text-[var(--theme-text-secondary)]">{perUnitLabel}</span>
                                            ) : (
                                                <span className="text-[11px] font-medium ml-1 text-[var(--theme-text-secondary)] uppercase">{unitLabel}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] whitespace-nowrap">
                                            {move.performedBy || 'System'}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] max-w-[220px] truncate" title={move.reason || ''}>
                                            {move.reason || <span className="text-[var(--theme-text-secondary)]/50">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!movementsLoading && localMovements.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3">
                                                <ArrowLeftRight size={20} />
                                            </div>
                                            <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">No stock movements found</p>
                                            <p className="text-[12px] text-[var(--theme-text-secondary)] mt-1 max-w-sm">
                                                No transactions match the selected filters. Adjust your search or clear filters to view ledger records.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-wrap gap-3 justify-between items-center px-5 py-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-hover)]/30">
                    <div className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                        Showing <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{localMovements.length}</span> of <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{formatCompactNumber(totalMovementsCount)}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentMovementsPage(prev => Math.max(1, prev - 1))}
                            disabled={currentMovementsPage === 1 || movementsLoading}
                            className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-2 text-[12px] font-mono tabular-nums text-[var(--theme-text-secondary)]">
                            Page {currentMovementsPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentMovementsPage(prev => (localMovements.length === MOVEMENTS_PER_PAGE ? prev + 1 : prev))}
                            disabled={localMovements.length < MOVEMENTS_PER_PAGE || movementsLoading}
                            className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
