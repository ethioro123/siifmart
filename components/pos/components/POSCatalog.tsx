import React from 'react';
import { Box, Plus, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit, formatStockDisplay } from '../../../utils/units';
import { formatPackBadge } from '../../procurement/utils';
import { Product } from '../../../types';
import { native } from '../../../utils/native';
import { getPriceUpdateTimestamp } from '../utils/priceUpdates';

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
    const { filteredProducts, addToCart, cart } = usePOS();

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <Box size={64} className="text-[var(--theme-text-muted)] mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">{t('pos.noProductsAvailable')}</h3>
                    <p className="text-[var(--theme-text-secondary)] max-w-md">
                        {t('pos.productsWillAppear')}
                        <br />
                        {!native.isCleanMobileMode() && (
                            <button
                                type="button"
                                onClick={() => navigate('/pos-dashboard')}
                                className="min-h-11 mt-2 px-3 text-[var(--theme-accent)] hover:underline font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                                {t('pos.goToPOSCommand')}
                            </button>
                        )}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                        {paginatedProducts.map(product => {
                            const inCartItem = cart.find(i => i.id === product.id || (i as any).productId === product.id);
                            return (
                            <button
                                type="button"
                                key={product.id}
                                onClick={() => {
                                    addToCart(product);
                                    native.haptic();
                                }}
                                disabled={product.stock <= 0}
                                aria-label={`${product.name}, ${product.stock <= 0 ? t('common.outOfStock') : `${CURRENCY_SYMBOL} ${formatPriceValue(product.isOnSale && product.salePrice ? product.salePrice : product.price)}`}. Add to cart`}
                                className={`text-left bg-[var(--theme-bg-card)] border rounded-[14px] p-3 sm:p-3.5 transition-colors group relative overflow-hidden flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${product.stock <= 0 ? 'border-[var(--theme-status-danger-border)] cursor-not-allowed' : inCartItem ? 'bg-[var(--theme-bg-card-hover)] border-[var(--theme-border-focus)] ring-1 ring-[var(--theme-border-focus)] shadow-sm' : 'border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-card-hover)] hover:border-[var(--theme-border-strong)] hover:shadow-sm'} disabled:hover:bg-[var(--theme-bg-card)] disabled:hover:shadow-none`}
                            >
                                <div className="aspect-[4/3] rounded-[10px] bg-[var(--theme-bg-panel)] mb-3 overflow-hidden relative flex items-center justify-center">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 motion-reduce:transition-none"
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
                                            colorClasses = 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]';
                                        } else if (isLowStock) {
                                            colorClasses = 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]';
                                        }

                                        return (
                                            <div className={`absolute top-1.5 right-1.5 min-h-6 px-2 rounded-full text-xs leading-4 font-semibold shadow-xs flex items-center gap-1 ${colorClasses}`}>
                                                {isOutOfStock ? (
                                                    <span>{t('common.outOfStock')}</span>
                                                ) : (
                                                    <span>{formatStockDisplay(product.stock, product, { compact: true })}</span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const priceTime = getPriceUpdateTimestamp(product);
                                        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
                                        if (priceTime !== null) {
                                            if (priceTime > cutoff) {
                                                return (
                                                    <span className="absolute top-1.5 left-1.5 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)] min-h-6 px-2 rounded-full text-xs leading-4 font-semibold uppercase shadow-xs flex items-center gap-1 z-10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-info)]" aria-hidden="true" />
                                                        {t('pos.changed')}
                                                    </span>
                                                );
                                            }
                                        }
                                        if (product.isOnSale) {
                                            return (
                                                <div className="absolute top-1.5 left-1.5 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] min-h-6 px-2 rounded-full text-xs leading-4 font-semibold uppercase shadow-xs flex items-center">
                                                    {t('pos.sale')}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-semibold text-[var(--theme-text-primary)] text-sm leading-5 mb-2 tracking-tight whitespace-normal break-words">{product.name}</h3>
                                    {(() => {
                                        const badge = formatPackBadge(product);
                                        return badge ? (
                                            <span className="inline-block mb-2 px-2 py-1 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] text-xs leading-4 font-semibold tracking-wide max-w-fit">
                                                {badge}
                                            </span>
                                        ) : null;
                                    })()}
                                    <div className="mt-auto pt-2.5 flex items-center justify-between border-t border-[var(--theme-border-subtle)]">
                                        <div className="flex flex-col min-w-0 pr-1">
                                            <div className="flex items-baseline gap-1 flex-wrap">
                                                {product.isOnSale && product.salePrice ? (
                                                    <>
                                                        <p className="text-[var(--theme-status-danger-text)] font-bold text-sm sm:text-base font-mono tabular-nums tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.salePrice)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-xs text-[var(--theme-status-danger-text)] font-bold ml-0.5">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                        <p className="text-[var(--theme-text-secondary)] text-xs line-through font-mono tabular-nums font-semibold">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-[var(--theme-text-primary)] font-bold text-sm sm:text-base font-mono tabular-nums tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-xs text-[var(--theme-text-secondary)] font-bold ml-0.5">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${inCartItem ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] group-hover:bg-[var(--theme-primary)] group-hover:text-[var(--theme-primary-text)]'}`}>
                                            {inCartItem ? (
                                                <span className="text-xs font-bold">{inCartItem.quantity}</span>
                                            ) : (
                                                <Plus size={16} />
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
                                    <span role="status" className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                {t('common.showing')} <span className="font-bold text-[var(--theme-text-primary)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
                                <span className="font-bold text-[var(--theme-text-primary)]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                                </span>{' '}
                                {t('common.of')} <span className="font-bold text-[var(--theme-text-primary)]">{filteredProducts.length}</span> {t('pos.products')}
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
                                    className="hidden sm:flex min-w-11 min-h-11 rounded-xl items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                >
                                    <ChevronsLeft size={16} />
                                </button>
                                
                                <button
                                    type="button"
                                    aria-label="Previous page"
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1));
                                        native.haptic();
                                    }}
                                    className="min-w-11 min-h-11 rounded-xl flex items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                >
                                    <ChevronLeft size={16} />
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
                                                className={`min-w-11 min-h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${currentPage === p
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
                                    className="min-w-11 min-h-11 rounded-xl flex items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                
                                <button
                                    type="button"
                                    aria-label="Last page"
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        setCurrentPage(totalPages);
                                        native.haptic();
                                    }}
                                    className="hidden sm:flex min-w-11 min-h-11 rounded-xl items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                >
                                    <ChevronsRight size={16} />
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
