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
                    <Box size={64} className="text-[#4D6E56] dark:text-gray-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">{t('pos.noProductsAvailable')}</h3>
                    <p className="text-[#4D6E56] dark:text-[#7A9E83] max-w-md">
                        {t('pos.productsWillAppear')}
                        <br />
                        {!native.isCleanMobileMode() && (
                            <button
                                onClick={() => navigate('/pos-dashboard')}
                                className="text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline mt-2 font-medium"
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
                                className={`text-left bg-white/80 dark:bg-[#18201B]/40 border rounded-xl p-2 sm:p-2.5 hover:bg-white dark:hover:bg-[#18201B]/60 transition-colors group relative overflow-hidden flex flex-col h-full active:scale-[0.98] shadow-xs hover:shadow-sm ${product.stock <= 0 ? 'border-red-500/80 dark:border-red-500/60 opacity-60 cursor-not-allowed' : inCartItem ? 'border-[#2C5E3B] dark:border-[#A9CBA2]/60 ring-1 ring-[#2C5E3B]/30' : 'border-[#E2DCCE]/80 dark:border-emerald-950/20 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30'}`}
                            >
                                <div className="aspect-[4/3] rounded-lg bg-[#F4F0E6] dark:bg-black/35 mb-2 overflow-hidden relative border border-[#E2DCCE]/40 dark:border-white/5 flex items-center justify-center">
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
                                            <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 items-center justify-center hidden">
                                                <Package size={22} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 flex items-center justify-center">
                                            <Package size={22} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                        </div>
                                    )}

                                    {/* Stock indicator */}
                                    {(() => {
                                        const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                        const isOutOfStock = product.stock <= 0;
                                        const isLowStock = product.stock < threshold;
                                        
                                        let colorClasses = 'bg-white/90 dark:bg-black/70 text-[#4D6E56] dark:text-gray-300 border-[#E2DCCE]/60 dark:border-white/10';
                                        if (isOutOfStock) {
                                            colorClasses = 'bg-red-600 dark:bg-red-700 text-white border-transparent shadow-none';
                                        } else if (isLowStock) {
                                            colorClasses = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/35';
                                        }

                                        return (
                                            <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold tracking-wider border shadow-xs flex items-center gap-0.5 ${colorClasses}`}>
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
                                                        className="absolute top-1.5 left-1.5 bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 z-10 transition-colors cursor-pointer active:scale-95"
                                                        title="Price updated recently - tap to confirm"
                                                    >
                                                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                        Changed
                                                    </span>
                                                );
                                            }
                                        }
                                        if (product.isOnSale) {
                                            return (
                                                <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 px-1.5 py-0.5 rounded-md text-[7px] font-black text-white uppercase tracking-wider shadow-xs">
                                                    {t('pos.sale')}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-xs line-clamp-2 min-h-[1.75rem] leading-tight mb-1 group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors">{product.name}</h3>
                                    {(() => {
                                        const badge = formatPackBadge(product);
                                        return badge ? (
                                            <span className="inline-block mb-1 px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[7px] font-black uppercase tracking-widest max-w-fit">
                                                {badge}
                                            </span>
                                        ) : null;
                                    })()}
                                    <div className="mt-auto pt-1 flex items-center justify-between border-t border-[#E2DCCE]/30 dark:border-white/5">
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
                                                                className="inline-flex items-center gap-0.5 text-[7px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase mb-0.5 tracking-wider cursor-pointer"
                                                                title="Price updated recently - tap to confirm"
                                                            >
                                                                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
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
                                                        <p className="text-amber-600 dark:text-amber-400 font-black text-xs sm:text-sm tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.salePrice)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[7px] text-amber-600/60 dark:text-amber-400/60 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                        <p className="text-stone-400 dark:text-gray-600 text-[9px] line-through">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-xs sm:text-sm tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[7px] text-[#4D6E56]/60 dark:text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${inCartItem ? 'bg-[#2C5E3B] text-white' : 'bg-[#2C5E3B]/10 dark:bg-white/5 border border-[#2C5E3B]/20 dark:border-white/10 group-hover:bg-[#2C5E3B]/20 dark:group-hover:bg-white/10'}`}>
                                            {inCartItem ? (
                                                <span className="text-[11px] font-black text-white">{inCartItem.quantity}</span>
                                            ) : (
                                                <Plus size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-28 lg:pb-8 border-t border-[#E2DCCE]/40 dark:border-white/5 mt-6 px-1">
                            <span className="text-xs text-[#4D6E56] dark:text-stone-400 font-semibold">
                                Showing <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                                </span>{' '}
                                of <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{filteredProducts.length}</span> products
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
                                    className="hidden sm:flex min-w-[40px] min-h-[40px] h-10 w-10 rounded-xl items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm cursor-pointer active:scale-95"
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
                                    className="min-w-[40px] min-h-[40px] h-10 w-10 rounded-xl flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base cursor-pointer active:scale-95"
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
                                                className={`min-w-[40px] min-h-[40px] h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-colors cursor-pointer active:scale-95 ${currentPage === p
                                                    ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                                    : 'bg-white dark:bg-black/25 border-[#E2DCCE] dark:border-emerald-950/20 text-[#4D6E56] dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-black/40'
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
                                    className="min-w-[40px] min-h-[40px] h-10 w-10 rounded-xl flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-base cursor-pointer active:scale-95"
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
                                    className="hidden sm:flex min-w-[40px] min-h-[40px] h-10 w-10 rounded-xl items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors font-bold text-sm cursor-pointer active:scale-95"
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
