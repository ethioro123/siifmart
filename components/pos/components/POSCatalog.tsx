import React from 'react';
import { Box, Plus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit } from '../../../utils/units';
import { formatPackBadge } from '../../procurement/utils';
import { Product } from '../../../types';

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
    const { filteredProducts, addToCart } = usePOS();

    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;
    const native = isNativeApp ? (window as any).Neutralino.os : null;

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <Box size={64} className="text-[#4D6E56] dark:text-gray-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">{t('pos.noProductsAvailable')}</h3>
                    <p className="text-[#4D6E56] dark:text-[#7A9E83] max-w-md">
                        {t('pos.productsWillAppear')}
                        <br />
                        <button
                            onClick={() => navigate('/pos-dashboard')}
                            className="text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline mt-2 font-medium"
                        >
                            {t('pos.goToPOSCommand')}
                        </button>
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {paginatedProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    addToCart(product);
                                    if (isNativeApp && native) {
                                        native.vibrate(50);
                                    }
                                }}
                                disabled={product.stock === 0}
                                className={`text-left bg-white/70 dark:bg-[#18201B]/30 border rounded-2xl p-4 hover:bg-white dark:hover:bg-[#18201B]/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full active:scale-[0.98] shadow-sm hover:shadow-md ${product.stock <= 0 ? 'border-red-500/80 dark:border-red-500/60 opacity-60 cursor-not-allowed' : 'border-[#E2DCCE] dark:border-emerald-950/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30'}`}
                            >
                                <div className="aspect-square rounded-xl bg-[#F4F0E6] dark:bg-black/35 mb-4 overflow-hidden relative border border-[#E2DCCE]/40 dark:border-white/5 flex items-center justify-center">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                            <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 items-center justify-center hidden">
                                                <Package size={32} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 flex items-center justify-center">
                                            <Package size={32} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                        </div>
                                    )}

                                    {/* Stock indicator */}
                                    {(() => {
                                        const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                        const isOutOfStock = product.stock <= 0;
                                        const isLowStock = product.stock < threshold;
                                        
                                        let colorClasses = 'bg-white/80 dark:bg-black/50 text-[#4D6E56] dark:text-gray-300 border-[#E2DCCE]/60 dark:border-white/10';
                                        if (isOutOfStock) {
                                            colorClasses = 'bg-red-600 dark:bg-red-700 text-white border-transparent shadow-none';
                                        } else if (isLowStock) {
                                            colorClasses = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
                                        }

                                        return (
                                            <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1 ${colorClasses}`}>
                                                {isOutOfStock ? (
                                                    <span>{t('common.outOfStock')}</span>
                                                ) : (
                                                    <>
                                                        {product.stock.toLocaleString(undefined, { maximumFractionDigits: getSellUnit(product.unit).category === 'count' ? 0 : 2 })}
                                                        <span className="text-[7px] opacity-70 uppercase">{getSellUnit(product.unit).shortLabel}</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {product.isOnSale && (
                                        <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-wider shadow-sm">
                                            {t('pos.sale')}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] text-xs md:text-sm line-clamp-2 min-h-[2.5rem] leading-tight mb-1 group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors">{product.name}</h3>
                                    {(() => {
                                        const badge = formatPackBadge(product);
                                        return badge ? (
                                            <span className="inline-block mb-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest">
                                                {badge}
                                            </span>
                                        ) : null;
                                    })()}
                                    <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-[#E2DCCE]/30 dark:border-white/5">
                                        <div className="flex items-baseline gap-1.5">
                                            {product.isOnSale && product.salePrice ? (
                                                <>
                                                    <p className="text-amber-600 dark:text-amber-400 font-extrabold text-base tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.salePrice)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[8px] text-amber-600/60 dark:text-amber-400/60 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                    <p className="text-stone-400 dark:text-gray-600 text-[10px] line-through">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</p>
                                                </>
                                            ) : (
                                                <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-base tracking-tight">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[8px] text-[#4D6E56]/60 dark:text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-[#2C5E3B]/10 dark:bg-white/5 border border-[#2C5E3B]/20 dark:border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2C5E3B]/20 dark:group-hover:bg-white/10">
                                            <Plus size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-8 border-t border-[#E2DCCE]/40 dark:border-white/5 mt-6 px-1">
                            <span className="text-xs text-[#4D6E56] dark:text-stone-400 font-semibold">
                                Showing <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                                </span>{' '}
                                of <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{filteredProducts.length}</span> products
                            </span>
                            
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs cursor-pointer"
                                >
                                    &laquo;
                                </button>
                                
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs cursor-pointer"
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
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-all cursor-pointer ${currentPage === p
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
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs cursor-pointer"
                                >
                                    &rsaquo;
                                </button>
                                
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs cursor-pointer"
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
