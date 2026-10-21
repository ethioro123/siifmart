import React from 'react';
import {
    Building, Store, Package, MapPin, AlertTriangle, Users, ChevronDown, ChevronRight
} from 'lucide-react';
import { Site, Product } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { useStore } from '../../contexts/CentralStore';
import { hasPermission } from '../../utils/permissions';
import { productsService } from '../../services/products.service';

const PRODUCTS_PER_PAGE = 9;

interface NetworkSiteCardProps {
    site: Site;
    siteProducts: Product[];
    metrics: {
        totalValue: number;
        totalValueRetail: number;
        totalItems: number;
        uniqueProducts: number;
        lowStockItems: number;
        outOfStockItems: number;
        categories: number;
    };
    isExpanded: boolean;
    onToggleExpand: () => void;
    currentPage: number;
    onPageChange: (page: number) => void;
    onSelectProduct: (product: Product) => void;
    isLowStockFilterActive: boolean;
    searchTerm?: string;
}

export const NetworkSiteCard: React.FC<NetworkSiteCardProps> = ({
    site,
    siteProducts,
    metrics,
    isExpanded,
    onToggleExpand,
    currentPage,
    onPageChange,
    onSelectProduct,
    isLowStockFilterActive,
    searchTerm
}) => {
    const { user } = useStore();
    const canViewCost = hasPermission(user?.role, 'VIEW_COST_PRICE');
    const isWarehouse = site.type === 'Warehouse' || site.type === 'Distribution Center';
    const [fetchedSiteProducts, setFetchedSiteProducts] = React.useState<Product[]>([]);

    // RULE 10: On-demand lazy load site products only when card is expanded
    React.useEffect(() => {
        if (!isExpanded) return;
        productsService.getAll(site.id, 25, 0, undefined, undefined, false).then(res => {
            if (res.data && res.data.length > 0) {
                setFetchedSiteProducts(res.data);
            }
        }).catch(() => {});
    }, [isExpanded, site.id]);

    const displayedProducts = React.useMemo(() => {
        let prods = fetchedSiteProducts.length > 0 ? fetchedSiteProducts : siteProducts;
        if (isLowStockFilterActive) {
            prods = prods.filter(p => p.stock <= (p.minStock || 10));
        }
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            prods = prods.filter(p =>
                p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.barcode && p.barcode.toLowerCase().includes(term))
            );
        }
        return prods;
    }, [siteProducts, fetchedSiteProducts, isLowStockFilterActive, searchTerm]);

    const getStockStatusColor = (stock: number, minStock: number = 10) => {
        if (stock <= 0) return 'text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]';
        if (stock <= minStock) return 'text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]';
        if (stock < 50) return 'text-[var(--theme-status-info-text)] bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)]';
        return 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]';
    };

    const totalPages = Math.max(1, Math.ceil(displayedProducts.length / PRODUCTS_PER_PAGE));
    const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const paginatedProducts = displayedProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5 flex-1">
                        <div className="p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] shrink-0">
                            {isWarehouse ? <Building size={22} /> : <Store size={22} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">{site.name}</h3>
                                <span className="text-[10px] font-mono bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded">
                                    {site.code || site.type}
                                </span>
                                {(metrics.lowStockItems > 0 || metrics.outOfStockItems > 0) && (
                                    <span className="text-[9px] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                        <AlertTriangle size={10} />
                                        {metrics.lowStockItems + metrics.outOfStockItems} Low Stock
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] flex flex-wrap items-center gap-2 mt-1 font-medium">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {site.address || 'Regional Node'}</span>
                                {site.manager && (
                                    <>
                                        <span className="opacity-40">•</span>
                                        <span className="flex items-center gap-1 text-[var(--theme-text-primary)] font-semibold">
                                            <Users size={12} /> {site.manager}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Bar */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--theme-border)]">
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Products</p>
                            <p className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">
                                {metrics.uniqueProducts}
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Total Items</p>
                            <p className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">
                                {metrics.totalItems.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Asset Value</p>
                            <p className="text-base sm:text-lg font-bold text-[var(--theme-status-success-text)] font-mono tabular-nums">
                                {canViewCost ? formatCompactNumber(metrics.totalValue, { currency: CURRENCY_SYMBOL }) : '••••••'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleExpand}
                            aria-label={isExpanded ? `Collapse products at ${site.name}` : `View products at ${site.name}`}
                            aria-expanded={isExpanded}
                            className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-accent-muted)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] border border-[var(--theme-border)] rounded-xl transition-colors cursor-pointer ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                {/* Accordion: Stocked Catalog at this Location */}
                {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[var(--theme-border)] animate-in fade-in">
                        {displayedProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {paginatedProducts.map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => onSelectProduct(product)}
                                            className="w-full min-h-11 text-left bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="overflow-hidden flex-1">
                                                    <p className="text-xs font-bold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] truncate transition-colors">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5">{product.sku || 'No SKU'}</p>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border font-mono shrink-0 ${getStockStatusColor(product.stock, product.minStock)}`}>
                                                    {product.stock} units
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--theme-border)] text-[11px]">
                                                <span className="text-[var(--theme-text-secondary)] font-medium">{product.category}</span>
                                                <span className="font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                                    {formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination Bar */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-[var(--theme-border)] text-xs">
                                        <span className="text-[var(--theme-text-secondary)] font-medium">
                                            Showing {startIdx + 1}-{Math.min(startIdx + PRODUCTS_PER_PAGE, displayedProducts.length)} of {displayedProducts.length} products
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onPageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="min-h-11 min-w-11 px-3 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl font-semibold text-[var(--theme-text-primary)] disabled:opacity-40 cursor-pointer hover:bg-[var(--theme-bg-card)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                            >
                                                Prev
                                            </button>
                                            <span className="font-mono font-bold text-[var(--theme-text-primary)] px-1">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onPageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="min-h-11 min-w-11 px-3 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl font-semibold text-[var(--theme-text-primary)] disabled:opacity-40 cursor-pointer hover:bg-[var(--theme-bg-card)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center bg-[var(--theme-bg-subtle)] rounded-xl border border-dashed border-[var(--theme-border)]">
                                <Package size={24} className="text-[var(--theme-text-secondary)] opacity-40 mx-auto mb-1.5" />
                                <p className="text-xs font-semibold text-[var(--theme-text-secondary)]">No matching products at this facility</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default NetworkSiteCard;
