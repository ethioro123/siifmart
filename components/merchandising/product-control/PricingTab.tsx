import React from 'react';
import {
    TrendingUp, TrendingDown, Lock, Store, Globe, SlidersHorizontal,
    Check, CheckSquare, RefreshCw, Save
} from 'lucide-react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';

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
}

export const PricingTab: React.FC<Props> = ({
    product,
    pricingCfg,
    setPricingCfg,
    handleSavePricing,
    isSaving,
    showCost,
    sites,
    allProducts
}) => {
    const margin = pricingCfg.price > 0 && pricingCfg.costPrice > 0
        ? ((pricingCfg.price - pricingCfg.costPrice) / pricingCfg.price * 100) : 0;
    const compDiff = pricingCfg.competitorPrice > 0
        ? ((pricingCfg.price - pricingCfg.competitorPrice) / pricingCfg.competitorPrice * 100) : null;

    return (
        <div className="space-y-4">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
                margin < 15 ? 'bg-red-500/5 border-red-500/20' : margin > 40 ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
                <div>
                    <p className="text-[9px] font-bold uppercase text-stone-400">Gross Margin</p>
                    <p className={`text-2xl font-black font-mono ${margin < 15 ? 'text-red-500' : margin > 40 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {margin.toFixed(1)}%
                    </p>
                </div>
                {compDiff !== null && (
                    <div className="text-right">
                        <p className="text-[9px] font-bold uppercase text-stone-400">vs Competitor</p>
                        <p className={`text-sm font-black font-mono flex items-center gap-1 justify-end ${compDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {compDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {compDiff > 0 ? '+' : ''}{compDiff.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1.5">Retail Price</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{CURRENCY_SYMBOL}</span>
                    <input type="number" min="0" step="0.01" value={pricingCfg.price}
                        aria-label="Retail Price"
                        title="Retail Price"
                        onChange={e => setPricingCfg(c => ({ ...c, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-3 text-lg font-black font-mono text-right text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {showCost && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[9px] font-bold uppercase text-stone-400">Cost Price (COGS)</label>
                            <span className="text-[8px] font-black uppercase text-stone-400 bg-stone-200 dark:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Lock size={8} /> Read-only (From PO)
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono">{CURRENCY_SYMBOL}</span>
                            <input type="number" value={pricingCfg.costPrice}
                                readOnly
                                disabled
                                aria-label="Cost Price (COGS) - Read-only from PO"
                                title="Cost Price (COGS) is set by Purchase Orders and cannot be edited manually"
                                className="w-full bg-stone-100 dark:bg-black/50 border border-stone-200 dark:border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-right text-stone-500 dark:text-stone-400 opacity-75 cursor-not-allowed" />
                        </div>
                    </div>
                )}
                <div>
                    <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1.5">Competitor Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono">{CURRENCY_SYMBOL}</span>
                        <input type="number" min="0" step="0.01" value={pricingCfg.competitorPrice || ''}
                            onChange={e => setPricingCfg(c => ({ ...c, competitorPrice: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            className="w-full bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-right text-stone-600 dark:text-stone-300 focus:outline-none focus:border-[#2C5E3B] transition-colors" />
                    </div>
                </div>
            </div>

            <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Promotional Sale Price</p>
                    <div onClick={() => setPricingCfg(c => ({ ...c, isOnSale: !c.isOnSale }))}
                        className={`w-9 h-5 rounded-full cursor-pointer relative transition-colors ${pricingCfg.isOnSale ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pricingCfg.isOnSale ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                </div>
                {pricingCfg.isOnSale && (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-mono">{CURRENCY_SYMBOL}</span>
                        <input type="number" min="0" step="0.01" value={pricingCfg.salePrice || ''}
                            onChange={e => setPricingCfg(c => ({ ...c, salePrice: parseFloat(e.target.value) || 0 }))}
                            placeholder="Sale price..."
                            className="w-full bg-white dark:bg-black/30 border border-orange-300 dark:border-orange-500/30 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-right text-orange-700 dark:text-orange-300 focus:outline-none" />
                    </div>
                )}
            </div>

            {/* Location Target Scope */}
            <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-white/5">
                <label className="text-[9px] font-bold uppercase text-stone-400 block">Pricing Target Scope (Locations)</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setPricingCfg(c => ({ ...c, scope: 'single' }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            pricingCfg.scope === 'single'
                                ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                : 'bg-stone-50 dark:bg-black/15 border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-[#2C5E3B]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-black text-xs">
                                <Store size={13} />
                                <span>This Location</span>
                            </div>
                            {pricingCfg.scope === 'single' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[9px] leading-tight ${pricingCfg.scope === 'single' ? 'text-white/80' : 'text-stone-400'}`}>Only update price at this specific store.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPricingCfg(c => ({ ...c, scope: 'all' }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            pricingCfg.scope === 'all'
                                ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                : 'bg-stone-50 dark:bg-black/15 border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-[#2C5E3B]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-black text-xs">
                                <Globe size={13} />
                                <span>All Locations</span>
                            </div>
                            {pricingCfg.scope === 'all' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[9px] leading-tight ${pricingCfg.scope === 'all' ? 'text-white/80' : 'text-stone-400'}`}>Sync price uniform across all network stores.</p>
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
                                ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                : 'bg-stone-50 dark:bg-black/15 border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-[#2C5E3B]/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-black text-xs">
                                <SlidersHorizontal size={13} />
                                <span>Select Locations</span>
                            </div>
                            {pricingCfg.scope === 'custom' && <Check size={13} className="text-white" />}
                        </div>
                        <p className={`text-[9px] leading-tight ${pricingCfg.scope === 'custom' ? 'text-white/80' : 'text-stone-400'}`}>Choose which stores get updated vs left out.</p>
                    </button>
                </div>

                {pricingCfg.scope === 'custom' && (
                    <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1.5">
                                <CheckSquare size={12} />
                                Select Store Target List ({pricingCfg.selectedSiteIds.length} of {(sites || []).length} selected)
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPricingCfg(c => ({ ...c, selectedSiteIds: (sites || []).map(s => s.id) }))}
                                    className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-stone-300 dark:text-stone-600">|</span>
                                <button
                                    type="button"
                                    onClick={() => setPricingCfg(c => ({ ...c, selectedSiteIds: [product.siteId].filter(Boolean) as string[] }))}
                                    className="text-[9px] font-bold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:underline"
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
                                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-white dark:bg-black/40 border-[#2C5E3B]/40 dark:border-[#A9CBA2]/40 shadow-2xs'
                                                : 'bg-stone-100/60 dark:bg-black/10 border-stone-200/60 dark:border-white/5 opacity-60 hover:opacity-100'
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
                                                className="accent-[#2C5E3B] w-3.5 h-3.5 cursor-pointer rounded"
                                            />
                                            <div className="truncate">
                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{site.name}</p>
                                                <p className="text-[8px] text-stone-400 font-mono uppercase">{site.code || site.type || 'STORE'}</p>
                                            </div>
                                        </div>
                                        {sitePrice !== null && (
                                            <span className="text-[9px] font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-black/30 px-1.5 py-0.5 rounded ml-1 flex-shrink-0">
                                                {CURRENCY_SYMBOL}{sitePrice}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {pricingCfg.selectedSiteIds.length === 0 && (
                            <p className="text-[9px] text-red-500 font-bold text-center py-1">⚠️ At least one store location must be selected!</p>
                        )}
                    </div>
                )}
            </div>

            <button onClick={handleSavePricing} disabled={isSaving}
                className="w-full py-3 bg-[#2C5E3B] hover:bg-[#1B3520] text-white rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : 'Save Pricing'}
            </button>
        </div>
    );
};
