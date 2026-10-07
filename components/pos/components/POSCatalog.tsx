import React from 'react';
import { Box, Plus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit, formatStockDisplay } from '../../../utils/units';
import { formatPackBadge } from '../../procurement/utils';
import { Product } from '../../../types';
import { native } from '../../../utils/native';

interface POSCatalogProps {
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    ITEMS_PER_PAGE: number;
    totalPages: number;
    paginatedProducts: Product[];
}

export const POSCatalog: React.FC<POSCatalogProps> = ({
    currentPage,
    setCurrentPage,
    ITEMS_PER_PAGE,
    totalPages,
    paginatedProducts
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { filteredProducts, addToCart, lastSeenPriceUpdate, cart, setIsPriceUpdatesModalOpen } = usePOS();

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <Box size={64} className="text-[var(--theme-text-muted)] mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">{t('pos.noProductsAvailable')}</h3>
                    <p className="text-[var(--theme-text-secondary)] max-w-md">
                        {t('pos.productsWillAppear')}
                        <br />
                        {!native.isCleanMobileMode() && (
                            <button
                                onClick={() => navigate('/pos-dashboard')}
                                className="text-[var(--theme-primary)] hover:underline mt-2 font-medium"
                            >
                                {t('pos.goToPOSCommand')}
                            </button>
                        )}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5">
                        {paginatedProducts.map(product => {
                            const inCartItem = cart.find(i => i.id === product.id || (i as any).productId === product.id);
                            return (
                            <button
                                key={product.id}
                                onClick={() => {
                                    addToCart(product);
                                    native.haptic();
                                }}
                                disabled={product.stock === 0}
                                className={`text-left bg-[var(--theme-bg-card)] border rounded-xl p-2 sm:p-2.5 hover:bg-[var(--theme-bg-card-hover)] transition-colors group relative overflow-hidden flex flex-col h-full active:scale-[0.98] shadow-xs ${product.stock <= 0 ? 'border-rose-500/50 opacity-50 cursor-not-allowed' : inCartItem ? 'border-[var(--theme-border-focus)] ring-1 ring-[var(--theme-border-focus)]' : 'border-[var(--theme-border)] hover:border-[var(--theme-border-mocha)]'}`}
                            >
                                <div className="aspect-[4/3] rounded-lg bg-[var(--theme-bg-panel)] mb-2 overflow-hidden relative border border-[var(--theme-border)] flex items-center justify-center">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                            <div className="w-full h-full bg-[var(--theme-bg-panel)] items-center justify-center hidden">
                                                <Package size={20} className="text-[var(--theme-text-muted)]" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-[var(--theme-bg-panel)] flex items-center justify-center">
                                            <Package size={20} className="text-[var(--theme-text-muted)]" />
                                        </div>
                                    )}

                                    {/* Stock indicator */}
                                    {(() => {
                                        const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                        const isOutOfStock = product.stock <= 0;
                                        const isLowStock = product.stock < threshold;
                                        
                                        let colorClasses = 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]';
                                        if (isOutOfStock) {
                                            colorClasses = 'bg-rose-500/15 text-rose-500 border border-rose-500/30';
                                        } else if (isLowStock) {
                                            colorClasses = 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
                                        }

                                        return (
                                            <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider shadow-xs flex items-center gap-0.5 ${colorClasses}`}>
                                                {isOutOfStock ? (
                                                    <span>{t('common.outOfStock')}</span>
                                                ) : (
                                                    <span>{formatStockDisplay(product.stock, product, { compact: true })}</span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const priceTime = (product as any).priceUpdatedAt || (product as any).price_updated_at || (product as any).updatedAt || (product as any).updated_at;
                                        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
                                        if (priceTime) {
                                            const ts = new Date(priceTime).getTime();
                                            if (ts > cutoff && ts > (lastSeenPriceUpdate || 0)) {
                                                return (
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsPriceUpdatesModalOpen(true);
                                                            native.haptic();
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setIsPriceUpdatesModalOpen(true);
                                                                native.haptic();
                                                            }
                                                        }}
                                                        className="absolute top-1.5 left-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1 z-10 transition-colors cursor-pointer active:scale-95"
                                                        title="Price updated recently - tap to confirm"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                        Changed
                                                    </span>
                                                );
                                            }
                                        }
                                        if (product.isOnSale) {
                                            return (
                                                <div className="absolute top-1.5 left-1.5 bg-rose-500 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                                                    {t('pos.sale')}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-bold text-[var(--theme-text-primary)] text-xs sm:text-sm line-clamp-2 min-h-[1.75rem] leading-snug mb-1 group-hover:text-[var(--theme-accent)] transition-colors">{product.name}</h3>
                                    {(() => {
                                        const badge = formatPackBadge(product);
                                        return badge ? (
                                            <span className="inline-block mb-1 px-1.5 py-0.5 rounded-md bg-[var(--theme-pill-bg)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[10px] font-bold uppercase tracking-wider max-w-fit">
                                                {badge}
                                            </span>
                                        ) : null;
                                    })()}
                                    <div className="mt-auto pt-1 flex items-center justify-between border-t border-[var(--theme-border)]">
                                        <div className="flex flex-col min-w-0 pr-1">
                                            {(() => {
                                                const priceTime = (product as any).priceUpdatedAt || (product as any).price_updated_at || (product as any).updatedAt || (product as any).updated_at;
                                                const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
                                                if (priceTime) {
                                                    const ts = new Date(priceTime).getTime();
                                                    if (ts > cutoff && ts > (lastSeenPriceUpdate || 0)) {
                                                        return (
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsPriceUpdatesModalOpen(true);
                                                                    native.haptic();
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setIsPriceUpdatesModalOpen(true);
                                                                        native.haptic();
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase mb-0.5 tracking-wider cursor-pointer"
                                                                title="Price updated recently - tap to confirm"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                                Updated
                                                            </span>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                            <div className="flex items-baseline gap-1 flex-wrap">
                                                {product.isOnSale && product.salePrice ? (
                                                    <>
                                                        <p className="text-rose-500 font-bold text-xs sm:text-sm font-mono tabular-nums tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.salePrice)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-xs text-rose-500 font-bold ml-0.5">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                        <p className="text-[var(--theme-text-secondary)] text-xs line-through font-mono tabular-nums font-semibold">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-[var(--theme-text-primary)] font-bold text-xs sm:text-sm font-mono tabular-nums tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-xs text-[var(--theme-text-secondary)] font-bold ml-0.5">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${inCartItem ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] group-hover:bg-[var(--theme-bg-card-hover)] group-hover:text-[var(--theme-text-primary)]'}`}>
                                            {inCartItem ? (
                                                <span className="text-xs font-bold">{inCartItem.quantity}</span>
                                            ) : (
                                                <Plus size={13} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-28 lg:pb-8 border-t border-[var(--theme-border)] mt-6 px-1">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                Showing <span className="font-bold text-[var(--theme-text-primary)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                <span className="font-bold text-[var(--theme-text-primary)]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                                </span>{' '}
                                of <span className="font-bold text-[var(--theme-text-primary)]">{filteredProducts.length}</span> products
                            </span>
                            
                            <div className="flex items-center gap-1.5 touch-manipulation">
                                <button
                                    type="button"
                                    aria-label="First page"
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        setCurrentPage(1);
                                        native.haptic();
                                    }}
                                    className="hidden sm:flex min-w-[36px] min-h-[36px] h-9 w-9 rounded-xl items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm cursor-pointer active:scale-95"
                                >
                                    &laquo;
                                </button>
                                
                                <button
                                    type="button"
                                    aria-label="Previous page"
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1));
                                        native.haptic();
                                    }}
                                    className="min-w-[36px] min-h-[36px] h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base cursor-pointer active:scale-95"
                                >
                                    &lsaquo;
                                </button>

                                {(() => {
                                    const pages = [];
                                    const maxVisiblePages = 5;
                                    let startPage = Math.max(1, currentPage - 2);
                                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                    
                                    if (endPage - startPage < maxVisiblePages - 1) {
                                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                    }

                                    for (let p = startPage; p <= endPage; p++) {
                                        pages.push(
                                            <button
                                                type="button"
                                                key={p}
                                                aria-label={`Page ${p}`}
                                                aria-current={currentPage === p ? 'page' : undefined}
                                                onClick={() => {
                                                    setCurrentPage(p);
                                                    native.haptic();
                                                }}
                                                className={`min-w-[36px] min-h-[36px] h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-colors cursor-pointer active:scale-95 ${currentPage === p
                                                    ? 'bg-[var(--theme-primary)] border-transparent text-[var(--theme-primary-text)] shadow-xs'
                                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}

                                <button
                                    type="button"
                                    aria-label="Next page"
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                        native.haptic();
                                    }}
                                    className="min-w-[36px] min-h-[36px] h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base cursor-pointer active:scale-95"
                                >
                                    &rsaquo;
                                </button>
                                
                                <button
                                    type="button"
                                    aria-label="Last page"
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        setCurrentPage(totalPages);
                                        native.haptic();
                                    }}
                                    className="hidden sm:flex min-w-[36px] min-h-[36px] h-9 w-9 rounded-xl items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm cursor-pointer active:scale-95"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
export default POSCatalog;
