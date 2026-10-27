import React from 'react';
import type { Product, Site } from '../../../types';
import type { PricingConfig, PricingScope } from '../../../types/product-control';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { normalizePriceProposal, sellingMargin, productSiteName } from '../../../utils/priceManager';
import { getSellUnit } from '../../../utils/units';
import { ControlSection, ControlField, ControlFact, ProposalAction, controlInput } from './ControlPrimitives';
export type { PricingConfig, PricingScope } from '../../../types/product-control';
interface Props {
    product: Product; pricingCfg: PricingConfig; setPricingCfg: React.Dispatch<React.SetStateAction<PricingConfig>>;
    handleSavePricing: () => Promise<void>; isSaving: boolean; submitted?: boolean; showCost: boolean;
    sites: Site[]; allProducts?: Product[]; currencySymbol?: string; canDirectEdit?: boolean;
}
export const PricingTab: React.FC<Props> = ({ product, pricingCfg, setPricingCfg, handleSavePricing, isSaving, submitted, showCost, sites, currencySymbol = 'ETB' }) => {
    let normalized: ReturnType<typeof normalizePriceProposal> | null = null; let error = '';
    try { normalized = normalizePriceProposal({ price: pricingCfg.price, salePrice: pricingCfg.salePrice, isOnSale: pricingCfg.isOnSale }); } catch (cause) { error = (cause as Error).message; }
    const current = effectivePrice(product) || 0;
    const proposed = normalized ? effectivePrice(normalized) || 0 : null;
    const margin = normalized ? sellingMargin({ ...normalized, costPrice: product.costPrice }) : null;
    const delta = proposed === null ? null : proposed - current;
    const discount = normalized?.isOnSale && normalized.salePrice ? (1 - normalized.salePrice / normalized.price) * 100 : null;
    const operationalSites = sites.filter(site => !['Administration', 'Administrative'].includes(site.type));
    const labels: Record<PricingScope, string> = { single: 'This location', all: 'All matching locations', custom: 'Choose locations' };
    return <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <ControlSection title="Proposed selling price" description={`Price per ${getSellUnit(product.unit).shortLabel}. Selling prices round to the nearest whole number; recorded costs keep their precision.`}>
                <ControlField label={`Regular price (${currencySymbol})`}><input className={controlInput} type="number" min="1" step="1" value={pricingCfg.price || ''} onChange={event => setPricingCfg(cfg => ({ ...cfg, price: Number(event.target.value) }))} /></ControlField>
                <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] p-3 text-sm font-medium"><span>Promotional price active</span><input className="h-5 w-5 accent-[var(--theme-accent)]" type="checkbox" checked={pricingCfg.isOnSale} onChange={event => setPricingCfg(cfg => ({ ...cfg, isOnSale: event.target.checked }))} /></label>
                {pricingCfg.isOnSale && <ControlField label={`Sale price (${currencySymbol})`} help="Must round to a positive amount below the regular price."><input className={controlInput} type="number" min="1" step="1" value={pricingCfg.salePrice || ''} onChange={event => setPricingCfg(cfg => ({ ...cfg, salePrice: Number(event.target.value) }))} /></ControlField>}
                {showCost && <dl className="grid grid-cols-2 gap-4 border-t border-[var(--theme-border)] pt-4"><ControlFact label="Recorded cost (read-only)" value={product.costPrice && product.costPrice > 0 ? `${currencySymbol} ${product.costPrice}` : 'Unavailable'} /><ControlFact label="Competitor price (recorded)" value={product.competitorPrice && product.competitorPrice > 0 ? `${currencySymbol} ${product.competitorPrice}` : 'Not recorded'} /></dl>}
            </ControlSection>
            <ControlSection title="Price impact at this location" description={productSiteName(product, sites)}>
                <p className="text-2xl font-semibold tabular-nums">{currencySymbol} {current.toLocaleString()} <span className="text-[var(--theme-text-secondary)]">→</span> {proposed === null ? '—' : proposed.toLocaleString()}</p>
                <dl className="grid grid-cols-2 gap-4"><ControlFact label="Selling-price change" value={delta === null ? 'Enter a valid price' : `${delta > 0 ? '+' : ''}${delta.toLocaleString()} ${currencySymbol}${current > 0 ? ` (${(delta / current * 100).toFixed(1)}%)` : ''}`} /><ControlFact label="Sale discount" value={discount === null ? 'Sale inactive' : `${discount.toFixed(1)}%`} /><ControlFact label="Margin at proposed price" value={margin === null ? 'Cost unavailable' : `${margin.toFixed(1)}%`} /><ControlFact label="Finance signoff" value={margin === null ? 'Assessed during review' : margin < 15 ? 'Required below 15% margin' : 'Not indicated at this price'} /></dl>
                <p className="text-xs leading-relaxed text-[var(--theme-text-secondary)]">This margin applies to the selected record. Each target location keeps its own recorded cost. Submitting a proposal does not activate a promotion or change the live price.</p>
            </ControlSection>
        </div>
        <ControlSection title="Where should this proposal apply?" description="The next screen lists the exact product records and locations before anything is submitted.">
            <fieldset><legend className="sr-only">Price proposal scope</legend><div className="grid gap-2 sm:grid-cols-3">{(['single', 'all', 'custom'] as const).map(scope => <label key={scope} className={`flex min-h-[52px] cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${pricingCfg.scope === scope ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-subtle)]' : 'border-[var(--theme-border)]'}`}><input type="radio" name="price-scope" checked={pricingCfg.scope === scope} onChange={() => setPricingCfg(cfg => ({ ...cfg, scope }))} className="accent-[var(--theme-accent)]" />{labels[scope]}</label>)}</div></fieldset>
            {pricingCfg.scope === 'single' && <p className="text-sm text-[var(--theme-text-secondary)]">{productSiteName(product, sites)} · {product.sku}</p>}
            {pricingCfg.scope === 'all' && <p className="text-sm text-[var(--theme-text-secondary)]">Matching SKU records inside your authorized country and active territory lens.</p>}
            {pricingCfg.scope === 'custom' && <div className="space-y-3"><p className="text-sm text-[var(--theme-text-secondary)]">{pricingCfg.selectedSiteIds.length} location(s) selected. Locations without a matching product record are excluded from the preview.</p><div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-[var(--theme-border)] p-3 sm:grid-cols-2">{operationalSites.map(site => <label key={site.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--theme-accent)]" checked={pricingCfg.selectedSiteIds.includes(site.id)} onChange={event => setPricingCfg(cfg => ({ ...cfg, selectedSiteIds: event.target.checked ? [...cfg.selectedSiteIds, site.id] : cfg.selectedSiteIds.filter(id => id !== site.id) }))} />{site.name}</label>)}</div></div>}
        </ControlSection>
        <ProposalAction pending={isSaving} disabled={submitted || Boolean(error) || (pricingCfg.scope === 'custom' && pricingCfg.selectedSiteIds.length === 0)} error={error} label="Review price proposals" onClick={handleSavePricing} />
    </div>;
};
