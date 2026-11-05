import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Loader2, Link as LinkIcon, MapPin } from 'lucide-react';
import { Product, User } from '../../types';

interface UnknownBarcodeSearchStepProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    filteredProducts: Product[];
    selectedProduct: Product | null;
    setSelectedProduct: (p: Product) => void;
    user: User | null;
    isUploading: boolean;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBack: () => void;
    onConfirmMap: () => void;
    siteName?: string;
    siteCode?: string;
}

export const UnknownBarcodeSearchStep: React.FC<UnknownBarcodeSearchStepProps> = ({
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProduct,
    setSelectedProduct,
    user,
    isUploading,
    searchInputRef,
    onKeyDown,
    onBack,
    onConfirmMap,
    siteName,
    siteCode,
}) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {siteName && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                        <span className="font-semibold text-[var(--theme-text-secondary)] uppercase text-[10px] tracking-wider shrink-0">
                            {t('pos.storeLocation') || 'Location'}:
                        </span>
                        <span className="font-bold text-[var(--theme-text-primary)] truncate font-mono text-xs">
                            {siteName}
                        </span>
                    </div>
                    {siteCode && (
                        <span className="font-mono text-[10px] text-[var(--theme-text-secondary)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                            {siteCode}
                        </span>
                    )}
                </div>
            )}

            <p className="text-[var(--theme-text-secondary)] text-sm">
                {t('pos.barcodeSearchHelp')}
            </p>

            <div className="relative">
                <Search className="absolute left-3 top-3 text-[var(--theme-text-secondary)]" size={18} />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('pos.barcodeSearch')}
                    aria-label={t('pos.barcodeSearch')}
                    onFocus={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => {
                            target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                        }, 150);
                    }}
                    className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 py-3 text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] focus:outline-none transition-colors scroll-mt-20 scroll-mb-20 min-h-[44px]"
                    value={searchTerm || ''}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={onKeyDown}
                    autoFocus
                />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredProducts.map(product => {
                    const isLocalStock = product.siteId === user?.siteId || product.site_id === user?.siteId;
                    return (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedProduct?.id === product.id
                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-text-primary)]'
                                : 'bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                }`}
                        >
                            <div className="font-bold text-[var(--theme-text-primary)]">{product.name}</div>
                            <div className="text-xs text-[var(--theme-text-secondary)] flex justify-between items-center mt-1">
                                <span className="font-mono">{product.sku}</span>
                                <div className="flex items-center gap-2">
                                    {isLocalStock ? (
                                        <span className="px-2 py-0.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded text-[10px] font-bold">{t('pos.barcodeStock', { count: product.stock })}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] rounded text-[10px] font-bold">{t('pos.barcodeStock', { count: product.stock })}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {searchTerm && filteredProducts.length === 0 && (
                    <div className="text-center text-[var(--theme-text-muted)] font-medium py-4">{t('pos.barcodeNoProducts')}</div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)]">
                {selectedProduct ? (
                    <div className="text-xs text-[var(--theme-accent)] font-semibold truncate max-w-[200px]">
                        {t('pos.barcodeSelected')} <b>{selectedProduct.name}</b>
                    </div>
                ) : <div />}

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-sm transition-colors cursor-pointer min-h-[44px]"
                    >
                        {t('pos.barcodeBack')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmMap}
                        disabled={!selectedProduct || isUploading}
                        className="px-6 py-2.5 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 font-bold rounded-xl disabled:bg-[var(--theme-bg-subtle)] disabled:text-[var(--theme-text-secondary)]/50 border border-transparent disabled:border-[var(--theme-border)] disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md disabled:shadow-none cursor-pointer text-xs uppercase tracking-wider min-h-[44px]"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <LinkIcon size={16} />}
                        {t('pos.barcodeSubmit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
