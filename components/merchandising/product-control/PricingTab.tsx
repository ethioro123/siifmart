import React from 'react';
import {
    TrendingUp, TrendingDown, Lock, Store, Globe, SlidersHorizontal,
    Check, CheckSquare, RefreshCw, Save, AlertCircle
} from 'lucide-react';
import { Product, Site } from '../../../types';

export type PricingScope = 'single' | 'all' | 'custom';

export interface PricingConfig {
    price: number;
    costPrice: number;
    salePrice: number;
    isOnSale: boolean;
    competitorPrice: number;
    scope: PricingScope;
    selectedSiteIds: string[];
}

interface Props {
    product: Product;
    pricingCfg: PricingConfig;
    setPricingCfg: React.Dispatch<React.SetStateAction<PricingConfig>>;
    handleSavePricing: () => Promise<void>;
    isSaving: boolean;
    showCost: boolean;
    sites: Site[];
    allProducts: Product[];
    currencySymbol?: string;
}

export const PricingTab: React.FC<Props> = ({
    product,
    pricingCfg,
    setPricingCfg,
    handleSavePricing,
    isSaving,
    showCost,
    sites,
    allProducts,
    currencySymbol = 'ETB'
}) => {
    const margin = pricingCfg.price > 0 && pricingCfg.costPrice > 0
        ? ((pricingCfg.price - pricingCfg.costPrice) / pricingCfg.price * 100) : 0;
    const compDiff = pricingCfg.competitorPrice > 0
        ? ((pricingCfg.price - pricingCfg.competitorPrice) / pricingCfg.competitorPrice * 100) : null;

    return (
        <div className="space-y-4">
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                margin < 15 ? 'bg-rose-500/10 border-rose-500/20' : margin > 40 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-secondary)]">Gross Margin</p>
                    <p className={`text-2xl font-bold font-mono tabular-nums ${margin < 15 ? 'text-rose-600 dark:text-rose-400' : margin > 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {margin.toFixed(1)}%
                    </p>
                </div>
                {compDiff !== null && (
                    <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-secondary)]">vs Competitor</p>
                        <p className={`text-sm font-semibold font-mono tabular-nums flex items-center gap-1 justify-end ${compDiff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {compDiff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {compDiff > 0 ? '+' : ''}{compDiff.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            <div>
                <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1.5">Retail Price</label>
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-accent)] font-semibold font-mono">{currencySymbol}</span>
                    <input type="number" min="0" step="0.01" value={pricingCfg.price}
                        aria-label="Retail Price"
                        title="Retail Price"
                        onChange={e => setPricingCfg(c => ({ ...c, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-9 pr-3 py-2.5 text-base font-semibold font-mono tabular-nums text-right text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {showCost && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Cost Price (COGS)</label>
                            <span className="text-[10px] font-mono font-medium uppercase text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Lock size={10} /> Read-only (From PO)
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] font-mono">{currencySymbol}</span>
                            <input type="number" value={pricingCfg.costPrice}
                                readOnly
                                disabled
                                aria-label="Cost Price (COGS) - Read-only from PO"
                                title="Cost Price (COGS) is set by Purchase Orders and cannot be edited manually"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-8 pr-3 py-2 text-sm font-mono tabular-nums text-right text-[var(--theme-text-secondary)] opacity-70 cursor-not-allowed" />
                        </div>
                    </div>
                )}
                <div>
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1.5">Competitor Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] font-mono">{currencySymbol}</span>
                        <input type="number" min="0" step="0.01" value={pricingCfg.competitorPrice || ''}
                            onChange={e => setPricingCfg(c => ({ ...c, competitorPrice: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-8 pr-3 py-2 text-sm font-mono tabular-nums text-right text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors" />
                    </div>
                </div>
            </div>

            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Promotional Sale Price</p>
                    <div onClick={() => setPricingCfg(c => ({ ...c, isOnSale: !c.isOnSale }))}
                        className={`w-9 h-5 rounded-full cursor-pointer relative transition-colors ${pricingCfg.isOnSale ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pricingCfg.isOnSale ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                </div>
                {pricingCfg.isOnSale && (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 font-mono">{currencySymbol}</span>
                        <input type="number" min="0" step="0.01" value={pricingCfg.salePrice || ''}
                            onChange={e => setPricingCfg(c => ({ ...c, salePrice: parseFloat(e.target.value) || 0 }))}
                            placeholder="Sale price..."
                            className="w-full bg-[var(--theme-bg-card)] border border-amber-500/30 rounded-xl pl-8 pr-3 py-2 text-sm font-mono tabular-nums text-right text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                )}
            </div>

            {/* Location Target Scope */}
            <div className="space-y-3 pt-2 border-t border-[var(--theme-border)]">
                <label className="text-xs font-medium text-[var(--theme-text-secondary)] block">Pricing Target Scope (Locations)</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setPricingCfg(c => ({ ...c, scope: 'single' }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            pricingCfg.scope === 'single'
                                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                                <Store size={13} />
                                <span>This Location</span>
                            </div>
                            {pricingCfg.scope === 'single' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[10px] leading-tight ${pricingCfg.scope === 'single' ? 'text-white/80' : 'text-[var(--theme-text-secondary)]'}`}>Only update price at this specific store.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPricingCfg(c => ({ ...c, scope: 'all' }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            pricingCfg.scope === 'all'
                                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                                <Globe size={13} />
                                <span>All Locations</span>
                            </div>
                            {pricingCfg.scope === 'all' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[10px] leading-tight ${pricingCfg.scope === 'all' ? 'text-white/80' : 'text-[var(--theme-text-secondary)]'}`}>Sync price uniform across all network stores.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const allSiteIds = (sites || []).map(s => s.id);
                            setPricingCfg(c => ({
                                ...c,
                                scope: 'custom',
                                selectedSiteIds: c.selectedSiteIds.length > 0 ? c.selectedSiteIds : allSiteIds
                            }));
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            pricingCfg.scope === 'custom'
                                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                                <SlidersHorizontal size={13} />
                                <span>Select Locations</span>
                            </div>
                            {pricingCfg.scope === 'custom' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[10px] leading-tight ${pricingCfg.scope === 'custom' ? 'text-white/80' : 'text-[var(--theme-text-secondary)]'}`}>Choose which stores get updated vs left out.</p>
                    </button>
                </div>

                {pricingCfg.scope === 'custom' && (
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border)]">
                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                <CheckSquare size={13} className="text-[var(--theme-accent)]" />
                                Select Store Target List ({pricingCfg.selectedSiteIds.length} of {(sites || []).length} selected)
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPricingCfg(c => ({ ...c, selectedSiteIds: (sites || []).map(s => s.id) }))}
                                    className="text-xs font-medium text-[var(--theme-accent)] hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-[var(--theme-border)]">|</span>
                                <button
                                    type="button"
                                    onClick={() => setPricingCfg(c => ({ ...c, selectedSiteIds: [product.siteId].filter(Boolean) as string[] }))}
                                    className="text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:underline"
                                >
                                    Only This Location
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {(sites || []).map(site => {
                                const isSelected = pricingCfg.selectedSiteIds.includes(site.id);
                                const siteProd = (allProducts || []).find(p => (p.siteId === site.id || (p as any).site_id === site.id) && p.sku === product.sku);
                                const sitePrice = siteProd ? siteProd.price : null;

                                return (
                                    <label
                                        key={site.id}
                                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] shadow-xs'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select site ${site.name}`}
                                                title={`Select site ${site.name}`}
                                                checked={isSelected}
                                                onChange={e => {
                                                    const checked = e.target.checked;
                                                    setPricingCfg(c => ({
                                                        ...c,
                                                        selectedSiteIds: checked
                                                            ? [...c.selectedSiteIds, site.id]
                                                            : c.selectedSiteIds.filter(id => id !== site.id)
                                                    }));
                                                }}
                                                className="accent-[var(--theme-accent)] w-3.5 h-3.5 cursor-pointer rounded"
                                            />
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{site.name}</p>
                                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono uppercase">{site.code || site.type || 'STORE'}</p>
                                            </div>
                                        </div>
                                        {sitePrice !== null && (
                                            <span className="text-[10px] font-mono font-semibold tabular-nums text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded-md ml-1 shrink-0">
                                                {currencySymbol} {sitePrice}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {pricingCfg.selectedSiteIds.length === 0 && (
                            <p className="text-xs text-rose-500 font-medium text-center py-1 flex items-center justify-center gap-1">
                                <AlertCircle size={13} />
                                At least one store location must be selected
                            </p>
                        )}
                    </div>
                )}
            </div>

            <button onClick={handleSavePricing} disabled={isSaving}
                className="w-full py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : 'Save Pricing'}
            </button>
        </div>
    );
};
